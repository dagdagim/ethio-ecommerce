const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getSellerProfile, updateSellerProfile } = require('../controllers/sellerProfile');
const {
  listSellerPromotions,
  getSellerPromotion,
  createSellerPromotion,
  updateSellerPromotion,
  deleteSellerPromotion
} = require('../controllers/sellerPromotions');

const router = express.Router();

router.use(protect);
router.use(authorize('seller', 'admin'));

router.route('/profile')
  .get(getSellerProfile)
  .put(updateSellerProfile);

router.route('/promotions')
  .get(listSellerPromotions)
  .post(createSellerPromotion);

router.route('/promotions/:id')
  .get(getSellerPromotion)
  .put(updateSellerPromotion)
  .delete(deleteSellerPromotion);

module.exports = router;
