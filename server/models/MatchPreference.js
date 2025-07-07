const mongoose = require('mongoose');

const matchPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  ageRange: {
    min: {
      type: Number,
      min: 18,
      max: 99,
      default: 18
    },
    max: {
      type: Number,
      min: 18,
      max: 99,
      default: 99
    }
  },
  distance: {
    type: Number,
    min: 1,
    max: 100,
    default: 50 // in kilometers
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'all'],
    default: 'all'
  },
  interests: [{
    type: String,
    trim: true
  }],
  dealBreakers: [{
    type: String,
    trim: true
  }],
  mustHave: [{
    type: String,
    trim: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
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

// Update timestamps
matchPreferenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate age range
matchPreferenceSchema.pre('save', function(next) {
  if (this.ageRange.min > this.ageRange.max) {
    next(new Error('Minimum age cannot be greater than maximum age'));
  }
  next();
});

// Create geospatial index for location-based queries
matchPreferenceSchema.index({ location: '2dsphere' });

// Static method to find potential matches
matchPreferenceSchema.statics.findPotentialMatches = async function(userId, preferences, skip = 0, limit = 20) {
  if (!preferences) {
    const userPrefs = await this.findOne({ user: userId });
    if (!userPrefs) {
      throw new Error('User preferences not found');
    }
    preferences = userPrefs;
  }

  const query = {
    user: { $ne: userId },
    active: true,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: preferences.location.coordinates
        },
        $maxDistance: preferences.distance * 1000 // Convert km to meters
      }
    }
  };

  // Add gender filter if specified
  if (preferences.gender !== 'all') {
    query.gender = preferences.gender;
  }

  // Add age range filter
  query.age = {
    $gte: preferences.ageRange.min,
    $lte: preferences.ageRange.max
  };

  return this.find(query)
    .skip(skip)
    .limit(limit)
    .populate('user', 'name photos bio interests')
    .sort({ lastActive: -1 });
};

// Static method to calculate match score
matchPreferenceSchema.statics.calculateMatchScore = async function(prefs1, prefs2) {
  // If userIds are passed instead of preferences, fetch them
  if (typeof prefs1 === 'string' && typeof prefs2 === 'string') {
    const [userPrefs1, userPrefs2] = await Promise.all([
      this.findOne({ user: prefs1 }),
      this.findOne({ user: prefs2 })
    ]);

    if (!userPrefs1 || !userPrefs2) {
      throw new Error('User preferences not found');
    }
    prefs1 = userPrefs1;
    prefs2 = userPrefs2;
  }

  if (!prefs1 || !prefs2) {
    throw new Error('User preferences not found');
  }

  let score = 0;
  const maxScore = 100;

  // Calculate distance score (max 30 points)
  const distance = this.calculateDistance(
    prefs1.location.coordinates,
    prefs2.location.coordinates
  );
  const distanceScore = Math.max(0, 30 - (distance / prefs1.distance) * 30);
  score += distanceScore;

  // Calculate age compatibility (max 20 points)
  const ageScore = this.calculateAgeScore(prefs1, prefs2);
  score += ageScore;

  // Calculate interests match (max 30 points)
  const interestScore = this.calculateInterestScore(prefs1, prefs2);
  score += interestScore;

  // Calculate deal breakers (max 20 points)
  const dealBreakerScore = this.calculateDealBreakerScore(prefs1, prefs2);
  score += dealBreakerScore;

  return Math.min(maxScore, score);
};

// Helper method to calculate distance between two points
matchPreferenceSchema.statics.calculateDistance = function(coords1, coords2) {
  const R = 6371; // Earth's radius in km
  const dLat = this.toRad(coords2[1] - coords1[1]);
  const dLon = this.toRad(coords2[0] - coords1[0]);
  const lat1 = this.toRad(coords1[1]);
  const lat2 = this.toRad(coords2[1]);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper method to convert degrees to radians
matchPreferenceSchema.statics.toRad = function(degrees) {
  return degrees * Math.PI / 180;
};

// Helper method to calculate age compatibility score
matchPreferenceSchema.statics.calculateAgeScore = function(prefs1, prefs2) {
  const age1 = prefs1.ageRange;
  const age2 = prefs2.ageRange;
  
  if (age1.min <= age2.max && age1.max >= age2.min) {
    return 20;
  }
  return 0;
};

// Helper method to calculate interests match score
matchPreferenceSchema.statics.calculateInterestScore = function(prefs1, prefs2) {
  const commonInterests = prefs1.interests.filter(interest => 
    prefs2.interests.includes(interest)
  );
  
  const totalInterests = new Set([...prefs1.interests, ...prefs2.interests]).size;
  return (commonInterests.length / totalInterests) * 30;
};

// Helper method to calculate deal breaker score
matchPreferenceSchema.statics.calculateDealBreakerScore = function(prefs1, prefs2) {
  const hasDealBreaker = prefs1.dealBreakers.some(breaker => 
    prefs2.mustHave.includes(breaker)
  ) || prefs2.dealBreakers.some(breaker => 
    prefs1.mustHave.includes(breaker)
  );

  return hasDealBreaker ? 0 : 20;
};

const MatchPreference = mongoose.model('MatchPreference', matchPreferenceSchema);

module.exports = MatchPreference; 