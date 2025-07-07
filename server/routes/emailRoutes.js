const express = require('express');
const { sendWelcomeEmail, sendProfileReminderEmail, sendMatchEmail } = require('../services/emailService');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Test email functionality (protected route)
router.post('/test-welcome', auth, async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and name are required' 
      });
    }

    const result = await sendWelcomeEmail(email, name);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Welcome email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send welcome email',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Test welcome email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Send profile reminder email
router.post('/profile-reminder', auth, async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and name are required' 
      });
    }

    const result = await sendProfileReminderEmail(email, name);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Profile reminder email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send profile reminder email',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Profile reminder email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Send match notification email
router.post('/match-notification', auth, async (req, res) => {
  try {
    const { email, userName, matchedUserName } = req.body;
    
    if (!email || !userName || !matchedUserName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, userName, and matchedUserName are required' 
      });
    }

    const result = await sendMatchEmail(email, userName, matchedUserName);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Match notification email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send match notification email',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Match notification email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Email configuration status
router.get('/status', auth, (req, res) => {
  const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  
  res.json({
    success: true,
    emailConfigured: hasEmailConfig,
    emailUser: process.env.EMAIL_USER ? 'Configured' : 'Not configured',
    message: hasEmailConfig 
      ? 'Email service is properly configured' 
      : 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.'
  });
});

module.exports = router; 