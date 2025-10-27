const express = require('express');
const {
    getOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder
} = require('../controllers/orders');

const router = express.Router();

const { protect } = require('../middleware/auth');

router
    .route('/')
    .get(protect, getOrders)
    .post(protect, createOrder);

router
    .route('/:id')
    .get(protect, getOrder);

router
    .route('/:id/status')
    .put(protect, updateOrderStatus);

router
    .route('/:id/cancel')
    .put(protect, cancelOrder);

module.exports = router;