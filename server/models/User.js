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
  age: {
    type: Number,
    min: 18,
    max: 100,
  },
  dateOfBirth: {
    type: Date,
    required: function() {
      // Date of birth is required only for non-OAuth users
      return !this.googleId;
    },
    default: function() {
      // Default to 25 years old if not provided
      const date = new Date();
      date.setFullYear(date.getFullYear() - 25);
      return date;
    }
  },
  gender: {
    type: String,
    required: function() {
      // Gender is required only for non-OAuth users
      return !this.googleId;
    },
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  lookingFor: {
    type: String,
    required: function() {
      // Looking for is required only for non-OAuth users
      return !this.googleId;
    },
    enum: ['male', 'female', 'both'],
    default: 'both'
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
    city: String,
    country: String,
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
  
  // Remove sensitive data
  delete userObject.password;
  delete userObject.email;
  delete userObject.blockedUsers;
  delete userObject.isAdmin;
  
  // Ensure required fields exist for frontend compatibility
  if (!userObject.location) {
    userObject.location = { city: '', country: '' };
  }
  if (!userObject.interests) {
    userObject.interests = [];
  }
  if (!userObject.photos) {
    userObject.photos = [];
  }
  if (!userObject.bio) {
    userObject.bio = '';
  }
  
  // Convert relative image URLs to full URLs
  const baseUrl = process.env.BASE_URL || 'http://13.49.73.45:5000';
  if (userObject.photos && userObject.photos.length > 0) {
    userObject.photos = userObject.photos.map(photo => ({
      ...photo,
      url: photo.url.startsWith('http') ? photo.url : `${baseUrl}${photo.url}`
    }));
  }
  
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 