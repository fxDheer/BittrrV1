const axios = require('axios');

const API_BASE = 'https://api.bittrr.com/api';

async function testEndpoints() {
  console.log('Testing Bittrr Backend Endpoints...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE.replace('/api', '')}/`);
    console.log('✅ Health check:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.response?.data || error.message);
  }

  try {
    // Test auth validate endpoint
    console.log('\n2. Testing /auth/validate (without token)...');
    const authResponse = await axios.get(`${API_BASE}/auth/validate`);
    console.log('✅ Auth validate response:', authResponse.data);
  } catch (error) {
    console.log('❌ Auth validate failed (expected without token):', error.response?.status, error.response?.data?.message || error.message);
  }

  try {
    // Test matches endpoint
    console.log('\n3. Testing /matches (without token)...');
    const matchesResponse = await axios.get(`${API_BASE}/matches`);
    console.log('✅ Matches response:', matchesResponse.data);
  } catch (error) {
    console.log('❌ Matches failed (expected without token):', error.response?.status, error.response?.data?.message || error.message);
  }

  try {
    // Test matches potential endpoint
    console.log('\n4. Testing /matches/potential (without token)...');
    const potentialResponse = await axios.get(`${API_BASE}/matches/potential`);
    console.log('✅ Matches potential response:', potentialResponse.data);
  } catch (error) {
    console.log('❌ Matches potential failed (expected without token):', error.response?.status, error.response?.data?.message || error.message);
  }

  try {
    // Test public users endpoint
    console.log('\n5. Testing /public/users...');
    const publicUsersResponse = await axios.get(`${API_BASE}/public/users`);
    console.log('✅ Public users response:', publicUsersResponse.data);
  } catch (error) {
    console.log('❌ Public users failed:', error.response?.status, error.response?.data?.message || error.message);
  }

  console.log('\n🎉 Backend endpoint testing completed!');
  console.log('\nIf you see 401 errors for auth endpoints, that means the routes exist and are working correctly.');
  console.log('If you see 404 errors, the routes are missing or not deployed.');
}

testEndpoints().catch(console.error); 