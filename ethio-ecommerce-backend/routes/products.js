const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage
} = require('../controllers/products');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(getProducts)
    .post(protect, authorize('seller', 'admin'), createProduct);

router
    .route('/:id')
    .get(getProduct)
    .put(protect, authorize('seller', 'admin'), updateProduct)
    .delete(protect, authorize('seller', 'admin'), deleteProduct);

router
    .route('/:id/image')
    .put(protect, authorize('seller', 'admin'), uploadProductImage);

module.exports = router;