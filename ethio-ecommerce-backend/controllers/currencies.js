const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Currency = require('../models/Currency');
const axios = require('axios');

// @desc    Get all currencies
// @route   GET /api/currencies
// @access  Public
exports.getCurrencies = asyncHandler(async (req, res, next) => {
  const currencies = await Currency.find({ isActive: true }).sort('code');

  res.status(200).json({
    success: true,
    count: currencies.length,
    data: currencies
  });
});

// @desc    Get single currency
// @route   GET /api/currencies/:code
// @access  Public
exports.getCurrency = asyncHandler(async (req, res, next) => {
  const currency = await Currency.findOne({ 
    code: req.params.code.toUpperCase() 
  });

  if (!currency) {
    return next(new ErrorResponse('Currency not found', 404));
  }

  res.status(200).json({
    success: true,
    data: currency
  });
});

// @desc    Create currency
// @route   POST /api/currencies
// @access  Private (Admin)
exports.createCurrency = asyncHandler(async (req, res, next) => {
  const currency = await Currency.create(req.body);

  res.status(201).json({
    success: true,
    data: currency
  });
});

// @desc    Update currency
// @route   PUT /api/currencies/:code
// @access  Private (Admin)
exports.updateCurrency = asyncHandler(async (req, res, next) => {
  let currency = await Currency.findOne({ 
    code: req.params.code.toUpperCase() 
  });

  if (!currency) {
    return next(new ErrorResponse('Currency not found', 404));
  }

  currency = await Currency.findOneAndUpdate(
    { code: req.params.code.toUpperCase() },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: currency
  });
});

// @desc    Delete currency
// @route   DELETE /api/currencies/:code
// @access  Private (Admin)
exports.deleteCurrency = asyncHandler(async (req, res, next) => {
  const currency = await Currency.findOne({ 
    code: req.params.code.toUpperCase() 
  });

  if (!currency) {
    return next(new ErrorResponse('Currency not found', 404));
  }

  // Prevent deletion of base currency
  if (currency.isBaseCurrency) {
    return next(new ErrorResponse('Cannot delete base currency', 400));
  }

  await currency.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update exchange rates
// @route   POST /api/currencies/update-rates
// @access  Private (Admin)
exports.updateExchangeRates = asyncHandler(async (req, res, next) => {
  try {
    const baseCurrency = await Currency.findOne({ isBaseCurrency: true });
    
    if (!baseCurrency) {
      return next(new ErrorResponse('Base currency not found', 404));
    }

    // Using a free currency API (example with exchangerate-api.com)
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency.code}`
    );

    const rates = response.data.rates;

    // Update all active currencies
    const currencies = await Currency.find({ isActive: true });
    
    const updatePromises = currencies.map(async (currency) => {
      if (currency.code !== baseCurrency.code && rates[currency.code]) {
        currency.exchangeRate = rates[currency.code];
        currency.lastUpdated = new Date();
        await currency.save();
      }
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Exchange rates updated successfully',
      data: {
        base: baseCurrency.code,
        updated: currencies.length - 1,
        timestamp: new Date()
      }
    });

  } catch (error) {
    return next(new ErrorResponse('Failed to update exchange rates', 500));
  }
});

// @desc    Convert amount between currencies
// @route   POST /api/currencies/convert
// @access  Public
exports.convertCurrency = asyncHandler(async (req, res, next) => {
  const { from, to, amount } = req.body;

  if (!from || !to || !amount) {
    return next(new ErrorResponse('Please provide from, to, and amount', 400));
  }

  const fromCurrency = await Currency.findOne({ 
    code: from.toUpperCase(), 
    isActive: true 
  });
  const toCurrency = await Currency.findOne({ 
    code: to.toUpperCase(), 
    isActive: true 
  });

  if (!fromCurrency || !toCurrency) {
    return next(new ErrorResponse('Invalid currency code', 400));
  }

  // Convert to base currency first, then to target currency
  const amountInBase = amount / fromCurrency.exchangeRate;
  const convertedAmount = amountInBase * toCurrency.exchangeRate;

  res.status(200).json({
    success: true,
    data: {
      from: fromCurrency.code,
      to: toCurrency.code,
      originalAmount: parseFloat(amount),
      convertedAmount: parseFloat(convertedAmount.toFixed(toCurrency.decimalPlaces)),
      exchangeRate: toCurrency.exchangeRate / fromCurrency.exchangeRate,
      timestamp: new Date()
    }
  });
});

// @desc    Set base currency
// @route   PUT /api/currencies/:code/set-base
// @access  Private (Admin)
exports.setBaseCurrency = asyncHandler(async (req, res, next) => {
  const currency = await Currency.findOne({ 
    code: req.params.code.toUpperCase() 
  });

  if (!currency) {
    return next(new ErrorResponse('Currency not found', 404));
  }

  // Update all currencies to not be base
  await Currency.updateMany({}, { $set: { isBaseCurrency: false } });

  // Set this currency as base
  currency.isBaseCurrency = true;
  currency.exchangeRate = 1; // Base currency always has exchange rate 1
  await currency.save();

  res.status(200).json({
    success: true,
    data: currency
  });
});