# Email Setup Guide for Bittrr

This guide will help you configure email functionality for the Bittrr dating application, including welcome emails, profile reminders, and match notifications.

## Overview

The email system uses Nodemailer with Gmail SMTP to send:
- **Welcome emails** to new users who sign up via Google OAuth
- **Profile completion reminders** to encourage users to complete their profiles
- **Match notifications** when two users like each other

## Prerequisites

1. A Gmail account
2. 2-Factor Authentication enabled on your Gmail account
3. An App Password generated for the application

## Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

## Step 2: Generate an App Password

1. In your Google Account settings, go to "Security"
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Enter "Bittrr" as the name
5. Click "Generate"
6. Copy the 16-character password (you'll only see it once!)

## Step 3: Configure Environment Variables

Add these environment variables to your server configuration:

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

### For AWS EC2 (Production)

1. SSH into your EC2 instance
2. Edit your environment file:
   ```bash
   sudo nano /etc/environment
   ```
3. Add the email variables:
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```
4. Save and exit (Ctrl+X, Y, Enter)
5. Reload the environment:
   ```bash
   source /etc/environment
   ```
6. Restart your application:
   ```bash
   pm2 restart bittrr-server
   ```

### For Local Development

Create a `.env` file in your server directory:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

## Step 4: Install Dependencies

The email functionality requires Nodemailer. Install it on your server:

```bash
cd /path/to/your/server
npm install nodemailer@^6.9.8
```

## Step 5: Test Email Configuration

Run the email test script to verify everything is working:

```bash
node test-email-functionality.js
```

This will test:
- Server health
- Email configuration status
- Welcome email sending
- Profile reminder email sending
- Match notification email sending

## Email Templates

The system includes three beautiful HTML email templates:

### 1. Welcome Email
- Sent to new users after Google OAuth signup
- Includes app branding and next steps
- Encourages profile completion

### 2. Profile Reminder Email
- Sent to users with incomplete profiles
- Highlights benefits of complete profiles
- Includes direct link to profile completion

### 3. Match Notification Email
- Sent when two users like each other
- Celebratory design with match icon
- Encourages starting a conversation

## Email Features

### Automatic Welcome Emails
- Sent automatically when new users sign up via Google OAuth
- Non-blocking (doesn't slow down the signup process)
- Includes error handling and logging

### Manual Email Testing
Use the API endpoints to test email functionality:

```bash
# Test welcome email
curl -X POST https://api.bittrr.com/api/email/test-welcome \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Check email configuration status
curl -X GET https://api.bittrr.com/api/email/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Email Configuration Status
Check if email is properly configured:
```bash
GET /api/email/status
```

Response:
```json
{
  "success": true,
  "emailConfigured": true,
  "emailUser": "Configured",
  "message": "Email service is properly configured"
}
```

## Troubleshooting

### Common Issues

1. **"Invalid login" error**
   - Ensure you're using an App Password, not your regular Gmail password
   - Verify 2-Factor Authentication is enabled

2. **"Less secure app access" error**
   - Gmail no longer supports less secure apps
   - You must use an App Password

3. **Environment variables not loading**
   - Restart your application after setting environment variables
   - Check that variables are set correctly: `echo $EMAIL_USER`

4. **Emails not sending**
   - Check server logs for error messages
   - Verify Gmail account has sending permissions
   - Ensure App Password is correct

### Debugging

Enable detailed logging by checking server console output:
```bash
pm2 logs bittrr-server
```

Look for email-related log messages:
- "Welcome email sent successfully"
- "Failed to send welcome email"
- "Error sending welcome email"

## Security Considerations

1. **App Passwords**: Use app-specific passwords, never your main Gmail password
2. **Environment Variables**: Store credentials securely, never in code
3. **Rate Limiting**: Consider implementing rate limiting for email endpoints
4. **Email Validation**: Validate email addresses before sending

## Alternative Email Services

If you prefer not to use Gmail, you can modify the email service to use:

### SendGrid
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### AWS SES
```javascript
const transporter = nodemailer.createTransporter({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASSWORD
  }
});
```

## Monitoring

Monitor email delivery rates and failures:
- Check Gmail's "Sent" folder for delivery confirmations
- Monitor server logs for email errors
- Consider implementing email analytics tracking

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Gmail account settings
3. Test with the provided test script
4. Check server logs for detailed error messages

## Next Steps

Once email is configured:
1. Test the welcome email flow with a new user signup
2. Consider implementing email preferences in user settings
3. Add email unsubscribe functionality
4. Implement email analytics tracking 