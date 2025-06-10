const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['inappropriate', 'spam', 'fake', 'harassment', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'message', 'profile'],
      required: true
    },
    url: String,
    content: String
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  action: {
    type: String,
    enum: ['none', 'warning', 'suspension', 'ban'],
    default: 'none'
  },
  actionDetails: {
    duration: Number, // For suspensions
    reason: String,
    timestamp: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Prevent duplicate reports
reportSchema.index({ reporter: 1, reportedUser: 1, type: 1 }, { unique: true });

// Static method to get report statistics
reportSchema.statics.getStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance method to add admin note
reportSchema.methods.addAdminNote = async function(adminId, note) {
  this.adminNotes.push({
    admin: adminId,
    note,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to update report status
reportSchema.methods.updateStatus = async function(status, adminId, note = null) {
  this.status = status;
  if (note) {
    await this.addAdminNote(adminId, note);
  }
  return this.save();
};

// Instance method to take action
reportSchema.methods.takeAction = async function(action, adminId, details = {}) {
  this.action = action;
  this.actionDetails = {
    ...details,
    timestamp: new Date()
  };
  await this.addAdminNote(adminId, `Action taken: ${action}`);
  return this.save();
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 