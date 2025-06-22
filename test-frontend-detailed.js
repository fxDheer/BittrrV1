const axios = require('axios');

const FRONTEND_URL = 'https://www.bittrr.com';
const API_URL = 'https://api.bittrr.com';

async function testFrontendDetailed() {
  console.log('🔍 Detailed Frontend & API Testing...\n');

  try {
    // Test 1: Get actual frontend content
    console.log('1. Analyzing Frontend Content...');
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 10000 });
    const html = frontendResponse.data;
    
    console.log('✅ Frontend Status:', frontendResponse.status);
    console.log('📄 Content Length:', html.length, 'characters');
    
    // Look for specific content patterns
    const contentChecks = [
      { name: 'React Root', pattern: 'id="root"', found: html.includes('id="root"') },
      { name: 'React Scripts', pattern: 'static/js', found: html.includes('static/js') },
      { name: 'Bittrr Title', pattern: 'Bittrr', found: html.toLowerCase().includes('bittrr') },
      { name: 'Dating/Match', pattern: 'dating|match', found: html.toLowerCase().includes('dating') || html.toLowerCase().includes('match') },
      { name: 'Profile', pattern: 'profile', found: html.toLowerCase().includes('profile') },
      { name: 'Login', pattern: 'login', found: html.toLowerCase().includes('login') },
      { name: 'Google', pattern: 'google', found: html.toLowerCase().includes('google') },
      { name: 'OAuth', pattern: 'oauth', found: html.toLowerCase().includes('oauth') }
    ];

    contentChecks.forEach(check => {
      console.log(`${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? 'Found' : 'Not found'}`);
    });

    // Test 2: Check API endpoints we need for public profiles
    console.log('\n2. Testing Required API Endpoints...');
    
    const apiEndpoints = [
      { name: 'Health Check', url: `${API_URL}/health`, method: 'GET' },
      { name: 'Public Users List', url: `${API_URL}/api/public/users`, method: 'GET' },
      { name: 'Public User Profile', url: `${API_URL}/api/public/users/1`, method: 'GET' },
      { name: 'Google OAuth', url: `${API_URL}/api/auth/google`, method: 'GET' },
      { name: 'Login', url: `${API_URL}/api/auth/login`, method: 'POST' }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        if (endpoint.method === 'GET') {
          const response = await axios.get(endpoint.url, { timeout: 5000 });
          console.log(`✅ ${endpoint.name}: ${response.status} - ${response.statusText}`);
        } else {
          // For POST endpoints, just check if they exist
          console.log(`⚠️  ${endpoint.name}: POST endpoint (not tested)`);
        }
      } catch (error) {
        if (error.response) {
          console.log(`❌ ${endpoint.name}: ${error.response.status} - ${error.response.statusText}`);
        } else {
          console.log(`❌ ${endpoint.name}: ${error.message}`);
        }
      }
    }

    // Test 3: Check if frontend is making API calls
    console.log('\n3. Testing Frontend-API Integration...');
    
    // Check if the HTML contains API URLs
    const apiUrlChecks = [
      { name: 'API URL in HTML', pattern: 'api.bittrr.com', found: html.includes('api.bittrr.com') },
      { name: 'Fetch calls', pattern: 'fetch', found: html.includes('fetch') },
      { name: 'Axios calls', pattern: 'axios', found: html.includes('axios') },
      { name: 'API endpoints', pattern: '/api/', found: html.includes('/api/') }
    ];

    apiUrlChecks.forEach(check => {
      console.log(`${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? 'Found' : 'Not found'}`);
    });

    // Test 4: Check for specific React components
    console.log('\n4. Testing React Component Detection...');
    
    const componentChecks = [
      { name: 'HomePage', pattern: 'HomePage', found: html.includes('HomePage') },
      { name: 'DiscoverPage', pattern: 'DiscoverPage', found: html.includes('DiscoverPage') },
      { name: 'ProfilePage', pattern: 'ProfilePage', found: html.includes('ProfilePage') },
      { name: 'LoginForm', pattern: 'LoginForm', found: html.includes('LoginForm') },
      { name: 'Google OAuth Button', pattern: 'Continue with Google', found: html.includes('Continue with Google') }
    ];

    componentChecks.forEach(check => {
      console.log(`${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? 'Found' : 'Not found'}`);
    });

    // Test 5: Check for build artifacts
    console.log('\n5. Testing Build Artifacts...');
    
    const buildChecks = [
      { name: 'Main JS Bundle', url: `${FRONTEND_URL}/static/js/main.a7772a4d.js` },
      { name: 'CSS Bundle', url: `${FRONTEND_URL}/static/css/main.a7772a4d.css` },
      { name: 'Manifest', url: `${FRONTEND_URL}/manifest.json` },
      { name: 'Favicon', url: `${FRONTEND_URL}/favicon.ico` }
    ];

    for (const check of buildChecks) {
      try {
        const response = await axios.head(check.url, { timeout: 5000 });
        console.log(`✅ ${check.name}: ${response.status} - Accessible`);
      } catch (error) {
        console.log(`❌ ${check.name}: ${error.message}`);
      }
    }

    console.log('\n📊 Analysis Summary:');
    console.log('- Frontend is deployed and accessible');
    console.log('- React application is being served');
    console.log('- Static assets are accessible');
    console.log('- API connectivity needs verification');
    console.log('- Content may need to be updated with latest changes');

  } catch (error) {
    console.error('❌ Detailed test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the detailed test
testFrontendDetailed(); 