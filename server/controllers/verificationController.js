const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Send email verification
exports.sendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      // Configure your email service here
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Verify Your Email',
      text: `Please click the following link to verify your email:
      ${process.env.CLIENT_URL}/verify-email/${token}
      This link will expire in 24 hours.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending verification email', error: error.message });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};

// Request profile verification
exports.requestProfileVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.isProfileVerified) {
      return res.status(400).json({ message: 'Profile already verified' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Verification photo is required' });
    }

    user.profileVerificationPhoto = req.file.path;
    user.profileVerificationStatus = 'pending';
    await user.save();

    res.json({ message: 'Profile verification request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting verification request', error: error.message });
  }
};

// Admin: Review profile verification
exports.reviewProfileVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profileVerificationStatus = status;
    user.isProfileVerified = status === 'approved';
    user.profileVerificationNote = note;
    await user.save();

    // Send notification email
    const transporter = nodemailer.createTransport({
      // Configure your email service here
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Profile Verification Update',
      text: `Your profile verification request has been ${status}.
      ${note ? `Note: ${note}` : ''}`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Profile verification reviewed' });
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing verification', error: error.message });
  }
};

// Get verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isEmailVerified isProfileVerified profileVerificationStatus');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification status', error: error.message });
  }
}; 