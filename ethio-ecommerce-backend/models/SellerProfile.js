const mongoose = require('mongoose');

const SellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    storeName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 160
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    supportPhone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    addressLine: {
      type: String,
      trim: true
    },
    about: {
      type: String,
      trim: true,
      maxlength: 4000
    },
    fulfillmentTime: {
      type: String,
      trim: true
    },
    returnPolicy: {
      type: String,
      trim: true
    },
    pickupAvailable: {
      type: Boolean,
      default: false
    },
    featuredCategories: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    },
    facebook: {
      type: String,
      trim: true
    },
    tiktok: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SellerProfile', SellerProfileSchema);
