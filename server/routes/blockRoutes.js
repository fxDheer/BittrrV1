const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { messageLimiter } = require('../middleware/rateLimiter');
const Block = require('../models/Block');
const User = require('../models/User');
const Message = require('../models/Message');

// Block a user
router.post('/:userId', auth, messageLimiter, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const blockedUserId = req.params.userId;

    // Check if user exists
    const blockedUser = await User.findById(blockedUserId);
    if (!blockedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is blocking themselves
    if (blockedUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    // Create block
    const block = await Block.create({
      blocker: req.user._id,
      blocked: blockedUserId,
      reason,
      description
    });

    // Delete any existing messages between users
    await Message.deleteMany({
      $or: [
        { sender: req.user._id, receiver: blockedUserId },
        { sender: blockedUserId, receiver: req.user._id }
      ]
    });

    res.status(201).json(block);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User is already blocked' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Unblock a user
router.delete('/:userId', auth, async (req, res) => {
  try {
    const block = await Block.findOneAndDelete({
      blocker: req.user._id,
      blocked: req.params.userId
    });

    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all blocked users
router.get('/', auth, async (req, res) => {
  try {
    const blocks = await Block.getBlockedUsers(req.user._id);
    res.json(blocks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all users who blocked the current user
router.get('/blocked-by', auth, async (req, res) => {
  try {
    const blocks = await Block.getBlockedBy(req.user._id);
    res.json(blocks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check if a user is blocked
router.get('/check/:userId', auth, async (req, res) => {
  try {
    const isBlocked = await Block.isBlocked(req.user._id, req.params.userId);
    res.json({ isBlocked });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 