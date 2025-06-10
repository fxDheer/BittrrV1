const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { messageLimiter } = require('../middleware/rateLimiter');
const Verification = require('../models/Verification');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/verification');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
    }
  }
});

// Request email verification
router.post('/email', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let verification = await Verification.findOne({ user: req.user._id });
    if (!verification) {
      verification = new Verification({
        user: req.user._id,
        type: 'email'
      });
    }

    verification.verificationCode = Verification.generateCode();
    verification.codeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    verification.attempts = 0;
    await verification.save();

    // TODO: Send verification email
    // For now, just return the code (in production, this should be sent via email)
    res.json({ message: 'Verification code sent to email', code: verification.verificationCode });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Verify email code
router.post('/email/verify', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const verification = await Verification.findOne({ user: req.user._id });

    if (!verification) {
      return res.status(404).json({ message: 'No verification request found' });
    }

    const isValid = await verification.verifyCode(code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload verification document
router.post('/document', auth, upload.single('document'), async (req, res) => {
  try {
    const { type } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let verification = await Verification.findOne({ user: req.user._id });
    if (!verification) {
      verification = new Verification({
        user: req.user._id,
        type: 'document'
      });
    }

    verification.documents.push({
      type,
      url: req.file.path,
      status: 'pending'
    });

    await verification.save();
    res.json(verification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get verification status
router.get('/status', auth, async (req, res) => {
  try {
    const verification = await Verification.findOne({ user: req.user._id });
    if (!verification) {
      return res.json({
        status: 'not_started',
        emailVerified: false,
        phoneVerified: false,
        documents: []
      });
    }

    res.json(verification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin routes

// Get all verification requests
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const verifications = await Verification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('documents.verifiedBy', 'name email')
      .populate('adminNotes.admin', 'name email');

    const total = await Verification.countDocuments(query);

    res.json({
      verifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update document status
router.patch('/admin/document/:verificationId', adminAuth, async (req, res) => {
  try {
    const { documentType, status, note } = req.body;
    const verification = await Verification.findById(req.params.verificationId);

    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    await verification.updateDocumentStatus(documentType, status, req.user._id);
    if (note) {
      await verification.addAdminNote(req.user._id, note);
    }

    res.json(verification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add admin note
router.post('/admin/note/:verificationId', adminAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const verification = await Verification.findById(req.params.verificationId);

    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    await verification.addAdminNote(req.user._id, note);
    res.json(verification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 