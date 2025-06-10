const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notifications: {
    matches: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Boolean,
      default: true
    },
    likes: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  privacy: {
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    showLastActive: {
      type: Boolean,
      default: true
    },
    showDistance: {
      type: Boolean,
      default: true
    },
    showAge: {
      type: Boolean,
      default: true
    }
  },
  discovery: {
    distance: {
      type: Number,
      default: 50, // in kilometers
      min: 1,
      max: 100
    },
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: 18
      },
      max: {
        type: Number,
        default: 99,
        max: 99
      }
    },
    showMe: {
      type: String,
      enum: ['everyone', 'matches', 'none'],
      default: 'everyone'
    }
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  language: {
    type: String,
    default: 'en'
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

// Update the updatedAt timestamp before saving
userSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate age range
userSettingsSchema.pre('save', function(next) {
  if (this.discovery.ageRange.min > this.discovery.ageRange.max) {
    next(new Error('Minimum age cannot be greater than maximum age'));
  }
  next();
});

// Static method to get default settings
userSettingsSchema.statics.getDefaultSettings = function() {
  return {
    notifications: {
      matches: true,
      messages: true,
      likes: true,
      email: true,
      push: true
    },
    privacy: {
      showOnlineStatus: true,
      showLastActive: true,
      showDistance: true,
      showAge: true
    },
    discovery: {
      distance: 50,
      ageRange: {
        min: 18,
        max: 99
      },
      showMe: 'everyone'
    },
    theme: 'system',
    language: 'en'
  };
};

// Instance method to update settings
userSettingsSchema.methods.updateSettings = async function(updates) {
  const allowedUpdates = [
    'notifications',
    'privacy',
    'discovery',
    'theme',
    'language'
  ];

  Object.keys(updates).forEach(update => {
    if (allowedUpdates.includes(update)) {
      this[update] = {
        ...this[update],
        ...updates[update]
      };
    }
  });

  await this.save();
  return this;
};

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings; 