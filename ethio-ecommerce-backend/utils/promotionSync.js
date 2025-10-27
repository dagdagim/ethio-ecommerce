const SellerPromotion = require('../models/SellerPromotion');
const Product = require('../models/Product');

const calculateDiscount = (basePrice, promotion) => {
  let finalPrice = Number(basePrice) || 0;
  let percent = 0;

  if (!promotion || basePrice === undefined || basePrice === null) {
    return { finalPrice, percent };
  }

  const discountValue = Number(promotion.discountValue) || 0;

  if (promotion.type === 'percentage') {
    percent = Math.max(0, Math.min(100, discountValue));
    finalPrice = basePrice * (1 - percent / 100);
  } else if (promotion.type === 'amount') {
    finalPrice = Math.max(0, basePrice - discountValue);
    if (basePrice > 0) {
      percent = ((basePrice - finalPrice) / basePrice) * 100;
    }
  } else if (promotion.type === 'bundle') {
    // Bundle discounts depend on quantity; keep price unchanged but expose value.
    percent = 0;
    finalPrice = basePrice;
  }

  finalPrice = Math.max(0, Number(finalPrice.toFixed(2)));
  percent = Number(percent.toFixed(2));

  return { finalPrice, percent };
};

const buildPromotionSnapshot = (promotion) => ({
  promotionId: promotion._id,
  title: promotion.title,
  type: promotion.type,
  discountValue: promotion.discountValue,
  startDate: promotion.startDate,
  endDate: promotion.endDate,
  status: promotion.status
});

const applyPromotionsToProducts = async (userId) => {
  const promotions = await SellerPromotion.find({ user: userId });
  const runningPromotions = promotions.filter((promo) => promo.status === 'Running');
  const snapshots = runningPromotions.map(buildPromotionSnapshot);

  const products = await Product.find({ seller: userId });

  for (const product of products) {
    const basePrice = product.basePrice !== undefined && product.basePrice !== null
      ? product.basePrice
      : product.price;

    if (product.basePrice === undefined || product.basePrice === null) {
      product.basePrice = basePrice;
    }

    let bestPrice = basePrice;
    let bestPercent = 0;

    runningPromotions.forEach((promotion) => {
      const { finalPrice, percent } = calculateDiscount(basePrice, promotion);
      if (finalPrice < bestPrice) {
        bestPrice = finalPrice;
        bestPercent = percent;
      }
    });

    if (runningPromotions.length === 0) {
      product.price = basePrice;
      product.promotionDiscountPercent = 0;
      product.activePromotions = [];
      product.originalPrice = product.manualOriginalPrice !== undefined ? product.manualOriginalPrice : product.originalPrice;
    } else if (bestPercent > 0 && bestPrice < basePrice) {
      product.price = bestPrice;
      product.promotionDiscountPercent = bestPercent;
      product.originalPrice = basePrice;
      product.activePromotions = snapshots;
    } else {
      product.price = basePrice;
      product.promotionDiscountPercent = 0;
      product.activePromotions = snapshots;
      product.originalPrice = product.manualOriginalPrice !== undefined ? product.manualOriginalPrice : product.originalPrice;
    }

    await product.save();
  }
};

module.exports = {
  calculateDiscount,
  buildPromotionSnapshot,
  applyPromotionsToProducts
};
