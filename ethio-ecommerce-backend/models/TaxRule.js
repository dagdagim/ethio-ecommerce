const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true }
  },
  country: {
    type: String,
    required: true,
    default: 'ET'
  },
  region: {
    type: String,
    enum: ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'SNNPR', 'Tigray', 'all'],
    default: 'all'
  },
  taxType: {
    type: String,
    enum: ['vat', 'sales_tax', 'gst', 'custom'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isCompound: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  appliesTo: {
    products: { type: Boolean, default: true },
    shipping: { type: Boolean, default: false },
    handling: { type: Boolean, default: false }
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  exceptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient tax calculation
taxRuleSchema.index({ country: 1, region: 1, isActive: 1 });
taxRuleSchema.index({ validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('TaxRule', taxRuleSchema);