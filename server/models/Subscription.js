const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'vip'],
    default: 'free'
  },
  features: [{
    type: String,
    enum: [
      'unlimited_likes',
      'see_who_likes_you',
      'advanced_filters',
      'read_receipts',
      'priority_matching',
      'incognito_mode',
      'message_anyone',
      'video_calls',
      'location_change',
      'profile_boost'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'stripe'],
      required: true
    },
    last4: String,
    expiryMonth: Number,
    expiryYear: Number,
    cardholderName: String
  },
  billingHistory: [{
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      required: true
    },
    transactionId: String
  }],
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
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Static methods
subscriptionSchema.statics.createSubscription = async function(userId, plan, paymentMethod) {
  const planDetails = {
    free: { duration: 0, features: [] },
    basic: { duration: 30, features: ['unlimited_likes', 'read_receipts'] },
    premium: { duration: 30, features: ['unlimited_likes', 'see_who_likes_you', 'advanced_filters', 'read_receipts', 'priority_matching'] },
    vip: { duration: 30, features: ['unlimited_likes', 'see_who_likes_you', 'advanced_filters', 'read_receipts', 'priority_matching', 'incognito_mode', 'message_anyone', 'video_calls', 'location_change', 'profile_boost'] }
  };

  const details = planDetails[plan];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + details.duration);

  return this.create({
    user: userId,
    plan,
    features: details.features,
    endDate,
    paymentMethod
  });
};

subscriptionSchema.statics.updateSubscription = async function(userId, plan) {
  const subscription = await this.findOne({ user: userId });
  if (!subscription) {
    return this.createSubscription(userId, plan);
  }

  const planDetails = {
    free: { duration: 0, features: [] },
    basic: { duration: 30, features: ['unlimited_likes', 'read_receipts'] },
    premium: { duration: 30, features: ['unlimited_likes', 'see_who_likes_you', 'advanced_filters', 'read_receipts', 'priority_matching'] },
    vip: { duration: 30, features: ['unlimited_likes', 'see_who_likes_you', 'advanced_filters', 'read_receipts', 'priority_matching', 'incognito_mode', 'message_anyone', 'video_calls', 'location_change', 'profile_boost'] }
  };

  const details = planDetails[plan];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + details.duration);

  return this.findOneAndUpdate(
    { user: userId },
    {
      plan,
      features: details.features,
      endDate,
      status: 'active'
    },
    { new: true }
  );
};

subscriptionSchema.statics.cancelSubscription = async function(userId) {
  return this.findOneAndUpdate(
    { user: userId },
    {
      autoRenew: false,
      status: 'cancelled'
    },
    { new: true }
  );
};

subscriptionSchema.statics.addPayment = async function(userId, paymentDetails) {
  return this.findOneAndUpdate(
    { user: userId },
    {
      $push: { billingHistory: paymentDetails }
    },
    { new: true }
  );
};

subscriptionSchema.statics.checkFeature = async function(userId, feature) {
  const subscription = await this.findOne({ user: userId });
  if (!subscription) return false;

  if (subscription.status !== 'active') return false;
  if (subscription.endDate < new Date()) return false;

  return subscription.features.includes(feature);
};

subscriptionSchema.statics.getExpiredSubscriptions = async function() {
  return this.find({
    status: 'active',
    endDate: { $lt: new Date() }
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 