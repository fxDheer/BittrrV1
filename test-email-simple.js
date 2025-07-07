// Load environment variables from .env file
require('dotenv').config({ path: 'server/.env' });

const nodemailer = require('nodemailer');

// Simple email test function
async function testEmailService() {
  console.log('🧪 Testing email service...');
  
  // Check if environment variables are set
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  console.log('📧 Email configuration:');
  console.log(`  EMAIL_USER: ${emailUser ? '✅ Set' : '❌ Not set'}`);
  console.log(`  EMAIL_PASSWORD: ${emailPassword ? '✅ Set' : '❌ Not set'}`);
  
  if (!emailUser || !emailPassword) {
    console.log('\n❌ Email environment variables not configured!');
    console.log('Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
    console.log('See EMAIL_SETUP.md for detailed instructions.');
    return false;
  }
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });
    
    console.log('\n📤 Testing email connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email connection verified successfully!');
    
    // Test sending a simple email
    const testEmail = 'test@example.com'; // Replace with your test email
    const mailOptions = {
      from: `"Bittrr Test" <${emailUser}>`,
      to: testEmail,
      subject: '🧪 Bittrr Email Test',
      html: `
        <h2>Email Test Successful! 🎉</h2>
        <p>This is a test email from the Bittrr application.</p>
        <p>If you received this email, the email service is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `
    };
    
    console.log(`\n📧 Sending test email to ${testEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. Your Gmail address is correct');
      console.log('2. You\'re using an App Password (not your regular password)');
      console.log('3. 2-Factor Authentication is enabled on your Gmail account');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('1. Your internet connection');
      console.log('2. Gmail SMTP settings');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testEmailService()
    .then(success => {
      if (success) {
        console.log('\n🎉 Email service is working correctly!');
        console.log('You can now deploy this to your server and configure the environment variables.');
      } else {
        console.log('\n⚠️  Email service needs configuration.');
        console.log('Please follow the EMAIL_SETUP.md guide.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailService }; 