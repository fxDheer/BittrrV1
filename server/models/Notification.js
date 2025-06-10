const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['match', 'message', 'like', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

// Static method to create a match notification
notificationSchema.statics.createMatchNotification = async function(user1Id, user2Id) {
  const [user1, user2] = await Promise.all([
    this.model('User').findById(user1Id),
    this.model('User').findById(user2Id),
  ]);

  const notifications = [
    {
      recipient: user1Id,
      sender: user2Id,
      type: 'match',
      content: `You matched with ${user2.name}!`,
      data: { matchId: user2Id },
    },
    {
      recipient: user2Id,
      sender: user1Id,
      type: 'match',
      content: `You matched with ${user1.name}!`,
      data: { matchId: user1Id },
    },
  ];

  return this.insertMany(notifications);
};

// Static method to create a message notification
notificationSchema.statics.createMessageNotification = async function(senderId, receiverId, messageId) {
  const sender = await this.model('User').findById(senderId);
  
  return this.create({
    recipient: receiverId,
    sender: senderId,
    type: 'message',
    content: `New message from ${sender.name}`,
    data: { messageId },
  });
};

// Static method to create a like notification
notificationSchema.statics.createLikeNotification = async function(senderId, receiverId) {
  const sender = await this.model('User').findById(senderId);
  
  return this.create({
    recipient: receiverId,
    sender: senderId,
    type: 'like',
    content: `${sender.name} liked your profile`,
    data: { userId: senderId },
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 