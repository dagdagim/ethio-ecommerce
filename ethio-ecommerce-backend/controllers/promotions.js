const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Promotion = require('../models/Promotion');
const Order = require('../models/Order');

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private (Admin/Seller)
exports.getPromotions = asyncHandler(async (req, res, next) => {
  let query;

  // If user is seller, only show their promotions and global promotions
  if (req.user.role === 'seller') {
    query = Promotion.find({
      $or: [
        { scope: 'global' },
        { createdBy: req.user.id }
      ]
    });
  } else {
    query = Promotion.find();
  }

  const promotions = await query
    .populate('categories', 'name code')
    .populate('products', 'name images price')
    .populate('sellers', 'name')
    .populate('createdBy', 'name')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: promotions.length,
    data: promotions
  });
});

// @desc    Get single promotion
// @route   GET /api/promotions/:id
// @access  Private (Admin/Seller)
exports.getPromotion = asyncHandler(async (req, res, next) => {
  let promotion = await Promotion.findById(req.params.id)
    .populate('categories', 'name code')
    .populate('products', 'name images price')
    .populate('sellers', 'name')
    .populate('createdBy', 'name');

  if (!promotion) {
    return next(new ErrorResponse('Promotion not found', 404));
  }

  // Check if seller is authorized to view this promotion
  if (req.user.role === 'seller' && promotion.scope === 'seller' && promotion.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this promotion', 403));
  }

  res.status(200).json({
    success: true,
    data: promotion
  });
});

// @desc    Create promotion
// @route   POST /api/promotions
// @access  Private (Admin/Seller)
exports.createPromotion = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  // For sellers, set scope to seller
  if (req.user.role === 'seller') {
    req.body.scope = 'seller';
  }

  const promotion = await Promotion.create(req.body);

  res.status(201).json({
    success: true,
    data: promotion
  });
});

// @desc    Update promotion
// @route   PUT /api/promotions/:id
// @access  Private (Admin/Seller)
exports.updatePromotion = asyncHandler(async (req, res, next) => {
  let promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    return next(new ErrorResponse('Promotion not found', 404));
  }

  // Check if user is authorized to update this promotion
  if (req.user.role === 'seller' && promotion.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this promotion', 403));
  }

  promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: promotion
  });
});

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
// @access  Private (Admin/Seller)
exports.deletePromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    return next(new ErrorResponse('Promotion not found', 404));
  }

  // Check if user is authorized to delete this promotion
  if (req.user.role === 'seller' && promotion.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this promotion', 403));
  }

  await promotion.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Validate promotion code
// @route   POST /api/promotions/validate
// @access  Public
exports.validatePromotion = asyncHandler(async (req, res, next) => {
  const { code, cartItems, totalAmount, userId } = req.body;

  const promotion = await Promotion.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  });

  if (!promotion) {
    return next(new ErrorResponse('Invalid or expired promotion code', 404));
  }

  // Check usage limit
  if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
    return next(new ErrorResponse('Promotion code has reached its usage limit', 400));
  }

  // Check minimum order amount
  if (totalAmount < promotion.minimumOrderAmount) {
    return next(new ErrorResponse(`Minimum order amount of ${promotion.minimumOrderAmount} is required`, 400));
  }

  // Check user usage limit
  if (userId) {
    const userUsageCount = await Order.countDocuments({
      customer: userId,
      'promotion.code': code
    });

    if (userUsageCount >= promotion.userUsageLimit) {
      return next(new ErrorResponse('You have already used this promotion code', 400));
    }
  }

  // Check if promotion applies to cart items
  const applicableItems = cartItems.filter(item => {
    if (promotion.appliesTo === 'all_products') return true;
    if (promotion.appliesTo === 'specific_categories' && promotion.categories.includes(item.product.category)) return true;
    if (promotion.appliesTo === 'specific_products' && promotion.products.includes(item.product._id)) return true;
    if (promotion.appliesTo === 'specific_sellers' && promotion.sellers.includes(item.product.seller)) return true;
    return false;
  });

  if (applicableItems.length === 0) {
    return next(new ErrorResponse('Promotion code not applicable to any items in your cart', 400));
  }

  // Calculate discount
  let discount = 0;
  let discountDetails = {};

  switch (promotion.type) {
    case 'percentage':
      const applicableTotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      discount = (applicableTotal * promotion.value) / 100;
      if (promotion.maximumDiscount && discount > promotion.maximumDiscount) {
        discount = promotion.maximumDiscount;
      }
      break;

    case 'fixed_amount':
      discount = promotion.value;
      break;

    case 'free_shipping':
      discount = 0; // Shipping cost will be handled separately
      discountDetails.freeShipping = true;
      break;

    case 'buy_x_get_y':
      // For simplicity, we'll apply the discount to the cheapest item in applicable items
      const eligibleItems = applicableItems.filter(item => item.quantity >= promotion.buyQuantity);
      if (eligibleItems.length > 0) {
        const cheapestItem = eligibleItems.reduce((min, item) => item.price < min.price ? item : min);
        const freeQuantity = Math.floor(cheapestItem.quantity / promotion.buyQuantity) * promotion.getQuantity;
        discount = cheapestItem.price * freeQuantity;
        discountDetails.freeItems = freeQuantity;
        discountDetails.productId = cheapestItem.product._id;
      }
      break;
  }

  res.status(200).json({
    success: true,
    data: {
      promotion: {
        id: promotion._id,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
        minimumOrderAmount: promotion.minimumOrderAmount,
        maximumDiscount: promotion.maximumDiscount,
        ...discountDetails
      },
      discount: discount,
      finalAmount: totalAmount - discount
    }
  });
});

// @desc    Get promotion analytics
// @route   GET /api/promotions/:id/analytics
// @access  Private (Admin/Seller)
exports.getPromotionAnalytics = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    return next(new ErrorResponse('Promotion not found', 404));
  }

  // Get orders that used this promotion
  const orders = await Order.find({ 'promotion.code': promotion.code })
    .select('totalAmount createdAt')
    .sort('createdAt');

  const analytics = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    totalDiscount: orders.reduce((sum, order) => sum + (order.promotion?.discount || 0), 0),
    usageRate: promotion.usageLimit ? (promotion.usedCount / promotion.usageLimit) * 100 : null,
    ordersOverTime: orders.map(order => ({
      date: order.createdAt,
      amount: order.totalAmount,
      discount: order.promotion?.discount || 0
    }))
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});