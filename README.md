# Bittrr - Modern Dating Web App

**Project Structure & Workflow (2024 Update)**

- All frontend code is in `client/` (React, for S3/CloudFront deployment)
- All backend code is in `server/` (Node.js/Express, for EC2 deployment)
- No code is used from any other folders (e.g., BittrrV1/ is obsolete)
- All development, commits, and deployments should use only these two folders
- Deployment scripts and documentation reference only `client/` and `server/`

---

Bittrr is a modern dating web application built with React, Node.js, and MongoDB. It features a beautiful UI, real-time chat, and smart matching algorithms.

## Features

- User authentication and profile management
- Smart matching algorithm based on preferences
- Real-time chat with media sharing
- Profile verification system
- Responsive design for all devices
- Modern UI with animations
- Location-based matching
- Admin dashboard

## Tech Stack

### Frontend
- React 18
- Material-UI
- TailwindCSS
- Framer Motion
- React Router
- Axios
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO (for real-time features)
- Multer (for file uploads)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bittrr.git
cd bittrr
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create environment files:

Create `server/.env`:
```
PORT=10000
MONGODB_URI=mongodb://localhost:27017/bittrr
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

4. Start the development servers:

```bash
# Start backend server (from server directory)
npm run dev

# Start frontend server (from client directory)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:10000

## Project Structure

```
bittrr/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # Reusable components
│       ├── context/       # Context providers
│       ├── pages/         # Page components
│       ├── theme/         # Theme configuration
│       └── utils/         # Utility functions
│
└── server/                # Node.js backend
    ├── config/           # Configuration files
    ├── controllers/      # Route controllers
    ├── middleware/       # Custom middleware
    ├── models/          # Mongoose models
    ├── routes/          # API routes
    └── uploads/         # Uploaded files
```

## API Endpoints

### Authentication
- POST /api/users/register - Register new user
- POST /api/users/login - Login user
- GET /api/users/profile - Get user profile
- PATCH /api/users/profile - Update user profile

### Matching
- GET /api/users/discover - Get potential matches
- POST /api/users/like/:userId - Like a user
- GET /api/users/matches - Get user matches

### Messaging
- POST /api/messages/:receiverId - Send message
- GET /api/messages/conversation/:userId - Get conversation
- PATCH /api/messages/read/:senderId - Mark messages as read
- GET /api/messages/unread/count - Get unread message count

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- Framer Motion for animations
- MongoDB for the database
- Express.js for the backend framework 