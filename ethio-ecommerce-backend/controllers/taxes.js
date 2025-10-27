const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const TaxRule = require('../models/TaxRule');
const Order = require('../models/Order');

// @desc    Get all tax rules
// @route   GET /api/taxes
// @access  Private (Admin)
exports.getTaxRules = asyncHandler(async (req, res, next) => {
  const taxRules = await TaxRule.find()
    .populate('categories', 'name code')
    .populate('products', 'name sku')
    .sort('priority');

  res.status(200).json({
    success: true,
    count: taxRules.length,
    data: taxRules
  });
});

// @desc    Get single tax rule
// @route   GET /api/taxes/:id
// @access  Private (Admin)
exports.getTaxRule = asyncHandler(async (req, res, next) => {
  const taxRule = await TaxRule.findById(req.params.id)
    .populate('categories', 'name code')
    .populate('products', 'name sku');

  if (!taxRule) {
    return next(new ErrorResponse('Tax rule not found', 404));
  }

  res.status(200).json({
    success: true,
    data: taxRule
  });
});

// @desc    Create tax rule
// @route   POST /api/taxes
// @access  Private (Admin)
exports.createTaxRule = asyncHandler(async (req, res, next) => {
  const taxRule = await TaxRule.create(req.body);

  res.status(201).json({
    success: true,
    data: taxRule
  });
});

// @desc    Update tax rule
// @route   PUT /api/taxes/:id
// @access  Private (Admin)
exports.updateTaxRule = asyncHandler(async (req, res, next) => {
  let taxRule = await TaxRule.findById(req.params.id);

  if (!taxRule) {
    return next(new ErrorResponse('Tax rule not found', 404));
  }

  taxRule = await TaxRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: taxRule
  });
});

// @desc    Delete tax rule
// @route   DELETE /api/taxes/:id
// @access  Private (Admin)
exports.deleteTaxRule = asyncHandler(async (req, res, next) => {
  const taxRule = await TaxRule.findById(req.params.id);

  if (!taxRule) {
    return next(new ErrorResponse('Tax rule not found', 404));
  }

  await taxRule.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Calculate taxes for order
// @route   POST /api/taxes/calculate
// @access  Public
exports.calculateTaxes = asyncHandler(async (req, res, next) => {
  const { items, shippingAddress, shippingCost = 0, currency = 'ETB' } = req.body;

  if (!items || !shippingAddress) {
    return next(new ErrorResponse('Please provide items and shipping address', 400));
  }

  const { country = 'ET', region } = shippingAddress;

  // Get applicable tax rules
  const taxRules = await TaxRule.find({
    country,
    $or: [
      { region: 'all' },
      { region: region }
    ],
    isActive: true,
    validFrom: { $lte: new Date() },
    $or: [
      { validUntil: { $gte: new Date() } },
      { validUntil: null }
    ]
  }).populate('categories products').sort('priority');

  let totalTax = 0;
  const taxBreakdown = [];
  const itemTaxes = [];

  // Calculate taxes for each item
  for (const item of items) {
    let itemTax = 0;
    const applicableRules = [];

    for (const rule of taxRules) {
      // Check if rule applies to this item
      const appliesToProduct = rule.appliesTo.products && 
        (rule.products.length === 0 || rule.products.some(p => p._id.toString() === item.product)) &&
        (rule.exceptions.length === 0 || !rule.exceptions.some(p => p._id.toString() === item.product));

      const appliesToCategory = rule.appliesTo.products && 
        rule.categories.length > 0 && 
        item.category && 
        rule.categories.some(c => c._id.toString() === item.category);

      if (appliesToProduct || appliesToCategory) {
        const taxAmount = (item.price * item.quantity * rule.rate) / 100;
        
        if (rule.isCompound) {
          // Compound tax: apply tax on top of previous taxes
          itemTax += taxAmount;
        } else {
          // Simple tax: apply only on base price
          itemTax = taxAmount;
        }

        applicableRules.push({
          ruleId: rule._id,
          name: rule.name,
          rate: rule.rate,
          amount: taxAmount
        });

        // For simple taxes, only apply the highest priority rule
        if (!rule.isCompound) break;
      }
    }

    itemTaxes.push({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      tax: itemTax,
      rules: applicableRules
    });

    totalTax += itemTax;
  }

  // Calculate shipping tax
  let shippingTax = 0;
  const shippingRules = taxRules.filter(rule => rule.appliesTo.shipping);
  
  for (const rule of shippingRules) {
    shippingTax += (shippingCost * rule.rate) / 100;
  }

  totalTax += shippingTax;

  // Prepare response
  const taxCalculation = {
    subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    shipping: shippingCost,
    tax: {
      total: totalTax,
      breakdown: {
        products: itemTaxes.reduce((sum, item) => sum + item.tax, 0),
        shipping: shippingTax
      },
      items: itemTaxes,
      shippingRules: shippingRules.map(rule => ({
        ruleId: rule._id,
        name: rule.name,
        rate: rule.rate,
        amount: shippingTax
      }))
    },
    total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + shippingCost + totalTax,
    currency: currency
  };

  res.status(200).json({
    success: true,
    data: taxCalculation
  });
});

// @desc    Get tax rates by location
// @route   GET /api/taxes/rates/:country/:region?
// @access  Public
exports.getTaxRates = asyncHandler(async (req, res, next) => {
  const { country, region } = req.params;

  const taxRules = await TaxRule.find({
    country: country.toUpperCase(),
    $or: [
      { region: 'all' },
      { region: region }
    ],
    isActive: true,
    validFrom: { $lte: new Date() },
    $or: [
      { validUntil: { $gte: new Date() } },
      { validUntil: null }
    ]
  }).select('name taxType rate isCompound appliesTo');

  res.status(200).json({
    success: true,
    data: {
      country,
      region: region || 'all',
      taxRates: taxRules,
      timestamp: new Date()
    }
  });
});