const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['profile_view', 'message_sent', 'match_created', 'like_sent', 'story_view', 'search_performed', 'filter_updated', 'verification_requested', 'subscription_created', 'payment_processed'],
    required: true
  },
  data: {
    type: Object,
    default: {}
  },
  metadata: {
    device: String,
    browser: String,
    os: String,
    ip: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ user: 1, type: 1, createdAt: -1 });
analyticsSchema.index({ type: 1, createdAt: -1 });
analyticsSchema.index({ 'metadata.location': '2dsphere' });

// Static methods
analyticsSchema.statics.trackEvent = async function(userId, type, data = {}, metadata = {}) {
  return this.create({
    user: userId,
    type,
    data,
    metadata
  });
};

analyticsSchema.statics.getUserAnalytics = async function(userId, type, startDate, endDate) {
  const query = { user: userId };
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 });
};

analyticsSchema.statics.getAggregatedAnalytics = async function(type, startDate, endDate) {
  const query = {};
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);
};

analyticsSchema.statics.getUserMetrics = async function(userId) {
  const metrics = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    }
  ]);

  return metrics.reduce((acc, metric) => {
    acc[metric._id] = {
      count: metric.count,
      lastActivity: metric.lastActivity
    };
    return acc;
  }, {});
};

analyticsSchema.statics.getGlobalMetrics = async function() {
  const metrics = await this.aggregate([
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        type: '$_id',
        total: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        lastActivity: 1,
        _id: 0
      }
    }
  ]);

  return metrics.reduce((acc, metric) => {
    acc[metric.type] = {
      total: metric.total,
      uniqueUsers: metric.uniqueUsers,
      lastActivity: metric.lastActivity
    };
    return acc;
  }, {});
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics; 