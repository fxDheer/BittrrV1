const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { auth } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');
const mongoose = require('mongoose');

const router = express.Router();

// Regular login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password using the User model's comparePassword method
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate token and return user data
    const token = generateToken(user._id);
    const userData = user.getPublicProfile();

    res.json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Regular register endpoint
router.post('/register', async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[${requestId}] Registration attempt started:`, { 
      email: req.body.email, 
      name: req.body.name,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    const { name, email, password } = req.body;

    // Enhanced validation with detailed logging
    console.log(`[${requestId}] Validating input fields...`);
    
    if (!name || !email || !password) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      
      console.log(`[${requestId}] Registration failed: Missing required fields:`, missingFields);
      return res.status(400).json({ 
        message: 'Name, email, and password are required',
        missingFields,
        requestId
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`[${requestId}] Registration failed: Invalid email format:`, email);
      return res.status(400).json({ 
        message: 'Please provide a valid email address',
        requestId
      });
    }

    // Validate password strength
    if (password.length < 6) {
      console.log(`[${requestId}] Registration failed: Password too short (${password.length} chars)`);
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters',
        requestId
      });
    }

    if (password.length > 128) {
      console.log(`[${requestId}] Registration failed: Password too long (${password.length} chars)`);
      return res.status(400).json({ 
        message: 'Password must be less than 128 characters',
        requestId
      });
    }

    // Validate name
    if (name.trim().length < 2) {
      console.log(`[${requestId}] Registration failed: Name too short:`, name);
      return res.status(400).json({ 
        message: 'Name must be at least 2 characters',
        requestId
      });
    }

    if (name.trim().length > 50) {
      console.log(`[${requestId}] Registration failed: Name too long:`, name);
      return res.status(400).json({ 
        message: 'Name must be less than 50 characters',
        requestId
      });
    }

    console.log(`[${requestId}] Input validation passed. Checking for existing user...`);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`[${requestId}] Registration failed: Email already exists:`, email);
      return res.status(400).json({ 
        message: 'User with this email already exists',
        requestId
      });
    }

    console.log(`[${requestId}] No existing user found. Creating new user...`);

    // Calculate default date of birth (25 years ago)
    const defaultDateOfBirth = new Date();
    defaultDateOfBirth.setFullYear(defaultDateOfBirth.getFullYear() - 25);

    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password: password,
      dateOfBirth: defaultDateOfBirth,
      gender: 'other',
      lookingFor: 'both',
      isEmailVerified: false,
      lastActive: new Date(),
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
      },
      photos: []
    };

    console.log(`[${requestId}] Creating new user with data:`, {
      name: userData.name,
      email: userData.email,
      hasPassword: !!userData.password,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      lookingFor: userData.lookingFor
    });

    // Create new user (password will be hashed by the User model's pre-save hook)
    const user = new User(userData);

    console.log(`[${requestId}] Attempting to save user to database...`);
    const savedUser = await user.save();
    console.log(`[${requestId}] User saved successfully with ID:`, savedUser._id);

    // Send welcome email (don't await to avoid blocking)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      console.log(`[${requestId}] Attempting to send welcome email...`);
      sendWelcomeEmail(user.email, user.name)
        .then(result => {
          if (result.success) {
            console.log(`[${requestId}] Welcome email sent successfully to:`, user.email);
          } else {
            console.error(`[${requestId}] Failed to send welcome email:`, result.error);
          }
        })
        .catch(error => {
          console.error(`[${requestId}] Error sending welcome email:`, error);
        });
    } else {
      console.log(`[${requestId}] Email credentials not configured, skipping welcome email`);
    }

    // Generate token and return user data
    const token = generateToken(user._id);
    const userData = user.getPublicProfile();

    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] Registration successful for:`, email, `(${responseTime}ms)`);
    
    res.status(201).json({
      success: true,
      token,
      user: userData,
      requestId,
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`[${requestId}] Registration error details:`, {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific MongoDB errors with detailed logging
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.log(`[${requestId}] Validation errors:`, validationErrors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors,
        requestId,
        responseTime: `${responseTime}ms`
      });
    }
    
    if (error.code === 11000) {
      console.log(`[${requestId}] Duplicate key error:`, error.keyValue);
      return res.status(400).json({ 
        message: 'User with this email already exists',
        requestId,
        responseTime: `${responseTime}ms`
      });
    }

    // Handle other specific errors
    if (error.name === 'CastError') {
      console.log(`[${requestId}] Cast error:`, error.message);
      return res.status(400).json({ 
        message: 'Invalid data format',
        requestId,
        responseTime: `${responseTime}ms`
      });
    }

    if (error.name === 'MongoError') {
      console.log(`[${requestId}] MongoDB error:`, error.message);
      return res.status(500).json({ 
        message: 'Database error occurred',
        requestId,
        responseTime: `${responseTime}ms`
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message,
      requestId,
      responseTime: `${responseTime}ms`
    });
  }
});

// Configure Google OAuth Strategy only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
} else {
  console.log('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables missing');
}

// Token validation route
router.get('/validate', auth, async (req, res) => {
  try {
    // If we reach here, the auth middleware has validated the token
    // Return the user data in the format expected by AuthContext
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
});

// Test database connection and count users
router.get('/test-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const userCount = await User.countDocuments();
    
    res.status(200).json({
      status: 'ok',
      database: states[dbState],
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      database: 'unknown'
    });
  }
});

// Debug route to confirm router is loaded (placed at the end to avoid conflicts)
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Auth routes are loaded!',
    routes: {
      login: 'POST /auth/login',
      register: 'POST /auth/register',
      google: '/auth/google',
      callback: '/auth/google/callback',
      validate: '/auth/validate',
      debug: '/auth/debug'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 