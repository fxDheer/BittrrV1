const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { messageLimiter } = require('../middleware/rateLimiter');
const MatchPreference = require('../models/MatchPreference');
const User = require('../models/User');
const Block = require('../models/Block');
const Match = require('../models/Match');
const { apiLimiter } = require('../middleware/rateLimiter');

// Get user's match preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    let preferences = await MatchPreference.findOne({ user: req.user._id });
    
    if (!preferences) {
      preferences = await MatchPreference.create({
        user: req.user._id,
        location: {
          coordinates: [0, 0] // Default coordinates
        }
      });
    }
    
    res.json(preferences);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update match preferences
router.patch('/preferences', auth, async (req, res) => {
  try {
    const updates = req.body;
    let preferences = await MatchPreference.findOne({ user: req.user._id });
    
    if (!preferences) {
      preferences = new MatchPreference({
        user: req.user._id,
        ...updates
      });
    } else {
      Object.keys(updates).forEach(update => {
        preferences[update] = updates[update];
      });
    }
    
    await preferences.save();
    res.json(preferences);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update location
router.post('/location', auth, async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }
    
    let preferences = await MatchPreference.findOne({ user: req.user._id });
    
    if (!preferences) {
      preferences = new MatchPreference({
        user: req.user._id,
        location: { coordinates }
      });
    } else {
      preferences.location.coordinates = coordinates;
      preferences.lastActive = new Date();
    }
    
    await preferences.save();
    res.json(preferences);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's matches
router.get('/', auth, apiLimiter, async (req, res) => {
  try {
    const matches = await Match.getUserMatches(req.user._id);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching matches' });
  }
});

// Get match statistics
router.get('/stats', auth, apiLimiter, async (req, res) => {
  try {
    const stats = await Match.getMatchStats(req.user._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching match statistics' });
  }
});

// Like a user
router.post('/like/:userId', auth, apiLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if users exist
    const [user1, user2] = await Promise.all([
      User.findById(req.user._id),
      User.findById(userId)
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if either user has blocked the other
    const isBlocked = await Block.isBlocked(req.user._id, userId);
    if (isBlocked) {
      return res.status(403).json({ message: 'Cannot like blocked user' });
    }

    // Find existing match
    let match = await Match.findMatch(req.user._id, userId);

    if (!match) {
      // Create new match
      match = await Match.createMatch(req.user._id, userId);
    } else {
      // Add like to existing match
      match = await Match.addLike(match._id, req.user._id);
    }

    // Check if it's a mutual match
    if (match.likes.length === 2) {
      match = await Match.updateStatus(match._id, 'matched');
      
      // Emit match event to both users
      req.app.get('io').to([req.user._id.toString(), userId]).emit('newMatch', {
        matchId: match._id,
        users: [user1, user2]
      });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: 'Error processing like' });
  }
});

// Reject a match
router.post('/reject/:matchId', auth, apiLimiter, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (!match.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedMatch = await Match.updateStatus(match._id, 'rejected');
    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting match' });
  }
});

// Get potential matches
router.get('/discover', auth, apiLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get user's preferences
    const preferences = await MatchPreference.findOne({ user: req.user._id });
    if (!preferences) {
      return res.status(404).json({ message: 'Match preferences not found' });
    }

    // Get potential matches
    const potentialMatches = await MatchPreference.findPotentialMatches(
      req.user._id,
      preferences,
      skip,
      parseInt(limit)
    );

    // Get blocked users
    const blockedUsers = await Block.findBlockedUsers(req.user._id);
    const blockedUserIds = blockedUsers.map(block => 
      block.blocker.toString() === req.user._id.toString() 
        ? block.blocked 
        : block.blocker
    );

    // Filter out blocked users and calculate match scores
    const matches = potentialMatches
      .filter(match => !blockedUserIds.includes(match.user._id.toString()))
      .map(match => ({
        ...match.toObject(),
        matchScore: MatchPreference.calculateMatchScore(preferences, match)
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      matches,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: matches.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching potential matches' });
  }
});

// Get match score with another user
router.get('/score/:userId', auth, async (req, res) => {
  try {
    const score = await MatchPreference.calculateMatchScore(
      req.user._id,
      req.params.userId
    );
    res.json({ score });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle active status
router.patch('/active', auth, async (req, res) => {
  try {
    const { active } = req.body;
    const preferences = await MatchPreference.findOne({ user: req.user._id });
    
    if (!preferences) {
      return res.status(404).json({ message: 'Match preferences not found' });
    }
    
    preferences.active = active;
    await preferences.save();
    
    res.json(preferences);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 