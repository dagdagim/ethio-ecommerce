const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 3
  },
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true }
  },
  symbol: {
    type: String,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true,
    min: 0
  },
  isBaseCurrency: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  decimalPlaces: {
    type: Number,
    default: 2,
    min: 0,
    max: 4
  },
  formatting: {
    symbolPosition: {
      type: String,
      enum: ['before', 'after'],
      default: 'before'
    },
    thousandSeparator: {
      type: String,
      default: ','
    },
    decimalSeparator: {
      type: String,
      default: '.'
    },
    spaceBetween: {
      type: Boolean,
      default: false
    }
  },
  autoUpdate: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one base currency exists
currencySchema.pre('save', async function(next) {
  if (this.isBaseCurrency) {
    await mongoose.model('Currency').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isBaseCurrency: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Currency', currencySchema);