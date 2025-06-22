const axios = require('axios');

const API_BASE = 'https://api.bittrr.com';
const FRONTEND_BASE = 'https://www.bittrr.com';

async function testEndpoints() {
  console.log('🧪 Testing Bittrr Deployment...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Database Connection
    console.log('\n2. Testing Database Connection...');
    const dbResponse = await axios.get(`${API_BASE}/test-db`);
    console.log('✅ Database status:', dbResponse.data);

    // Test 3: Public Discover Endpoint
    console.log('\n3. Testing Public Discover Endpoint...');
    const discoverResponse = await axios.get(`${API_BASE}/api/users/public/discover`);
    console.log('✅ Public discover endpoint working');
    console.log(`   Found ${discoverResponse.data.length} users`);

    // Test 4: Google OAuth Endpoint
    console.log('\n4. Testing Google OAuth Endpoint...');
    try {
      const oauthResponse = await axios.get(`${API_BASE}/api/auth/google`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302 // Expect redirect
      });
      console.log('❌ Unexpected response from Google OAuth');
    } catch (error) {
      if (error.response && error.response.status === 302) {
        console.log('✅ Google OAuth endpoint redirecting properly');
        console.log('   Redirect URL:', error.response.headers.location);
      } else {
        console.log('❌ Google OAuth endpoint error:', error.message);
      }
    }

    // Test 5: Frontend Accessibility
    console.log('\n5. Testing Frontend Accessibility...');
    try {
      const frontendResponse = await axios.get(FRONTEND_BASE, {
        timeout: 10000
      });
      console.log('✅ Frontend is accessible');
    } catch (error) {
      console.log('❌ Frontend accessibility issue:', error.message);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests
testEndpoints(); 