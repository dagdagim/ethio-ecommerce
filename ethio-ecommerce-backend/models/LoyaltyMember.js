const mongoose = require('mongoose');

const loyaltyMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyProgram',
    required: true
  },
  // Points information
  points: {
    current: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalRedeemed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 } // Points pending from recent orders
  },
  // Tier information
  tier: {
    level: { type: Number, default: 1 },
    name: {
      en: { type: String, default: 'Bronze' },
      am: { type: String, default: 'ብሮንዝ' }
    },
    since: { type: Date, default: Date.now }
  },
  // Activity tracking
  activity: {
    joinDate: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  // Referral information
  referral: {
    code: { type: String, unique: true, sparse: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LoyaltyMember'
    },
    referrals: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: Date, default: Date.now },
      pointsAwarded: { type: Boolean, default: false }
    }],
    totalReferrals: { type: Number, default: 0 }
  },
  // Points expiry tracking
  pointsExpiry: [{
    points: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    earnedDate: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Generate referral code before saving
loyaltyMemberSchema.pre('save', function(next) {
  if (!this.referral.code) {
    this.referral.code = `REF${this.user.toString().slice(-6)}${Math.random().toString(36).substr(2, 4)}`.toUpperCase();
  }
  next();
});

// Index for efficient queries
loyaltyMemberSchema.index({ user: 1, program: 1 });
loyaltyMemberSchema.index({ 'referral.code': 1 });

// Virtual for available points (excluding pending)
loyaltyMemberSchema.virtual('points.available').get(function() {
  return this.points.current - this.points.pending;
});

module.exports = mongoose.model('LoyaltyMember', loyaltyMemberSchema);