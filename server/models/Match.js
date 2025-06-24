const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected'],
    default: 'pending'
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
matchSchema.index({ users: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ lastInteraction: 1 });

// Static methods
matchSchema.statics.findMatch = async function(userId1, userId2) {
  return this.findOne({
    users: { $all: [userId1, userId2] }
  });
};

matchSchema.statics.createMatch = async function(userId1, userId2) {
  const match = new this({
    users: [userId1, userId2],
    likes: [
      { user: userId1 },
      { user: userId2 }
    ],
    status: 'matched'
  });
  return match.save();
};

matchSchema.statics.addLike = async function(matchId, userId) {
  const match = await this.findById(matchId);
  if (!match) return null;

  const existingLike = match.likes.find(like => like.user.toString() === userId.toString());
  if (existingLike) return match;

  match.likes.push({ user: userId });
  match.lastInteraction = new Date();
  return match.save();
};

matchSchema.statics.addDislike = async function(matchId, userId) {
  const match = await this.findById(matchId);
  if (!match) return null;

  // For dislike, we just update the status to rejected
  match.status = 'rejected';
  match.lastInteraction = new Date();
  return match.save();
};

matchSchema.statics.addSuperLike = async function(matchId, userId) {
  const match = await this.findById(matchId);
  if (!match) return null;

  const existingLike = match.likes.find(like => like.user.toString() === userId.toString());
  if (existingLike) return match;

  // Super like is treated as a regular like but with higher priority
  match.likes.push({ user: userId });
  match.lastInteraction = new Date();
  return match.save();
};

matchSchema.statics.updateStatus = async function(matchId, status) {
  return this.findByIdAndUpdate(
    matchId,
    { 
      status,
      lastInteraction: new Date()
    },
    { new: true }
  );
};

matchSchema.statics.getUserMatches = async function(userId, status = 'matched') {
  return this.find({
    users: userId,
    status
  })
  .populate('users', 'name photos bio')
  .sort({ lastInteraction: -1 });
};

matchSchema.statics.getMatchStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        users: userId
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {
    pending: 0,
    matched: 0,
    rejected: 0
  });
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match; 