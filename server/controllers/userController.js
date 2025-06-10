const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, name, age, gender } = req.body;
    
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
      age,
      gender
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        settings: user.settings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        settings: user.settings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('matches', 'name age gender photos')
      .populate('likes', 'name age gender photos');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, interests, location } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (interests) user.interests = interests;
    if (location) {
      user.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      };
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Get potential matches (excluding self, already liked/disliked/matched users)
const getPotentialMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const excludeIds = [
      user._id,
      ...user.likes,
      ...user.dislikes,
      ...user.matches
    ];
    const potentialMatches = await User.find({
      _id: { $nin: excludeIds },
      gender: { $ne: user.gender } // Optional: show only opposite gender
    }).select('-password');
    res.json(potentialMatches);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Like a user
const likeUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);
    const likedUser = await User.findById(userId);
    if (!likedUser) return res.status(404).json({ message: 'User not found' });
    if (user.likes.includes(userId) || user.matches.includes(userId)) {
      return res.status(400).json({ message: 'Already liked or matched' });
    }
    user.likes.push(userId);
    // If likedUser already liked this user, it's a match
    let isMatch = false;
    if (likedUser.likes.includes(user._id)) {
      user.matches.push(userId);
      likedUser.matches.push(user._id);
      isMatch = true;
      await likedUser.save();
    }
    await user.save();
    res.json({ isMatch, matchedUser: isMatch ? likedUser : null });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Dislike a user
const dislikeUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);
    if (user.dislikes.includes(userId)) {
      return res.status(400).json({ message: 'Already disliked' });
    }
    user.dislikes.push(userId);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get matches
const getMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('matches', 'name age gender photos bio');
    res.json(user.matches);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Upload user photo
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const user = await User.findById(req.user._id);
    user.photos.push(req.file.path);
    await user.save();
    res.json({ success: true, photo: req.file.path });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update user settings
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findById(req.user._id);

    user.settings = {
      ...user.settings,
      ...settings
    };

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId);
      await user.save();
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking user', error: error.message });
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking user', error: error.message });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      // Configure your email service here
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) requested a password reset.
      Please click on the following link to reset your password:
      ${process.env.CLIENT_URL}/reset-password/${token}
      If you did not request this, please ignore this email.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting password reset', error: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// Update online status
const updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findById(req.user._id);

    user.isOnline = isOnline;
    user.lastActive = new Date();
    await user.save();

    res.json({ message: 'Online status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating online status', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getPotentialMatches,
  likeUser,
  dislikeUser,
  getMatches,
  uploadPhoto,
  updateSettings,
  blockUser,
  unblockUser,
  requestPasswordReset,
  resetPassword,
  updateOnlineStatus
}; 