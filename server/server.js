const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const User = require('./models/User');
const path = require('path');
const Block = require('./models/Block');
const Message = require('./models/Message');
const MatchPreference = require('./models/MatchPreference');
const Match = require('./models/Match');
const Story = require('./models/Story');
const Call = require('./models/Call');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.user._id);

  // Join user's personal room
  socket.join(socket.user._id.toString());

  // Handle online status
  User.findByIdAndUpdate(socket.user._id, { isOnline: true })
    .then(() => {
      socket.broadcast.emit('userStatus', {
        userId: socket.user._id,
        isOnline: true
      });
    });

  // Handle typing status
  socket.on('typing', ({ receiverId, isTyping }) => {
    socket.to(receiverId).emit('typing', {
      userId: socket.user._id,
      isTyping
    });
  });

  // Handle stop typing
  socket.on('stopTyping', ({ receiverId }) => {
    socket.to(receiverId).emit('typing', {
      userId: socket.user._id,
      isTyping: false
    });
  });

  // Handle new message
  socket.on('message', async (data) => {
    const { receiverId, content, type, mediaUrl } = data;
    
    try {
      // Check if either user has blocked the other
      const isBlocked = await Block.isBlocked(socket.user._id, receiverId);
      if (isBlocked) {
        return socket.emit('error', { message: 'Cannot send message to blocked user' });
      }

      const message = await Message.create({
        sender: socket.user._id,
        receiver: receiverId,
        content,
        type,
        mediaUrl
      });

      io.to(receiverId).emit('message', message);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle read receipts
  socket.on('read', async ({ senderId }) => {
    try {
      await Message.updateMany(
        { sender: senderId, receiver: socket.user._id, status: 'sent' },
        { status: 'read', readAt: new Date() }
      );

      io.to(senderId).emit('read', { userId: socket.user._id });
    } catch (error) {
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Handle user status
  socket.on('status', (status) => {
    io.emit('userStatus', {
      userId: socket.user._id,
      status
    });
  });

  // Handle location updates
  socket.on('location', async ({ coordinates }) => {
    try {
      const preferences = await MatchPreference.findOne({ user: socket.user._id });
      if (preferences) {
        preferences.location.coordinates = coordinates;
        preferences.lastActive = new Date();
        await preferences.save();
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Handle match status updates
  socket.on('matchStatus', async ({ matchId, status }) => {
    try {
      const match = await Match.findById(matchId);
      if (!match || !match.users.includes(socket.user._id)) {
        return socket.emit('error', { message: 'Match not found or unauthorized' });
      }

      const updatedMatch = await Match.updateStatus(matchId, status);
      
      // Notify both users about the status change
      match.users.forEach(userId => {
        io.to(userId.toString()).emit('matchStatusUpdate', {
          matchId,
          status,
          updatedAt: updatedMatch.updatedAt
        });
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to update match status' });
    }
  });

  // Handle story view
  socket.on('storyView', async ({ storyId }) => {
    try {
      const story = await Story.addView(storyId, socket.user._id);
      if (story) {
        io.to(story.user.toString()).emit('storyViewed', {
          storyId,
          viewer: socket.user._id
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to record story view' });
    }
  });

  // Handle story like
  socket.on('storyLike', async ({ storyId }) => {
    try {
      const story = await Story.addLike(storyId, socket.user._id);
      if (story) {
        io.to(story.user.toString()).emit('storyLiked', {
          storyId,
          liker: socket.user._id
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to like story' });
    }
  });

  // Handle story comment
  socket.on('storyComment', async ({ storyId, content }) => {
    try {
      const story = await Story.addComment(storyId, socket.user._id, content);
      if (story) {
        io.to(story.user.toString()).emit('storyCommented', {
          storyId,
          commenter: socket.user._id,
          content
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to add comment' });
    }
  });

  // Handle call events
  socket.on('callSignal', async ({ callId, signal }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) {
        return socket.emit('error', { message: 'Call not found' });
      }

      const otherUserId = call.initiator.toString() === socket.user._id.toString()
        ? call.receiver.toString()
        : call.initiator.toString();

      io.to(otherUserId).emit('callSignal', {
        callId,
        signal
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send call signal' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user._id);
    
    User.findByIdAndUpdate(socket.user._id, { isOnline: false })
      .then(() => {
        socket.broadcast.emit('userStatus', {
          userId: socket.user._id,
          isOnline: false
        });
      });
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/blocks', require('./routes/blockRoutes'));
app.use('/api/verification', require('./routes/verificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Bittrr API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 