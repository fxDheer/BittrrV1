# Backend Deployment Guide

## What's Been Updated

✅ **Added Public Routes** - Users can now view profiles without login
✅ **Google OAuth Support** - Added passport dependencies and routes
✅ **Updated Environment Variables** - Added Google OAuth credentials

## New Public Routes

- `GET /api/public/users` - List public user profiles
- `GET /api/public/users/:userId` - Get specific public user profile
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

## Required Environment Variables

Make sure these are set in your Render deployment:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://www.bittrr.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Deployment Steps

1. **Commit and push your changes** to your repository
2. **Redeploy on Render** - The service should automatically redeploy
3. **Set environment variables** in Render dashboard if not already set
4. **Test the endpoints** after deployment

## Testing the Deployment

After deployment, test these endpoints:

```bash
# Test health check
curl https://api.bittrr.com/health

# Test public users endpoint
curl https://api.bittrr.com/api/public/users

# Test Google OAuth (should redirect)
curl https://api.bittrr.com/api/auth/google
```

## Frontend Integration

The frontend is already configured to use these endpoints:
- Public profile viewing works without authentication
- Google OAuth button will redirect to `/api/auth/google`
- After OAuth, users will be redirected back to frontend with token

## Next Steps

1. Deploy the backend with these changes
2. Test the Google OAuth flow
3. Test public profile viewing
4. Verify messaging requires login 