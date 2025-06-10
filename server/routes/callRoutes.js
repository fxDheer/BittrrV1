const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { apiLimiter } = require('../middleware/rateLimiter');
const Call = require('../models/Call');
const Block = require('../models/Block');
const User = require('../models/User');

// Initialize a call
router.post('/initiate', auth, apiLimiter, async (req, res) => {
  try {
    const { receiverId, type, iceServers } = req.body;

    // Check if users exist
    const [initiator, receiver] = await Promise.all([
      User.findById(req.user._id),
      User.findById(receiverId)
    ]);

    if (!initiator || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if either user has blocked the other
    const isBlocked = await Block.isBlocked(req.user._id, receiverId);
    if (isBlocked) {
      return res.status(403).json({ message: 'Cannot call blocked user' });
    }

    // Create call
    const call = await Call.createCall(req.user._id, receiverId, type, iceServers);

    // Emit call event to receiver
    req.app.get('io').to(receiverId.toString()).emit('incomingCall', {
      callId: call.callId,
      type: call.type,
      initiator: {
        _id: initiator._id,
        name: initiator.name,
        photos: initiator.photos
      }
    });

    res.status(201).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Error initiating call' });
  }
});

// Accept a call
router.post('/:callId/accept', auth, apiLimiter, async (req, res) => {
  try {
    const { sdp } = req.body;
    const call = await Call.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (call.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this call' });
    }

    const updatedCall = await Call.acceptCall(call.callId, sdp);

    // Emit call accepted event to initiator
    req.app.get('io').to(call.initiator.toString()).emit('callAccepted', {
      callId: call.callId,
      sdp
    });

    res.json(updatedCall);
  } catch (error) {
    res.status(500).json({ message: 'Error accepting call' });
  }
});

// Reject a call
router.post('/:callId/reject', auth, apiLimiter, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (call.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this call' });
    }

    const updatedCall = await Call.rejectCall(call.callId);

    // Emit call rejected event to initiator
    req.app.get('io').to(call.initiator.toString()).emit('callRejected', {
      callId: call.callId
    });

    res.json(updatedCall);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting call' });
  }
});

// End a call
router.post('/:callId/end', auth, apiLimiter, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (![call.initiator.toString(), call.receiver.toString()].includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to end this call' });
    }

    const updatedCall = await Call.endCall(call.callId);

    // Emit call ended event to both users
    req.app.get('io').to([call.initiator.toString(), call.receiver.toString()]).emit('callEnded', {
      callId: call.callId,
      duration: updatedCall.duration
    });

    res.json(updatedCall);
  } catch (error) {
    res.status(500).json({ message: 'Error ending call' });
  }
});

// Add ICE candidate
router.post('/:callId/ice-candidate', auth, apiLimiter, async (req, res) => {
  try {
    const { candidate } = req.body;
    const call = await Call.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (![call.initiator.toString(), call.receiver.toString()].includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to add ICE candidate' });
    }

    const updatedCall = await Call.addIceCandidate(call.callId, candidate);

    // Emit ICE candidate to the other user
    const otherUserId = call.initiator.toString() === req.user._id.toString()
      ? call.receiver.toString()
      : call.initiator.toString();

    req.app.get('io').to(otherUserId).emit('iceCandidate', {
      callId: call.callId,
      candidate
    });

    res.json(updatedCall);
  } catch (error) {
    res.status(500).json({ message: 'Error adding ICE candidate' });
  }
});

// Get user's call history
router.get('/history', auth, apiLimiter, async (req, res) => {
  try {
    const { limit } = req.query;
    const calls = await Call.getUserCalls(req.user._id, limit ? parseInt(limit) : undefined);
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching call history' });
  }
});

// Get call statistics
router.get('/stats', auth, apiLimiter, async (req, res) => {
  try {
    const stats = await Call.getCallStats(req.user._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching call statistics' });
  }
});

module.exports = router; 