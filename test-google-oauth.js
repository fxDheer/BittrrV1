const axios = require('axios');

// Test Google OAuth flow
async function testGoogleOAuth() {
  console.log('🔍 Testing Google OAuth Flow...\n');

  try {
    // Test 1: Check if Google OAuth endpoint is accessible
    console.log('1. Testing Google OAuth endpoint accessibility...');
    try {
      const response = await axios.get('https://api.bittrr.com/auth/google', {
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept redirects
        }
      });
      console.log('✅ Google OAuth endpoint is accessible');
      console.log('   Status:', response.status);
      console.log('   Redirect URL:', response.headers.location || 'No redirect');
    } catch (error) {
      if (error.response && error.response.status === 302) {
        console.log('✅ Google OAuth endpoint is accessible (redirecting to Google)');
        console.log('   Redirect URL:', error.response.headers.location);
      } else {
        console.log('❌ Google OAuth endpoint error:', error.message);
      }
    }

    // Test 2: Check if callback endpoint exists
    console.log('\n2. Testing callback endpoint...');
    try {
      const response = await axios.get('https://api.bittrr.com/auth/google/callback', {
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });
      console.log('✅ Callback endpoint is accessible');
    } catch (error) {
      if (error.response && error.response.status === 302) {
        console.log('✅ Callback endpoint is accessible (redirecting)');
      } else {
        console.log('❌ Callback endpoint error:', error.message);
      }
    }

    // Test 3: Check if token validation endpoint works
    console.log('\n3. Testing token validation endpoint...');
    try {
      const response = await axios.get('https://api.bittrr.com/auth/validate', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Token validation should reject invalid tokens');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Token validation endpoint correctly rejects invalid tokens');
      } else {
        console.log('❌ Token validation endpoint error:', error.message);
      }
    }

    // Test 4: Check server health
    console.log('\n4. Testing server health...');
    try {
      const response = await axios.get('https://api.bittrr.com/health');
      console.log('✅ Server is healthy');
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }

    // Test 5: Check database connection
    console.log('\n5. Testing database connection...');
    try {
      const response = await axios.get('https://api.bittrr.com/test-db');
      console.log('✅ Database connection test');
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('❌ Database connection test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n📋 Google OAuth Flow Summary:');
  console.log('1. User clicks "Continue with Google" → Redirects to: https://api.bittrr.com/auth/google');
  console.log('2. Google OAuth redirects to: https://api.bittrr.com/auth/google/callback');
  console.log('3. Server processes OAuth and redirects to: https://www.bittrr.com/auth-success?token=...&user=...');
  console.log('4. Frontend processes token and user data');
  console.log('5. User is redirected to profile creation or home page');
}

// Run the test
testGoogleOAuth(); 