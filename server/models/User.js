const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if user is not using OAuth
      return !this.googleId;
    },
    minlength: 6,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: function() {
      // Date of birth is required only for non-OAuth users
      return !this.googleId;
    },
  },
  gender: {
    type: String,
    required: function() {
      // Gender is required only for non-OAuth users
      return !this.googleId;
    },
    enum: ['male', 'female', 'other'],
  },
  lookingFor: {
    type: String,
    required: function() {
      // Looking for is required only for non-OAuth users
      return !this.googleId;
    },
    enum: ['male', 'female', 'both'],
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  photos: [{
    url: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  interests: [{
    type: String,
    trim: true,
  }],
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18,
      },
      max: {
        type: Number,
        default: 99,
      },
    },
    distance: {
      type: Number,
      default: 50, // in kilometers
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving (only if password exists and is modified)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // OAuth users don't have passwords
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (excluding sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.email;
  delete userObject.blockedUsers;
  delete userObject.isAdmin;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 