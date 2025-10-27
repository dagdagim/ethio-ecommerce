const mongoose = require('mongoose');

const SellerPromotionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Promotion title is required'],
      trim: true,
      maxlength: 160
    },
    type: {
      type: String,
      enum: ['percentage', 'amount', 'bundle'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0
    },
    minSpend: {
      type: Number,
      min: 0,
      default: 0
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    audience: {
      type: String,
      default: 'all-customers'
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Running', 'Completed', 'Archived'],
      default: 'Scheduled'
    },
    performance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    idea: {
      type: String,
      trim: true,
      maxlength: 4000
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SellerPromotion', SellerPromotionSchema);
