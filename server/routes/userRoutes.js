const express = require('express');
const router = express.Router();
const { auth, generateToken } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  },
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, dateOfBirth, gender, lookingFor } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      dateOfBirth,
      gender,
      lookingFor,
    });

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  console.log('=== PROFILE UPDATE REQUEST ===');
  console.log('User ID:', req.user._id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'name', 
    'bio', 
    'interests', 
    'preferences',
    'dateOfBirth',
    'gender',
    'lookingFor',
    'city',
    'country',
    'occupation',
    'education'
  ];
  
  console.log('Received updates:', updates);
  console.log('Allowed updates:', allowedUpdates);
  
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  console.log('Is valid operation:', isValidOperation);

  if (!isValidOperation) {
    const invalidUpdates = updates.filter(update => !allowedUpdates.includes(update));
    console.log('Invalid updates:', invalidUpdates);
    return res.status(400).json({ 
      message: 'Invalid updates', 
      allowedUpdates,
      receivedUpdates: updates,
      invalidUpdates
    });
  }

  try {
    console.log('Starting profile update...');
    updates.forEach(update => {
      if (update === 'city' || update === 'country') {
        // Handle location updates
        if (!req.user.location) {
          req.user.location = {};
        }
        req.user.location[update] = req.body[update];
        console.log(`Updated location.${update}:`, req.body[update]);
      } else {
        req.user[update] = req.body[update];
        console.log(`Updated ${update}:`, req.body[update]);
      }
    });
    
    console.log('Saving user...');
    await req.user.save();
    console.log('User saved successfully');
    
    const userProfile = req.user.getPublicProfile();
    const response = {
      success: true,
      message: 'Profile updated successfully',
      user: userProfile
    };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Profile update error:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      message: error.message,
      error: error.toString(),
      stack: error.stack
    });
  }
});

// Upload profile photo
router.post('/profile/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create full URL for the uploaded image
    const baseUrl = process.env.BASE_URL || 'http://13.49.73.45:5000';
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    req.user.photos.push({
      url: imageUrl,
      isVerified: false,
    });

    await req.user.save();
    res.json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update location
router.post('/location', auth, async (req, res) => {
  try {
    const { coordinates } = req.body;
    req.user.location.coordinates = coordinates;
    await req.user.save();
    res.json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get potential matches
router.get('/discover', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      _id: { $ne: req.user._id },
      gender: req.user.lookingFor === 'both' ? { $in: ['male', 'female'] } : req.user.lookingFor,
      lookingFor: { $in: [req.user.gender, 'both'] },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: req.user.location.coordinates,
          },
          $maxDistance: req.user.preferences.distance * 1000, // Convert km to meters
        },
      },
    };

    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name photos bio interests location lastActive');

    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Like a user
router.post('/like/:userId', auth, async (req, res) => {
  try {
    const likedUser = await User.findById(req.params.userId);
    if (!likedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already liked
    if (req.user.likes.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Already liked this user' });
    }

    req.user.likes.push(req.params.userId);
    await req.user.save();

    // Check for match
    if (likedUser.likes.includes(req.user._id)) {
      req.user.matches.push(req.params.userId);
      likedUser.matches.push(req.user._id);
      await Promise.all([req.user.save(), likedUser.save()]);
      return res.json({ message: 'It\'s a match!', isMatch: true });
    }

    res.json({ message: 'User liked successfully', isMatch: false });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get matches
router.get('/matches', auth, async (req, res) => {
  try {
    const matches = await User.find({ _id: { $in: req.user.matches } })
      .select('name photos lastActive');
    res.json(matches);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- PUBLIC ROUTES ---

// Get a list of users for public homepage
router.get('/public/discover', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .skip(skip)
      .limit(parseInt(limit))
      .select('name photos bio interests');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users for discovery' });
  }
});

// Get a single user profile publicly
router.get('/public/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.getPublicProfile());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Debug endpoint to check users in database
router.get('/debug/users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const recentUsers = await User.find({})
      .select('name email gender lookingFor bio interests photos createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      totalUsers,
      recentUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching debug info',
      error: error.message 
    });
  }
});

module.exports = router; 