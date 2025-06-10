const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  searchTerm: {
    type: String,
    required: true
  },
  filters: {
    type: Object,
    default: {}
  },
  results: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
searchHistorySchema.index({ user: 1, createdAt: -1 });
searchHistorySchema.index({ searchTerm: 'text' });

// Static methods
searchHistorySchema.statics.createHistory = async function(userId, searchData) {
  return this.create({
    user: userId,
    ...searchData
  });
};

searchHistorySchema.statics.getHistory = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

searchHistorySchema.statics.clearHistory = async function(userId) {
  return this.deleteMany({ user: userId });
};

searchHistorySchema.statics.getPopularSearches = async function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$searchTerm',
        count: { $sum: 1 },
        lastSearched: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1, lastSearched: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

searchHistorySchema.statics.getRecentSearches = async function(userId, limit = 5) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('searchTerm filters createdAt');
};

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

module.exports = SearchHistory; 