const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
    default: 'draft'
  },
  subject: {
    type: String,
    required: function() {
      return this.type === 'email';
    }
  },
  message: {
    type: String,
    required: true
  },
  // For email campaigns
  template: {
    type: String,
    enum: ['basic', 'promotional', 'newsletter', 'transactional'],
    default: 'basic'
  },
  // Target audience
  audience: {
    type: {
      type: String,
      enum: ['all_customers', 'segment', 'specific_customers'],
      default: 'all_customers'
    },
    segment: {
      minOrders: { type: Number, default: 0 },
      minSpent: { type: Number, default: 0 },
      lastPurchaseDays: { type: Number, default: null },
      regions: [String],
      tags: [String]
    },
    customerIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  // Scheduling
  scheduledFor: {
    type: Date,
    required: function() {
      return this.status === 'scheduled';
    }
  },
  sentAt: {
    type: Date
  },
  // Tracking
  metrics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 }
  },
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // For automated campaigns
  isAutomated: {
    type: Boolean,
    default: false
  },
  trigger: {
    type: {
      type: String,
      enum: ['welcome', 'abandoned_cart', 'purchase', 'birthday', 'inactivity'],
      required: function() {
        return this.isAutomated;
      }
    },
    delay: { type: Number, default: 0 }, // in hours
    conditions: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
campaignSchema.index({ status: 1, scheduledFor: 1 });
campaignSchema.index({ createdBy: 1 });
campaignSchema.index({ isAutomated: 1, 'trigger.type': 1 });

// Virtual for open rate
campaignSchema.virtual('metrics.openRate').get(function() {
  return this.metrics.sent > 0 ? (this.metrics.opened / this.metrics.sent) * 100 : 0;
});

// Virtual for click rate
campaignSchema.virtual('metrics.clickRate').get(function() {
  return this.metrics.opened > 0 ? (this.metrics.clicked / this.metrics.opened) * 100 : 0;
});

// Virtual for conversion rate
campaignSchema.virtual('metrics.conversionRate').get(function() {
  return this.metrics.clicked > 0 ? (this.metrics.converted / this.metrics.clicked) * 100 : 0;
});

module.exports = mongoose.model('Campaign', campaignSchema);