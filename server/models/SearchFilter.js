const mongoose = require('mongoose');

const searchFilterSchema = new mongoose.Schema({
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
      max: 100,
      default: 18
    },
    max: {
      type: Number,
      min: 18,
      max: 100,
      default: 100
    }
  },
  distance: {
    type: Number,
    min: 1,
    max: 100,
    default: 50
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'all'],
    default: 'all'
  },
  interests: [{
    type: String
  }],
  dealBreakers: [{
    type: String
  }],
  mustHave: [{
    type: String
  }],
  education: {
    type: String,
    enum: ['any', 'high_school', 'bachelors', 'masters', 'phd'],
    default: 'any'
  },
  occupation: {
    type: String,
    enum: ['any', 'student', 'employed', 'self_employed', 'retired'],
    default: 'any'
  },
  relationshipType: {
    type: String,
    enum: ['any', 'casual', 'serious', 'friendship'],
    default: 'any'
  },
  height: {
    min: {
      type: Number,
      min: 140,
      max: 220,
      default: 140
    },
    max: {
      type: Number,
      min: 140,
      max: 220,
      default: 220
    }
  },
  religion: {
    type: String,
    enum: ['any', 'christian', 'muslim', 'hindu', 'buddhist', 'jewish', 'other', 'none'],
    default: 'any'
  },
  smoking: {
    type: String,
    enum: ['any', 'yes', 'no', 'sometimes'],
    default: 'any'
  },
  drinking: {
    type: String,
    enum: ['any', 'yes', 'no', 'sometimes'],
    default: 'any'
  },
  children: {
    type: String,
    enum: ['any', 'yes', 'no', 'want'],
    default: 'any'
  },
  pets: {
    type: String,
    enum: ['any', 'yes', 'no', 'allergic'],
    default: 'any'
  },
  zodiacSign: {
    type: String,
    enum: ['any', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'],
    default: 'any'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  lastActive: {
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
searchFilterSchema.index({ user: 1 });
searchFilterSchema.index({ location: '2dsphere' });
searchFilterSchema.index({ lastActive: -1 });

// Static methods
searchFilterSchema.statics.createFilter = async function(userId, filterData) {
  return this.create({
    user: userId,
    ...filterData
  });
};

searchFilterSchema.statics.updateFilter = async function(userId, filterData) {
  return this.findOneAndUpdate(
    { user: userId },
    {
      ...filterData,
      lastActive: new Date()
    },
    { new: true, upsert: true }
  );
};

searchFilterSchema.statics.getFilter = async function(userId) {
  return this.findOne({ user: userId });
};

searchFilterSchema.statics.searchUsers = async function(userId, filter) {
  const userFilter = await this.findOne({ user: userId });
  if (!userFilter) return [];

  const query = {
    _id: { $ne: userId },
    'profile.isActive': true,
    'profile.age': {
      $gte: filter.ageRange?.min || userFilter.ageRange.min,
      $lte: filter.ageRange?.max || userFilter.ageRange.max
    }
  };

  // Add gender filter
  if (filter.gender && filter.gender !== 'all') {
    query['profile.gender'] = filter.gender;
  }

  // Add location filter
  if (filter.location) {
    query['profile.location'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: filter.location.coordinates
        },
        $maxDistance: (filter.distance || userFilter.distance) * 1000 // Convert km to meters
      }
    };
  }

  // Add education filter
  if (filter.education && filter.education !== 'any') {
    query['profile.education'] = filter.education;
  }

  // Add occupation filter
  if (filter.occupation && filter.occupation !== 'any') {
    query['profile.occupation'] = filter.occupation;
  }

  // Add relationship type filter
  if (filter.relationshipType && filter.relationshipType !== 'any') {
    query['profile.relationshipType'] = filter.relationshipType;
  }

  // Add height filter
  if (filter.height) {
    query['profile.height'] = {
      $gte: filter.height.min,
      $lte: filter.height.max
    };
  }

  // Add religion filter
  if (filter.religion && filter.religion !== 'any') {
    query['profile.religion'] = filter.religion;
  }

  // Add lifestyle filters
  if (filter.smoking && filter.smoking !== 'any') {
    query['profile.smoking'] = filter.smoking;
  }
  if (filter.drinking && filter.drinking !== 'any') {
    query['profile.drinking'] = filter.drinking;
  }
  if (filter.children && filter.children !== 'any') {
    query['profile.children'] = filter.children;
  }
  if (filter.pets && filter.pets !== 'any') {
    query['profile.pets'] = filter.pets;
  }

  // Add zodiac sign filter
  if (filter.zodiacSign && filter.zodiacSign !== 'any') {
    query['profile.zodiacSign'] = filter.zodiacSign;
  }

  // Add interests filter
  if (filter.interests && filter.interests.length > 0) {
    query['profile.interests'] = { $in: filter.interests };
  }

  // Add deal breakers filter
  if (filter.dealBreakers && filter.dealBreakers.length > 0) {
    query['profile.dealBreakers'] = { $nin: filter.dealBreakers };
  }

  // Add must have filter
  if (filter.mustHave && filter.mustHave.length > 0) {
    query['profile.mustHave'] = { $all: filter.mustHave };
  }

  return User.find(query)
    .select('name photos bio profile')
    .sort({ 'profile.lastActive': -1 });
};

const SearchFilter = mongoose.model('SearchFilter', searchFilterSchema);

module.exports = SearchFilter; 