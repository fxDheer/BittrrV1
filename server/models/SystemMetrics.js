const mongoose = require('mongoose');

const systemMetricsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cpu', 'memory', 'disk', 'network', 'api', 'database', 'error', 'security'],
    required: true
  },
  metric: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['percentage', 'bytes', 'milliseconds', 'count', 'requests_per_second'],
    required: true
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  },
  details: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
systemMetricsSchema.index({ type: 1, metric: 1, timestamp: -1 });
systemMetricsSchema.index({ status: 1, timestamp: -1 });

// Static methods
systemMetricsSchema.statics.recordMetric = async function(type, metric, value, unit, details = {}) {
  let status = 'normal';
  
  // Define thresholds for different metrics
  const thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    api: { warning: 1000, critical: 2000 }, // response time in ms
    database: { warning: 500, critical: 1000 } // query time in ms
  };

  // Determine status based on thresholds
  if (thresholds[type]) {
    if (value >= thresholds[type].critical) {
      status = 'critical';
    } else if (value >= thresholds[type].warning) {
      status = 'warning';
    }
  }

  return this.create({
    type,
    metric,
    value,
    unit,
    status,
    details,
    timestamp: new Date()
  });
};

systemMetricsSchema.statics.getMetrics = async function(type, metric, startTime, endTime) {
  const query = {};
  if (type) query.type = type;
  if (metric) query.metric = metric;
  if (startTime || endTime) {
    query.timestamp = {};
    if (startTime) query.timestamp.$gte = startTime;
    if (endTime) query.timestamp.$lte = endTime;
  }

  return this.find(query)
    .sort({ timestamp: -1 });
};

systemMetricsSchema.statics.getAggregatedMetrics = async function(type, metric, interval = '1h') {
  const timeRanges = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1m': 30 * 24 * 60 * 60 * 1000
  };

  const startTime = new Date(Date.now() - timeRanges[interval]);

  return this.aggregate([
    {
      $match: {
        type,
        metric,
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d-%H',
            date: '$timestamp'
          }
        },
        avgValue: { $avg: '$value' },
        maxValue: { $max: '$value' },
        minValue: { $min: '$value' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        timestamp: '$_id',
        avgValue: 1,
        maxValue: 1,
        minValue: 1,
        count: 1,
        _id: 0
      }
    },
    { $sort: { timestamp: 1 } }
  ]);
};

systemMetricsSchema.statics.getAlerts = async function(status = 'critical', limit = 10) {
  return this.find({ status })
    .sort({ timestamp: -1 })
    .limit(limit);
};

systemMetricsSchema.statics.getSystemHealth = async function() {
  const metrics = await this.aggregate([
    {
      $group: {
        _id: '$type',
        status: {
          $push: {
            status: '$status',
            timestamp: '$timestamp'
          }
        },
        latestValue: { $last: '$value' }
      }
    }
  ]);

  return metrics.reduce((acc, metric) => {
    acc[metric._id] = {
      status: metric.status[0].status,
      lastUpdated: metric.status[0].timestamp,
      value: metric.latestValue
    };
    return acc;
  }, {});
};

const SystemMetrics = mongoose.model('SystemMetrics', systemMetricsSchema);

module.exports = SystemMetrics; 