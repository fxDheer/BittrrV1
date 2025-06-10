const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'text'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    required: function() {
      return this.type === 'image' || this.type === 'video';
    }
  },
  duration: {
    type: Number,
    default: 24, // Duration in hours
    min: 1,
    max: 72
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ location: '2dsphere' });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
storySchema.statics.createStory = async function(userId, storyData) {
  const expiresAt = new Date(Date.now() + storyData.duration * 60 * 60 * 1000);
  return this.create({
    ...storyData,
    user: userId,
    expiresAt
  });
};

storySchema.statics.getUserStories = async function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('user', 'name photos')
  .sort({ createdAt: -1 });
};

storySchema.statics.getNearbyStories = async function(coordinates, maxDistance = 50000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('user', 'name photos')
  .sort({ createdAt: -1 });
};

storySchema.statics.addView = async function(storyId, userId) {
  return this.findByIdAndUpdate(
    storyId,
    {
      $addToSet: {
        views: {
          user: userId,
          viewedAt: new Date()
        }
      }
    },
    { new: true }
  );
};

storySchema.statics.addLike = async function(storyId, userId) {
  return this.findByIdAndUpdate(
    storyId,
    {
      $addToSet: {
        likes: {
          user: userId,
          likedAt: new Date()
        }
      }
    },
    { new: true }
  );
};

storySchema.statics.addComment = async function(storyId, userId, content) {
  return this.findByIdAndUpdate(
    storyId,
    {
      $push: {
        comments: {
          user: userId,
          content,
          createdAt: new Date()
        }
      }
    },
    { new: true }
  );
};

storySchema.statics.deactivateExpiredStories = async function() {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    {
      $set: { isActive: false }
    }
  );
};

const Story = mongoose.model('Story', storySchema);

module.exports = Story; 