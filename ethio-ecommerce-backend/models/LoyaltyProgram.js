const mongoose = require('mongoose');

const loyaltyProgramSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true }
  },
  description: {
    en: String,
    am: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Points system
  points: {
    earnRate: { type: Number, default: 1 }, // Points per ETB spent
    minPurchase: { type: Number, default: 0 }, // Minimum purchase to earn points
    pointsExpiry: { type: Number, default: 365 }, // Days until points expire
    maxPointsPerOrder: { type: Number, default: null }
  },
  // Tiers
  tiers: [{
    name: {
      en: { type: String, required: true },
      am: { type: String, required: true }
    },
    level: { type: Number, required: true },
    minPoints: { type: Number, required: true },
    benefits: [{
      type: { type: String, enum: ['discount', 'free_shipping', 'early_access', 'bonus_points', 'gift'], required: true },
      value: mongoose.Schema.Types.Mixed,
      description: {
        en: String,
        am: String
      }
    }],
    color: { type: String, default: '#6c757d' }
  }],
  // Rewards
  rewards: [{
    name: {
      en: { type: String, required: true },
      am: { type: String, required: true }
    },
    description: {
      en: String,
      am: String
    },
    pointsRequired: { type: Number, required: true },
    type: {
      type: String,
      enum: ['discount', 'free_product', 'free_shipping', 'voucher'],
      required: true
    },
    value: mongoose.Schema.Types.Mixed, // Discount percentage, product ID, etc.
    isActive: { type: Boolean, default: true },
    stock: { type: Number, default: null }, // For physical rewards
    image: String
  }],
  // Special earning rules
  specialEarningRules: [{
    name: String,
    type: {
      type: String,
      enum: ['category', 'product', 'first_purchase', 'referral', 'birthday'],
      required: true
    },
    target: mongoose.Schema.Types.Mixed, // Category ID, Product ID, etc.
    points: { type: Number, required: true },
    multiplier: { type: Number, default: 1 },
    validFrom: Date,
    validUntil: Date,
    isActive: { type: Boolean, default: true }
  }],
  // Settings
  settings: {
    allowPointRedemption: { type: Boolean, default: true },
    pointToCurrency: { type: Number, default: 0.01 }, // 1 point = 0.01 ETB
    minRedemptionPoints: { type: Number, default: 100 },
    maxRedemptionPercent: { type: Number, default: 50 }, // Max % of order that can be paid with points
    referralBonus: { type: Number, default: 100 } // Points for referring a friend
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);