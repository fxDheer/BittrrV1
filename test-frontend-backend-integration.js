const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testBackendEndpoints() {
  console.log('🧪 Testing Bittrr Backend Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Auth Validation (should fail with invalid token)
    console.log('2. Testing Auth Validation (invalid token)...');
    try {
      await axios.get(`${API_BASE_URL}/auth/validate`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Auth validation should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Auth validation correctly rejected invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }
    console.log('');

    // Test 3: User Discovery (public endpoint)
    console.log('3. Testing User Discovery...');
    try {
      const discoveryResponse = await axios.get(`${API_BASE_URL}/users/public/discover`);
      console.log('✅ User discovery working:', discoveryResponse.data);
    } catch (error) {
      console.log('❌ User discovery failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Registration (new user)
    console.log('4. Testing User Registration...');
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data);
      
      // Test 5: Login with new user
      console.log('5. Testing Login with new user...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login successful:', loginResponse.data);
      
      // Test 6: Token validation with real token
      console.log('6. Testing Token Validation (valid token)...');
      const token = loginResponse.data.token;
      const validateResponse = await axios.get(`${API_BASE_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Token validation successful:', validateResponse.data);
      
    } catch (error) {
      console.log('❌ Registration/Login test failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Backend Integration Test Complete!');
    console.log('\nNext Steps:');
    console.log('1. Start the frontend: cd client && npm start');
    console.log('2. Test user registration and login through the UI');
    console.log('3. Verify profile creation and discovery features');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running on port 5000');
      console.log('   Run: cd server && npm start');
    }
  }
}

testBackendEndpoints(); 