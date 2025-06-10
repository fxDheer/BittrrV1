const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const UserSettings = require('../models/UserSettings');

// Get user settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update notification settings
router.patch('/notifications', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    await settings.updateSettings({ notifications: req.body });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update privacy settings
router.patch('/privacy', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    await settings.updateSettings({ privacy: req.body });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update discovery settings
router.patch('/discovery', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    await settings.updateSettings({ discovery: req.body });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update theme
router.patch('/theme', auth, async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ message: 'Invalid theme value' });
    }
    
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    await settings.updateSettings({ theme });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update language
router.patch('/language', auth, async (req, res) => {
  try {
    const { language } = req.body;
    
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ message: 'Invalid language value' });
    }
    
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    await settings.updateSettings({ language });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reset settings to default
router.post('/reset', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        ...UserSettings.getDefaultSettings()
      });
    } else {
      settings = await UserSettings.findOneAndUpdate(
        { user: req.user._id },
        { $set: UserSettings.getDefaultSettings() },
        { new: true }
      );
    }
    
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 