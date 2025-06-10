const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const AdminConfig = require('../models/AdminConfig');
const AdminLog = require('../models/AdminLog');
const User = require('../models/User');
const Report = require('../models/Report');
const Analytics = require('../models/Analytics');
const SystemMetrics = require('../models/SystemMetrics');

// Dashboard Overview
router.get('/dashboard', admin, async (req, res) => {
  try {
    const [
      userStats,
      reportStats,
      systemHealth,
      recentActivity
    ] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
              }
            },
            verifiedUsers: {
              $sum: {
                $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
              }
            }
          }
        }
      ]),
      // Report statistics
      Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // System health
      SystemMetrics.getSystemHealth(),
      // Recent admin activity
      AdminLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('admin', 'name email')
    ]);

    res.json({
      userStats: userStats[0] || { totalUsers: 0, activeUsers: 0, verifiedUsers: 0 },
      reportStats: reportStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      systemHealth,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// User Management
router.get('/users', admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// User Actions
router.patch('/users/:userId', admin, async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    switch (action) {
      case 'suspend':
        user.isActive = false;
        break;
      case 'activate':
        user.isActive = true;
        break;
      case 'verify':
        user.isVerified = true;
        break;
      case 'unverify':
        user.isVerified = false;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();
    await AdminLog.logActivity(
      req.user._id,
      `User ${action}`,
      'user_management',
      { type: 'user', id: user._id },
      { action },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: `User ${action} successful` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Report Management
router.get('/reports', admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reporter', 'name email')
        .populate('reported', 'name email'),
      Report.countDocuments(query)
    ]);

    res.json({
      reports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReports: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Report Actions
router.patch('/reports/:reportId', admin, async (req, res) => {
  try {
    const { action, notes } = req.body;
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    switch (action) {
      case 'resolve':
        report.status = 'resolved';
        break;
      case 'dismiss':
        report.status = 'dismissed';
        break;
      case 'investigating':
        report.status = 'investigating';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    if (notes) {
      report.adminNotes.push({
        note: notes,
        admin: req.user._id
      });
    }

    await report.save();
    await AdminLog.logActivity(
      req.user._id,
      `Report ${action}`,
      'content_moderation',
      { type: 'report', id: report._id },
      { action, notes },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: `Report ${action} successful` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating report' });
  }
});

// System Configuration
router.get('/config', admin, async (req, res) => {
  try {
    const { category } = req.query;
    const configs = category
      ? await AdminConfig.getConfigsByCategory(category)
      : await AdminConfig.find();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching configurations' });
  }
});

router.post('/config', admin, async (req, res) => {
  try {
    const { key, value, description, category, isPublic } = req.body;
    const config = await AdminConfig.setConfig(
      key,
      value,
      description,
      category,
      isPublic,
      req.user._id
    );

    await AdminLog.logActivity(
      req.user._id,
      'Update configuration',
      'system_config',
      { type: 'config', id: config._id },
      { key, value, category },
      req.ip,
      req.headers['user-agent']
    );

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error updating configuration' });
  }
});

// Admin Activity Logs
router.get('/logs', admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const logs = await AdminLog.getAdminLogs(
      req.user._id,
      category,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    )
    .skip(skip)
    .limit(parseInt(limit));

    const total = await AdminLog.countDocuments({
      admin: req.user._id,
      ...(category && { category }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      } : {})
    });

    res.json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalLogs: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin logs' });
  }
});

// Analytics Dashboard
router.get('/analytics', admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const [
      userAnalytics,
      systemMetrics,
      activityStats
    ] = await Promise.all([
      Analytics.getAggregatedAnalytics(null, startDate, endDate),
      SystemMetrics.getAggregatedMetrics('api', 'response_time', '1d'),
      AdminLog.getActivityStats(startDate, endDate)
    ]);

    res.json({
      userAnalytics,
      systemMetrics,
      activityStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

module.exports = router; 