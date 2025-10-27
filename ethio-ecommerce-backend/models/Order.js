const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    name: {
        en: String,
        am: String
    },
    image: String,
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    subtotal: {
        type: Number,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    // Ethiopian shipping address
    shippingAddress: {
        name: String,
        phone: String,
        region: {
            type: String,
            enum: ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'SNNPR', 'Tigray'],
            required: true
        },
        city: {
            type: String,
            required: true
        },
        subcity: String,
        woreda: String,
        kebele: String,
        houseNumber: String,
        specificLocation: {
            type: String,
            required: true
        }
    },
    // Payment information
    paymentMethod: {
        type: String,
        enum: ['telebirr', 'cbe', 'cod', 'bank_transfer', 'chapa'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    paymentId: String, // Payment gateway reference
    paymentDetails: mongoose.Schema.Types.Mixed,
    // Order status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    // Shipping information
    shippingMethod: {
        type: String,
        enum: ['standard', 'express', 'pickup'],
        default: 'standard'
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    // Order notes
    customerNotes: String,
    internalNotes: String,
    // Cancellation/return
    cancellationReason: String,
    returnReason: String,
    returnStatus: {
        type: String,
        enum: [null, 'requested', 'approved', 'rejected', 'completed'],
        default: null
    }
}, {
    timestamps: true
});

// Ensure we have an order number before validation kicks in so the required constraint passes
orderSchema.pre('validate', async function(next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;
    }

    // Calculate total amount if not set
    if (!this.totalAmount && this.items.length > 0) {
        this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0) + this.shippingCost;
    }
    
    next();
});

// Calculate subtotal for each item before saving
orderSchema.pre('save', function(next) {
    this.items.forEach(item => {
        item.subtotal = item.price * item.quantity;
    });
    next();
});

module.exports = mongoose.model('Order', orderSchema);