const AWS = require('aws-sdk');

// Configure AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  region: process.env.AWS_SES_REGION || 'us-east-1',
});

const SENDER_EMAIL = process.env.AWS_SES_SENDER_EMAIL || process.env.EMAIL_USER;

// Welcome email template
const createWelcomeEmailTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Bittrr!</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5em;
                font-weight: bold;
                color: #e91e63;
                margin-bottom: 10px;
            }
            .welcome-text {
                font-size: 1.2em;
                color: #666;
            }
            .content {
                margin-bottom: 30px;
            }
            .feature {
                background-color: #f8f9fa;
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
                border-left: 4px solid #e91e63;
            }
            .feature h3 {
                margin: 0 0 10px 0;
                color: #e91e63;
            }
            .cta-button {
                display: inline-block;
                background-color: #e91e63;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 0.9em;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-links a {
                color: #e91e63;
                text-decoration: none;
                margin: 0 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">💕 Bittrr</div>
                <div class="welcome-text">Welcome to the community!</div>
            </div>
            
            <div class="content">
                <h2>Hi ${userName}! 👋</h2>
                
                <p>Welcome to Bittrr! We're thrilled to have you join our community of people looking for meaningful connections.</p>
                
                <p>You've just taken the first step towards finding your perfect match. Here's what you can do next:</p>
                
                <div class="feature">
                    <h3>🎯 Complete Your Profile</h3>
                    <p>Add your photos, bio, and interests to help others get to know the real you.</p>
                </div>
                
                <div class="feature">
                    <h3>🔍 Start Discovering</h3>
                    <p>Browse through profiles and find people who share your interests and values.</p>
                </div>
                
                <div class="feature">
                    <h3>💬 Connect & Chat</h3>
                    <p>When you find someone you like, start a conversation and see where it leads!</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://www.bittrr.com" class="cta-button">Start Your Journey</a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Why choose Bittrr?</strong></p>
                <p>We focus on creating genuine connections through shared interests and meaningful conversations.</p>
                
                <div class="social-links">
                    <a href="#">Privacy Policy</a> | 
                    <a href="#">Terms of Service</a> | 
                    <a href="#">Support</a>
                </div>
                
                <p>© 2024 Bittrr. All rights reserved.</p>
                <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  const params = {
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Subject: {
        Data: 'Welcome to Bittrr! 💕 Start Your Journey to Finding Love',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: createWelcomeEmailTemplate(userName),
          Charset: 'UTF-8',
        },
      },
    },
  };
  try {
    const result = await ses.sendEmail(params).promise();
    console.log('Welcome email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send profile completion reminder
const sendProfileReminderEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Bittrr Team" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Complete Your Bittrr Profile - Get More Matches! 🎯',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Complete Your Profile</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: #e91e63;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #e91e63;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">💕 Bittrr</div>
                </div>
                
                <h2>Hi ${userName}! 👋</h2>
                
                <p>We noticed you haven't completed your profile yet. Did you know that users with complete profiles get <strong>3x more matches</strong>?</p>
                
                <p>Take a few minutes to add:</p>
                <ul>
                    <li>📸 Your best photos</li>
                    <li>📝 A compelling bio</li>
                    <li>🎯 Your interests and hobbies</li>
                    <li>📍 Your location</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="https://www.bittrr.com/create-profile" class="cta-button">Complete Your Profile</a>
                </div>
                
                <p>Your perfect match might be waiting for you! 💕</p>
                
                <p>Best regards,<br>The Bittrr Team</p>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Profile reminder email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending profile reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send match notification email
const sendMatchEmail = async (userEmail, userName, matchedUserName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Bittrr Team" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🎉 It\'s a Match! You and ' + matchedUserName + ' liked each other!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>It's a Match!</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                .match-icon {
                    font-size: 4em;
                    margin: 20px 0;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #e91e63;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="match-icon">💕</div>
                <h1>It's a Match!</h1>
                <h2>You and ${matchedUserName} liked each other!</h2>
                
                <p>This could be the beginning of something special! 💕</p>
                
                <p>Don't wait too long - start a conversation and see where it leads!</p>
                
                <div style="text-align: center;">
                    <a href="https://www.bittrr.com/messages" class="cta-button">Send a Message</a>
                </div>
                
                <p>Good luck! 🍀</p>
                
                <p>Best regards,<br>The Bittrr Team</p>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Match email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending match email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendProfileReminderEmail,
  sendMatchEmail
}; 