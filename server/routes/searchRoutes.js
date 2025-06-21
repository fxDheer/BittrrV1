const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SearchFilter = require('../models/SearchFilter');
const User = require('../models/User');
const Block = require('../models/Block');
const SearchHistory = require('../models/SearchHistory');

// Get user's search filters
router.get('/filters', auth, async (req, res) => {
  try {
    const filter = await SearchFilter.getFilter(req.user._id);
    if (!filter) {
      return res.json({
        ageRange: { min: 18, max: 100 },
        distance: 50,
        gender: 'all',
        interests: [],
        dealBreakers: [],
        mustHave: [],
        education: 'any',
        occupation: 'any',
        relationshipType: 'any',
        height: { min: 140, max: 220 },
        religion: 'any',
        smoking: 'any',
        drinking: 'any',
        children: 'any',
        pets: 'any',
        zodiacSign: 'any'
      });
    }
    res.json(filter);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching search filters' });
  }
});

// Update user's search filters
router.patch('/filters', auth, async (req, res) => {
  try {
    const filter = await SearchFilter.updateFilter(req.user._id, req.body);
    res.json(filter);
  } catch (error) {
    res.status(500).json({ message: 'Error updating search filters' });
  }
});

// Search users with filters
router.post('/users', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.body;
    const skip = (page - 1) * limit;

    // Get blocked users
    const blockedUsers = await Block.find({
      $or: [
        { blocker: req.user._id },
        { blocked: req.user._id }
      ]
    }).select('blocker blocked');

    const blockedUserIds = blockedUsers.map(block => 
      block.blocker.toString() === req.user._id.toString() 
        ? block.blocked 
        : block.blocker
    );

    // Add blocked users to filter
    filters.excludeUsers = [...(filters.excludeUsers || []), ...blockedUserIds];

    const users = await SearchFilter.searchUsers(req.user._id, filters);
    const total = await User.countDocuments(filters);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get search suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }

    const suggestions = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { 'profile.interests': { $regex: query, $options: 'i' } },
        { 'profile.occupation': { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    })
    .select('name photos profile.interests profile.occupation')
    .limit(10);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
});

// Get popular search terms
router.get('/popular', auth, async (req, res) => {
  try {
    const popularTerms = await SearchFilter.aggregate([
      {
        $group: {
          _id: '$interests',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json(popularTerms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popular terms' });
  }
});

// Save search history
router.post('/history', auth, async (req, res) => {
  try {
    const { searchTerm, filters } = req.body;
    await SearchHistory.create({
      user: req.user._id,
      searchTerm,
      filters
    });
    res.json({ message: 'Search history saved' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving search history' });
  }
});

// Get search history
router.get('/history', auth, async (req, res) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching search history' });
  }
});

// Clear search history
router.delete('/history', auth, async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'Search history cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing search history' });
  }
});

module.exports = router; 