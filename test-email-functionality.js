const axios = require('axios');

const API_BASE_URL = 'https://api.bittrr.com';
const TEST_EMAIL = 'test@example.com'; // Replace with your test email
const TEST_NAME = 'Test User';

// Test email configuration status
async function testEmailStatus() {
  console.log('🔍 Testing email configuration status...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/email/status`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`
      }
    });
    
    console.log('✅ Email status response:', response.data);
    return response.data.emailConfigured;
  } catch (error) {
    console.error('❌ Error testing email status:', error.response?.data || error.message);
    return false;
  }
}

// Test welcome email
async function testWelcomeEmail() {
  console.log('\n📧 Testing welcome email...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/email/test-welcome`, {
      email: TEST_EMAIL,
      name: TEST_NAME
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Welcome email test response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ Error testing welcome email:', error.response?.data || error.message);
    return false;
  }
}

// Test profile reminder email
async function testProfileReminderEmail() {
  console.log('\n📧 Testing profile reminder email...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/email/profile-reminder`, {
      email: TEST_EMAIL,
      name: TEST_NAME
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Profile reminder email test response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ Error testing profile reminder email:', error.response?.data || error.message);
    return false;
  }
}

// Test match notification email
async function testMatchEmail() {
  console.log('\n📧 Testing match notification email...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/email/match-notification`, {
      email: TEST_EMAIL,
      userName: TEST_NAME,
      matchedUserName: 'Matched User'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Match notification email test response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ Error testing match notification email:', error.response?.data || error.message);
    return false;
  }
}

// Test server health
async function testServerHealth() {
  console.log('🏥 Testing server health...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server health:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

// Main test function
async function runEmailTests() {
  console.log('🚀 Starting email functionality tests...\n');
  
  const results = {
    serverHealth: await testServerHealth(),
    emailStatus: await testEmailStatus(),
    welcomeEmail: await testWelcomeEmail(),
    profileReminder: await testProfileReminderEmail(),
    matchEmail: await testMatchEmail()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Server Health: ${results.serverHealth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Email Configuration: ${results.emailStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Welcome Email: ${results.welcomeEmail ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Profile Reminder: ${results.profileReminder ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Match Notification: ${results.matchEmail ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\nOverall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
  
  if (!results.emailStatus) {
    console.log('\n💡 To configure email functionality:');
    console.log('1. Set EMAIL_USER environment variable (your Gmail address)');
    console.log('2. Set EMAIL_PASSWORD environment variable (Gmail app password)');
    console.log('3. Enable 2-factor authentication on your Gmail account');
    console.log('4. Generate an app password in Gmail settings');
  }
  
  return allPassed;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runEmailTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runEmailTests }; 