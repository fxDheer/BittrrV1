const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  },
});

// Send a message
router.post('/:receiverId', auth, async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const receiver = await User.findById(req.params.receiverId);

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if users are matched
    if (!req.user.matches.includes(req.params.receiverId)) {
      return res.status(403).json({ message: 'Cannot send message to unmatched user' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: req.params.receiverId,
      content,
      type,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send media message
router.post('/:receiverId/media', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const receiver = await User.findById(req.params.receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if users are matched
    if (!req.user.matches.includes(req.params.receiverId)) {
      return res.status(403).json({ message: 'Cannot send message to unmatched user' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: req.params.receiverId,
      content: 'Media message',
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
      mediaUrl: `/uploads/messages/${req.file.filename}`,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get conversation with a user
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { before, limit = 50 } = req.query;
    const messages = await Message.getConversation(
      req.user._id,
      req.params.userId,
      parseInt(limit),
      before ? new Date(before) : null
    );
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark messages as read
router.patch('/read/:senderId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      sender: req.params.senderId,
      receiver: req.user._id,
      isRead: false,
    });

    await Promise.all(messages.map(message => message.markAsRead()));
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete others\' messages' });
    }

    await message.softDelete();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 