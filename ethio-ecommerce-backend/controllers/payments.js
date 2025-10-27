const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Order = require('../models/Order');
const Chapa = require('chapa');

// @desc    Initiate TeleBirr payment
// @route   POST /api/payments/telebirr
// @access  Private
exports.initiateTeleBirr = asyncHandler(async (req, res, next) => {
    const { orderId, phoneNumber } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }
    
    // Make sure user is order owner
    if (order.customer.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to access this order', 401));
    }
    
    // Check if order is already paid
    if (order.paymentStatus === 'completed') {
        return next(new ErrorResponse('Order is already paid', 400));
    }
    
    // TeleBirr API integration (Mock implementation)
    // In production, you'll need to use the actual TeleBirr API
    const telebirrPayload = {
        appId: process.env.TELEBIRR_APP_ID,
        appKey: process.env.TELEBIRR_APP_KEY,
        merchantCode: process.env.TELEBIRR_MERCHANT_CODE,
        nonceStr: Date.now().toString(),
        subject: `Order #${order.orderNumber}`,
        totalAmount: order.totalAmount.toString(),
        outTradeNo: order.orderNumber,
        timeoutExpress: '30m',
        payeePhoneNumber: phoneNumber,
        notifyUrl: `${process.env.API_URL}/api/payments/telebirr/webhook`,
        returnUrl: `${process.env.CLIENT_URL}/order/${orderId}/success`
    };
    
    try {
        // This is a mock implementation
        // const response = await axios.post(`${process.env.TELEBIRR_BASE_URL}/payment`, telebirrPayload);
        
        // Mock successful initiation
        const mockResponse = {
            success: true,
            paymentId: `TEL_${Date.now()}`,
            qrCode: `data:image/png;base64,mock_qr_code_here`,
            deepLink: `telebirr://pay?amount=${order.totalAmount}&order=${order.orderNumber}`,
            message: 'Payment initiated successfully. Please confirm in your TeleBirr app.'
        };
        
        // Update order with payment reference
        order.paymentMethod = 'telebirr';
        order.paymentId = mockResponse.paymentId;
        order.paymentStatus = 'processing';
        await order.save();
        
        res.status(200).json({
            success: true,
            data: mockResponse
        });
        
    } catch (error) {
        return next(new ErrorResponse('Payment initiation failed', 500));
    }
});

// @desc    Initiate Chapa payment
// @route   POST /api/payments/chapa
// @access  Private
exports.initiateChapa = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (order.customer.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to access this order', 401));
    }

    if (order.paymentStatus === 'completed') {
        return next(new ErrorResponse('Order is already paid', 400));
    }

    const chapaSecretKey = (process.env.CHAPA_SECRET_KEY || '').trim();

    if (!chapaSecretKey) {
        return next(new ErrorResponse('Chapa secret key is not configured. Please set CHAPA_SECRET_KEY in the backend environment.', 500));
    }

    await order.populate('customer', 'name email phone');

    const chapaClient = new Chapa(chapaSecretKey);
    const txRef = `CHA-${order.orderNumber}-${Date.now()}`;
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:3003';
    const apiBaseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;

    const displayName = order.shippingAddress?.name || order.customer?.name || req.user?.name || 'Customer';
    const nameParts = displayName.trim().split(' ').filter(Boolean);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const payload = {
        amount: order.totalAmount.toString(),
        currency: 'ETB',
        email: order.customer?.email || req.user?.email || 'customer@example.com',
        first_name: firstName,
        last_name: lastName,
        tx_ref: txRef,
        callback_url: `${apiBaseUrl}/api/payments/chapa/webhook`,
        return_url: `${clientBaseUrl}/order/${order._id}/success`,
        customization: {
            title: `Order ${order.orderNumber}`,
            description: `Payment for order ${order.orderNumber}`,
            logo: process.env.CHAPA_LOGO_URL || 'https://chapa.link/asset/images/chapa_swirl.svg'
        },
        meta: {
            orderId: order._id.toString(),
            txSource: 'ethio-ecommerce'
        }
    };

    try {
        const chapaResponse = await chapaClient.initialize(payload);
        const checkoutUrl = chapaResponse?.data?.checkout_url;

        if (!checkoutUrl) {
            return next(new ErrorResponse(chapaResponse?.message || 'Unable to initialize Chapa payment', 400));
        }

        order.paymentMethod = 'chapa';
        order.paymentStatus = 'processing';
        order.paymentId = txRef;
        order.paymentDetails = {
            provider: 'chapa',
            reference: txRef,
            initiatedAt: new Date(),
            checkoutUrl,
            payload
        };
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                message: chapaResponse?.message || 'Redirecting to Chapa for secure payment.',
                reference: txRef,
                checkoutUrl
            }
        });
    } catch (error) {
        const statusCode = typeof error?.statusCode === 'number'
            ? error.statusCode
            : typeof error?.status === 'number'
                ? error.status
                : 500;
        const message = error?.message || error?.error || 'Failed to initiate Chapa payment';
        return next(new ErrorResponse(message, statusCode));
    }
});

// @desc    Chapa webhook for payment confirmation
// @route   POST /api/payments/chapa/webhook
// @access  Public (Chapa calls this)
exports.chapaWebhook = asyncHandler(async (req, res, next) => {
    const { tx_ref: txRef } = req.body;

    if (!txRef) {
        return res.status(400).json({ success: false, message: 'Transaction reference missing' });
    }

    const order = await Order.findOne({ paymentId: txRef });

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

    if (!chapaSecretKey) {
        return res.status(500).json({ success: false, message: 'Chapa secret key not configured' });
    }

    const chapaClient = new Chapa(chapaSecretKey);

    try {
        const verification = await chapaClient.verify(txRef);

        const verifiedStatus = verification.data?.status || verification.status;

        if (verifiedStatus && verifiedStatus.toLowerCase() === 'success') {
            order.paymentStatus = 'completed';
            order.status = 'confirmed';
            order.paymentDetails = {
                ...(order.paymentDetails || {}),
                provider: 'chapa',
                completedAt: new Date(),
                verification
            };
        } else {
            order.paymentStatus = 'failed';
            order.paymentDetails = {
                ...(order.paymentDetails || {}),
                provider: 'chapa',
                failedAt: new Date(),
                verification
            };
        }

        await order.save();

        res.status(200).json({ success: true });
    } catch (error) {
        const statusCode = typeof error?.statusCode === 'number'
            ? error.statusCode
            : typeof error?.status === 'number'
                ? error.status
                : 500;
        const message = error?.message || error?.error || 'Failed to verify Chapa payment';
        return res.status(statusCode).json({ success: false, message });
    }
});

// @desc    TeleBirr webhook for payment confirmation
// @route   POST /api/payments/telebirr/webhook
// @access  Public (TeleBirr calls this)
exports.teleBirrWebhook = asyncHandler(async (req, res, next) => {
    const { outTradeNo, tradeStatus, transactionId } = req.body;
    
    const order = await Order.findOne({ orderNumber: outTradeNo });
    
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (tradeStatus === 'SUCCESS') {
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        order.paymentDetails = {
            transactionId,
            paidAt: new Date(),
            gateway: 'telebirr'
        };
        await order.save();
        
        // Here you can trigger order confirmation email/SMS
    } else if (tradeStatus === 'FAILED') {
        order.paymentStatus = 'failed';
        await order.save();
    }
    
    res.status(200).json({ success: true });
});

// @desc    Confirm Cash on Delivery
// @route   POST /api/payments/cod
// @access  Private
exports.confirmCOD = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }
    
    // Make sure user is order owner
    if (order.customer.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to access this order', 401));
    }
    
    order.paymentMethod = 'cod';
    order.paymentStatus = 'pending';
    order.status = 'confirmed';
    await order.save();
    
    res.status(200).json({
        success: true,
        data: {
            message: 'Order confirmed with Cash on Delivery. Payment will be collected upon delivery.',
            order: order
        }
    });
});

// @desc    Process bank transfer
// @route   POST /api/payments/bank-transfer
// @access  Private
exports.processBankTransfer = asyncHandler(async (req, res, next) => {
    const { orderId, bankName, accountNumber, transferDate, referenceNumber } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }
    
    // Make sure user is order owner
    if (order.customer.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to access this order', 401));
    }
    
    order.paymentMethod = 'bank_transfer';
    order.paymentStatus = 'processing';
    order.paymentDetails = {
        bankName,
        accountNumber,
        transferDate,
        referenceNumber,
        verified: false
    };
    await order.save();
    
    res.status(200).json({
        success: true,
        data: {
            message: 'Bank transfer details received. Your order will be processed once payment is verified.',
            order: order
        }
    });
});