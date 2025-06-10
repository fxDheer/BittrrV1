const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['user_management', 'content_moderation', 'system_config', 'security', 'analytics', 'other'],
    required: true
  },
  target: {
    type: {
      type: String,
      enum: ['user', 'post', 'comment', 'report', 'config', 'system'],
      required: true
    },
    id: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: Object,
    default: {}
  },
  ip: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ category: 1, createdAt: -1 });
adminLogSchema.index({ 'target.type': 1, 'target.id': 1 });
adminLogSchema.index({ status: 1 });

// Static methods
adminLogSchema.statics.logActivity = async function(adminId, action, category, target, details = {}, ip, userAgent) {
  return this.create({
    admin: adminId,
    action,
    category,
    target,
    details,
    ip,
    userAgent
  });
};

adminLogSchema.statics.getAdminLogs = async function(adminId, category, startDate, endDate) {
  const query = {};
  if (adminId) query.admin = adminId;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('admin', 'name email');
};

adminLogSchema.statics.getTargetLogs = async function(targetType, targetId) {
  return this.find({
    'target.type': targetType,
    'target.id': targetId
  })
  .sort({ createdAt: -1 })
  .populate('admin', 'name email');
};

adminLogSchema.statics.getActivityStats = async function(startDate, endDate) {
  const query = {};
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
          category: '$category',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog; 