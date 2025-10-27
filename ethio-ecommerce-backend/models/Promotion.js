const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true }
  },
  description: {
    en: String,
    am: String
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'],
    required: true
  },
  value: {
    type: Number,
    required: function() {
      return this.type !== 'free_shipping';
    }
  },
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    default: null
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  appliesTo: {
    type: String,
    enum: ['all_products', 'specific_categories', 'specific_products', 'specific_sellers'],
    default: 'all_products'
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  sellers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For buy_x_get_y type
  buyQuantity: {
    type: Number,
    required: function() {
      return this.type === 'buy_x_get_y';
    }
  },
  getQuantity: {
    type: Number,
    required: function() {
      return this.type === 'buy_x_get_y';
    }
  },
  // Creator information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scope: {
    type: String,
    enum: ['global', 'seller'],
    default: 'global'
  }
}, {
  timestamps: true
});

// Index for efficient querying
promotionSchema.index({ code: 1, isActive: 1 });
promotionSchema.index({ validFrom: 1, validUntil: 1 });
promotionSchema.index({ createdBy: 1 });

// Pre-save hook to generate code if not provided
promotionSchema.pre('save', function(next) {
  if (!this.code) {
    this.code = `PROMO${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Promotion', promotionSchema);