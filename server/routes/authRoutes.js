const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { auth } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://api.bittrr.com/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      let isNewUser = false;
      
      if (user) {
        // Update last active time
        user.lastActive = new Date();
        await user.save();
        return cb(null, user);
      }
      
      // Create new user if doesn't exist
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        photos: [{
          url: profile.photos[0].value,
          isVerified: true
        }],
        isEmailVerified: true,
        isVerified: true, // Google users are considered verified
        lastActive: new Date(),
        // Set default values for required fields
        location: {
          city: '',
          country: '',
          coordinates: [0, 0]
        },
        interests: [],
        bio: '',
        preferences: {
          ageRange: { min: 18, max: 99 },
          distance: 50
        }
      });
      
      await user.save();
      isNewUser = true;
      
      // Send welcome email to new users (don't await to avoid blocking the auth flow)
      if (isNewUser && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        sendWelcomeEmail(user.email, user.name)
          .then(result => {
            if (result.success) {
              console.log('Welcome email sent successfully to:', user.email);
            } else {
              console.error('Failed to send welcome email:', result.error);
            }
          })
          .catch(error => {
            console.error('Error sending welcome email:', error);
          });
      }
      
      return cb(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return cb(error, null);
    }
  }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth login route
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Fetch full user object to ensure methods are available
      const user = await User.findById(req.user.id);
      if (!user) {
        console.error('User not found after OAuth authentication');
        return res.redirect('https://www.bittrr.com/login?error=user_not_found');
      }

      // Successful authentication, redirect to frontend with token
      const token = generateToken(user._id);
      const userData = user.getPublicProfile();
      
      // Redirect to frontend with token and user data
      const redirectUrl = `https://www.bittrr.com/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      console.log('Redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect('https://www.bittrr.com/login?error=auth_failed');
    }
  }
);

// Token validation route
router.get('/validate', auth, (req, res) => {
  res.status(200).json({ user: req.user.getPublicProfile() });
});

module.exports = router; 