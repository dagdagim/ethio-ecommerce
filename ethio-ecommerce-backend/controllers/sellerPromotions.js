const SellerPromotion = require('../models/SellerPromotion');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { applyPromotionsToProducts } = require('../utils/promotionSync');

const sanitize = (payload = {}) => {
  const allowed = [
    'title',
    'type',
    'discountValue',
    'minSpend',
    'startDate',
    'endDate',
    'audience',
    'description',
    'status',
    'performance',
    'idea'
  ];

  return allowed.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

const formatPromotion = (doc) => {
  const promoObj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, user, createdAt, updatedAt, ...rest } = promoObj;
  return {
    id: _id || promoObj.id,
    ...rest,
    startDate: rest.startDate ? new Date(rest.startDate).toISOString() : null,
    endDate: rest.endDate ? new Date(rest.endDate).toISOString() : null,
    performance: typeof rest.performance === 'number' ? rest.performance : 0,
    createdAt,
    updatedAt
  };
};

exports.listSellerPromotions = asyncHandler(async (req, res) => {
  const promos = await SellerPromotion.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(promos.map(formatPromotion));
});

exports.getSellerPromotion = asyncHandler(async (req, res, next) => {
  const promo = await SellerPromotion.findOne({ _id: req.params.id, user: req.user._id });

  if (!promo) {
    return next(new ErrorResponse('Promotion not found', 404));
  }

  res.json(formatPromotion(promo));
});

exports.createSellerPromotion = asyncHandler(async (req, res) => {
  const payload = sanitize(req.body);
  payload.user = req.user._id;

  if (payload.startDate) payload.startDate = new Date(payload.startDate);
  if (payload.endDate) payload.endDate = new Date(payload.endDate);

  const promo = await SellerPromotion.create(payload);
  await applyPromotionsToProducts(req.user._id);
  res.status(201).json(formatPromotion(promo));
});

exports.updateSellerPromotion = asyncHandler(async (req, res, next) => {
  const payload = sanitize(req.body);

  if (payload.startDate) payload.startDate = new Date(payload.startDate);
  if (payload.endDate) payload.endDate = new Date(payload.endDate);

  const promo = await SellerPromotion.findOne({ _id: req.params.id, user: req.user._id });

  if (!promo) {
    return next(new ErrorResponse('Promotion not found', 404));
  }

  Object.assign(promo, payload);
  await promo.save();
  await applyPromotionsToProducts(req.user._id);

  res.json(formatPromotion(promo));
});

exports.deleteSellerPromotion = asyncHandler(async (req, res, next) => {
  const promo = await SellerPromotion.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!promo) {
    return next(new ErrorResponse('Promotion not found', 404));
  }

  await applyPromotionsToProducts(req.user._id);

  res.status(204).send();
});
