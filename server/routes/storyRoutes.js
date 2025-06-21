const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { apiLimiter } = require('../middleware/rateLimiter');
const Story = require('../models/Story');
const Block = require('../models/Block');

// Configure multer for story uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/stories');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Create a new story
router.post('/', auth, apiLimiter, upload.single('media'), async (req, res) => {
  try {
    const { type, content, duration, location } = req.body;
    const mediaUrl = req.file ? `/uploads/stories/${req.file.filename}` : null;

    const storyData = {
      type,
      content,
      duration: duration || 24,
      mediaUrl,
      location: location ? JSON.parse(location) : null
    };

    const story = await Story.createStory(req.user._id, storyData);
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: 'Error creating story' });
  }
});

// Get user's stories
router.get('/user/:userId', auth, apiLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is blocked
    const isBlocked = await Block.isBlocked(req.user._id, userId);
    if (isBlocked) {
      return res.status(403).json({ message: 'Cannot view stories of blocked user' });
    }

    const stories = await Story.getUserStories(userId);
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stories' });
  }
});

// Get nearby stories
router.get('/nearby', auth, apiLimiter, async (req, res) => {
  try {
    const { coordinates, maxDistance } = req.query;
    if (!coordinates) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }

    const stories = await Story.getNearbyStories(
      JSON.parse(coordinates),
      maxDistance ? parseInt(maxDistance) : undefined
    );
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nearby stories' });
  }
});

// Add view to story
router.post('/:storyId/view', auth, apiLimiter, async (req, res) => {
  try {
    const story = await Story.addView(req.params.storyId, req.user._id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Error adding view' });
  }
});

// Like a story
router.post('/:storyId/like', auth, apiLimiter, async (req, res) => {
  try {
    const story = await Story.addLike(req.params.storyId, req.user._id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Error liking story' });
  }
});

// Add comment to story
router.post('/:storyId/comment', auth, apiLimiter, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const story = await Story.addComment(req.params.storyId, req.user._id, content);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Delete a story
router.delete('/:storyId', auth, apiLimiter, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await story.remove();
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting story' });
  }
});

module.exports = router; 