const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'ended', 'missed'],
    default: 'pending'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  iceServers: [{
    urls: [String],
    username: String,
    credential: String
  }],
  sdp: {
    type: String
  },
  iceCandidates: [{
    candidate: String,
    sdpMid: String,
    sdpMLineIndex: Number
  }],
  quality: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
callSchema.index({ initiator: 1, receiver: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ callId: 1 });

// Static methods
callSchema.statics.createCall = async function(initiatorId, receiverId, type, iceServers) {
  const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return this.create({
    callId,
    type,
    initiator: initiatorId,
    receiver: receiverId,
    iceServers
  });
};

callSchema.statics.acceptCall = async function(callId, sdp) {
  return this.findOneAndUpdate(
    { callId, status: 'pending' },
    {
      status: 'accepted',
      startTime: new Date(),
      sdp
    },
    { new: true }
  );
};

callSchema.statics.rejectCall = async function(callId) {
  return this.findOneAndUpdate(
    { callId, status: 'pending' },
    { status: 'rejected' },
    { new: true }
  );
};

callSchema.statics.endCall = async function(callId) {
  const call = await this.findOne({ callId });
  if (!call) return null;

  const endTime = new Date();
  const duration = call.startTime ? Math.floor((endTime - call.startTime) / 1000) : 0;

  return this.findOneAndUpdate(
    { callId },
    {
      status: 'ended',
      endTime,
      duration
    },
    { new: true }
  );
};

callSchema.statics.addIceCandidate = async function(callId, candidate) {
  return this.findOneAndUpdate(
    { callId },
    {
      $push: { iceCandidates: candidate }
    },
    { new: true }
  );
};

callSchema.statics.getUserCalls = async function(userId, limit = 20) {
  return this.find({
    $or: [
      { initiator: userId },
      { receiver: userId }
    ]
  })
  .populate('initiator', 'name photos')
  .populate('receiver', 'name photos')
  .sort({ createdAt: -1 })
  .limit(limit);
};

callSchema.statics.getCallStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { initiator: mongoose.Types.ObjectId(userId) },
          { receiver: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDuration: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'ended'] },
              '$duration',
              0
            ]
          }
        }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalDuration: stat.totalDuration
    };
    return acc;
  }, {
    pending: { count: 0, totalDuration: 0 },
    accepted: { count: 0, totalDuration: 0 },
    rejected: { count: 0, totalDuration: 0 },
    ended: { count: 0, totalDuration: 0 },
    missed: { count: 0, totalDuration: 0 }
  });
};

const Call = mongoose.model('Call', callSchema);

module.exports = Call; 