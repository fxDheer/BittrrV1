const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['harassment', 'spam', 'inappropriate', 'other'],
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate blocks
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

// Static method to check if user is blocked
blockSchema.statics.isBlocked = async function(userId1, userId2) {
  const block = await this.findOne({
    $or: [
      { blocker: userId1, blocked: userId2 },
      { blocker: userId2, blocked: userId1 }
    ]
  });
  return !!block;
};

// Static method to get all blocked users for a user
blockSchema.statics.getBlockedUsers = async function(userId) {
  return this.find({ blocker: userId })
    .populate('blocked', 'name photos')
    .sort({ createdAt: -1 });
};

// Static method to get all users who blocked a user
blockSchema.statics.getBlockedBy = async function(userId) {
  return this.find({ blocked: userId })
    .populate('blocker', 'name photos')
    .sort({ createdAt: -1 });
};

const Block = mongoose.model('Block', blockSchema);

module.exports = Block; 