const mongoose = require('mongoose');

const adminConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['general', 'security', 'moderation', 'notifications', 'features', 'appearance'],
    default: 'general'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
adminConfigSchema.index({ key: 1 });
adminConfigSchema.index({ category: 1 });

// Static methods
adminConfigSchema.statics.getConfig = async function(key) {
  const config = await this.findOne({ key });
  return config ? config.value : null;
};

adminConfigSchema.statics.setConfig = async function(key, value, description, category, isPublic, userId) {
  return this.findOneAndUpdate(
    { key },
    {
      value,
      description,
      category,
      isPublic,
      lastModifiedBy: userId
    },
    { new: true, upsert: true }
  );
};

adminConfigSchema.statics.getConfigsByCategory = async function(category) {
  return this.find({ category });
};

adminConfigSchema.statics.getPublicConfigs = async function() {
  return this.find({ isPublic: true });
};

adminConfigSchema.statics.deleteConfig = async function(key) {
  return this.findOneAndDelete({ key });
};

const AdminConfig = mongoose.model('AdminConfig', adminConfigSchema);

module.exports = AdminConfig; 