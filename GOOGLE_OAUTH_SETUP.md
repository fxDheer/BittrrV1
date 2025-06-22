# Google OAuth Setup Guide for Bittrr

This guide will help you set up Google OAuth authentication for your Bittrr application.

## Prerequisites

1. Google Cloud Console account
2. Access to your EC2 server
3. Your Google Client ID and Client Secret

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen
6. Set the authorized redirect URI to: `https://api.bittrr.com/auth/google/callback`
7. Copy your Client ID and Client Secret

## Step 2: Server Setup

### Connect to your EC2 server:
```bash
ssh -i "your-key.pem" ec2-user@your-ec2-ip
```

### Navigate to your project directory:
```bash
cd /home/ec2-user/BittrrV1/server
```

### Install required packages:
```bash
npm install passport passport-google-oauth20 express-session
```

### Update your .env file:
```bash
# Add these lines to your .env file
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
```

### Restart your server:
```bash
# If using PM2
pm2 restart all

# Or if running directly
node server.js
```

## Step 3: Frontend Deployment

### Build the frontend:
```bash
cd /home/ec2-user/BittrrV1/client
npm run build
```

### Deploy to S3:
```bash
aws s3 sync build/ s3://your-s3-bucket-name --delete
```

### Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Step 4: Testing

1. Visit your website: `https://www.bittrr.com`
2. Click "Login" or "Register"
3. Click "Continue with Google"
4. Complete the Google OAuth flow
5. You should be redirected back to your site and logged in

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**
   - Make sure the redirect URI in Google Cloud Console exactly matches: `https://api.bittrr.com/auth/google/callback`

2. **"Client ID not found" error**
   - Verify your GOOGLE_CLIENT_ID is correctly set in the .env file
   - Restart the server after updating .env

3. **CORS errors**
   - Ensure your CORS settings in server.js include the correct origins

4. **Session errors**
   - Check that express-session is properly configured
   - Verify JWT_SECRET is set in your .env file

### Debugging:

Check server logs:
```bash
pm2 logs
```

Check if packages are installed:
```bash
npm list passport passport-google-oauth20 express-session
```

## Security Notes

1. Never commit your Google Client Secret to version control
2. Keep your .env file secure and backed up
3. Regularly rotate your secrets
4. Monitor your Google Cloud Console for any suspicious activity

## Next Steps

Once Google OAuth is working, you can:

1. Add Facebook OAuth (similar process)
2. Implement additional security measures
3. Add user profile completion flow for OAuth users
4. Set up email verification for OAuth accounts

## Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all required packages are installed
4. Test the OAuth flow in an incognito browser window 