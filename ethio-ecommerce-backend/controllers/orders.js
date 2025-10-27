const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin)
exports.getOrders = asyncHandler(async (req, res, next) => {
    let query;
    const isAdmin = req.user.role === 'admin';
    const isSeller = req.user.role === 'seller';
    
    if (isAdmin) {
        query = Order.find();
    } else if (isSeller) {
        const sellerProductIds = await Product.find({ seller: req.user.id }).distinct('_id');

        query = Order.find({
            $or: [
                { 'items.seller': req.user.id },
                { 'items.product': { $in: sellerProductIds } }
            ]
        });
    } else {
        query = Order.find({ customer: req.user.id });
    }
    
    const orders = await query
        .populate('customer', 'name email phone')
        .populate('items.product', 'name images seller')
        .populate('items.seller', 'name phone')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'name email phone address')
        .populate('items.product', 'name images sku seller')
        .populate('items.seller', 'name phone');

    if (!order) {
        return next(
            new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is order owner or admin
    const isAdmin = req.user.role === 'admin';
    const isOwner = order.customer._id.toString() === req.user.id;
    const isSellerOnOrder = order.items.some(item => {
        if (item.seller && item.seller.toString() === req.user.id) {
            return true;
        }
        const productSeller = item.product?.seller;
        if (!productSeller) return false;
        if (typeof productSeller === 'object' && productSeller._id) {
            return productSeller._id.toString() === req.user.id;
        }
        return productSeller.toString() === req.user.id;
    });

    if (!isAdmin && !isOwner && !isSellerOnOrder) {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to access this order`, 401)
        );
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
    const { items, shippingAddress, paymentMethod, customerNotes } = req.body;
    
    // Validate items
    if (!items || items.length === 0) {
        return next(new ErrorResponse('Please add items to the order', 400));
    }
    
    // Calculate total and validate stock
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
        const product = await Product.findById(item.product);
        
        if (!product) {
            return next(new ErrorResponse(`Product not found: ${item.product}`, 404));
        }
        
        if (product.stock < item.quantity) {
            return next(
                new ErrorResponse(`Insufficient stock for ${product.name.en}. Available: ${product.stock}`, 400)
            );
        }
        
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;
        
        orderItems.push({
            product: item.product,
            seller: product.seller,
            name: {
                en: product.name.en,
                am: product.name.am
            },
            image: item.image || product.images[0]?.url || '',
            price: product.price,
            quantity: item.quantity,
            subtotal: subtotal
        });
    }
    
    // Add shipping cost (you can implement dynamic shipping calculation)
    const shippingCost = calculateShippingCost(shippingAddress.region, totalAmount);
    totalAmount += shippingCost;
    
    // Create order
    const order = await Order.create({
        customer: req.user.id,
        items: orderItems,
        totalAmount,
        shippingAddress,
        paymentMethod,
        shippingCost,
        customerNotes,
        estimatedDelivery: calculateEstimatedDelivery(shippingAddress.region)
    });
    
    // Update product stock
    for (const item of items) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } }
        );
    }
    
    // Populate the created order
    const populatedOrder = await Order.findById(order._id)
        .populate('customer', 'name email phone')
        .populate('items.product', 'name images');
    
    res.status(201).json({
        success: true,
        data: populatedOrder
    });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { status, trackingNumber, carrier, internalNotes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
        );
    }

    const isAdmin = req.user.role === 'admin';
    const isSeller = req.user.role === 'seller';

    if (!isAdmin && !isSeller) {
        return next(new ErrorResponse('Not authorized to update this order', 403));
    }

    if (isSeller) {
        let ownsOrder = order.items.some(item => {
            if (item.seller && item.seller.toString() === req.user.id) {
                return true;
            }
            return false;
        });

        if (!ownsOrder) {
            const productIds = order.items.map(item => item.product).filter(Boolean);
            if (productIds.length > 0) {
                const sellerProductCount = await Product.countDocuments({
                    _id: { $in: productIds },
                    seller: req.user.id
                });
                ownsOrder = sellerProductCount > 0;
            }
        }

        if (!ownsOrder) {
            return next(new ErrorResponse('Not authorized to update this order', 403));
        }
    }

    const hasStatus = Object.prototype.hasOwnProperty.call(req.body, 'status');
    const hasTracking = Object.prototype.hasOwnProperty.call(req.body, 'trackingNumber');
    const hasCarrier = Object.prototype.hasOwnProperty.call(req.body, 'carrier');
    const hasNotes = Object.prototype.hasOwnProperty.call(req.body, 'internalNotes');

    if (!hasStatus && !hasTracking && !hasCarrier && !hasNotes) {
        return next(new ErrorResponse('Please provide at least one field to update', 400));
    }

    if (hasStatus) {
        if (!status) {
            return next(new ErrorResponse('Status value is required', 400));
        }

        order.status = status;

        if (status === 'delivered') {
            order.deliveredAt = new Date();
        } else if (order.deliveredAt && status !== 'delivered') {
            order.deliveredAt = undefined;
        }
    }

    if (hasTracking) {
        const normalizedTracking = typeof trackingNumber === 'string' ? trackingNumber.trim() : trackingNumber;
        order.trackingNumber = normalizedTracking ? normalizedTracking : undefined;
    }

    if (hasCarrier) {
        const normalizedCarrier = typeof carrier === 'string' ? carrier.trim() : carrier;
        order.carrier = normalizedCarrier ? normalizedCarrier : undefined;
    }

    if (hasNotes) {
        const normalizedNotes = typeof internalNotes === 'string' ? internalNotes.trim() : internalNotes;
        order.internalNotes = normalizedNotes ? normalizedNotes : undefined;
    }

    await order.save();
    await order.populate([
        { path: 'customer', select: 'name email phone' },
        { path: 'items.product', select: 'name images seller' },
        { path: 'items.seller', select: 'name phone' }
    ]);

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res, next) => {
    const { cancellationReason } = req.body;
    
    let order = await Order.findById(req.params.id);
    
    if (!order) {
        return next(
            new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
        );
    }
    
    // Make sure user is order owner or admin
    if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to cancel this order`, 401)
        );
    }
    
    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
        return next(
            new ErrorResponse(`Order cannot be cancelled in its current status: ${order.status}`, 400)
        );
    }
    
    // Restore product stock
    for (const item of order.items) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } }
        );
    }
    
    order.status = 'cancelled';
    order.cancellationReason = cancellationReason;
    await order.save();
    
    res.status(200).json({
        success: true,
        data: order
    });
});

// Helper function to calculate shipping cost
const calculateShippingCost = (region, orderAmount) => {
    const baseCosts = {
        'Addis Ababa': 50,
        'Dire Dawa': 100,
        'Harari': 100
    };
    
    let cost = baseCosts[region] || 150; // Default cost for other regions
    
    // Free shipping for orders above 1000 ETB in Addis Ababa
    if (region === 'Addis Ababa' && orderAmount > 1000) {
        cost = 0;
    }
    
    return cost;
};

// Helper function to calculate estimated delivery
const calculateEstimatedDelivery = (region) => {
    const deliveryDays = {
        'Addis Ababa': { min: 1, max: 2 },
        'Dire Dawa': { min: 3, max: 5 },
        'Harari': { min: 3, max: 5 }
    };
    
    const days = deliveryDays[region] || { min: 5, max: 10 };
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + days.max);
    
    return estimatedDate;
};