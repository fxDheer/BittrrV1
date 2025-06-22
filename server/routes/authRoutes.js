const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

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
      
      if (user) {
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
        isEmailVerified: true
      });
      
      await user.save();
      return cb(null, user);
    } catch (error) {
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
  (req, res) => {
    // Successful authentication, redirect to frontend with token
    const token = generateToken(req.user._id);
    const userData = req.user.getPublicProfile();
    
    // Redirect to frontend with token and user data
    res.redirect(`https://www.bittrr.com/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
  }
);

module.exports = router; 