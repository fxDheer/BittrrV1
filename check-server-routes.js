const axios = require('axios');

const API_URL = 'https://api.bittrr.com';

async function checkServerRoutes() {
  console.log('🔍 Checking Server Routes...\n');

  const routesToTest = [
    '/',
    '/health',
    '/test-db',
    '/api/users',
    '/api/auth',
    '/api/auth/google',
    '/api/public/users',
    '/api/public/users/1',
    '/api/messages',
    '/api/matches'
  ];

  for (const route of routesToTest) {
    try {
      const response = await axios.get(`${API_URL}${route}`, { 
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.status === 302) {
        console.log(`✅ ${route}: ${response.status} - Redirect (${response.headers.location})`);
      } else {
        console.log(`✅ ${route}: ${response.status} - ${response.statusText}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${route}: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`❌ ${route}: ${error.message}`);
      }
    }
  }

  console.log('\n📋 Analysis:');
  console.log('- If /api/public/users returns 404, the new routes are not deployed');
  console.log('- If /api/auth/google returns 404, OAuth is not set up');
  console.log('- You need to redeploy the updated server.js file');
}

checkServerRoutes(); 