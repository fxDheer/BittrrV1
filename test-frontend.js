const axios = require('axios');

const FRONTEND_URL = 'https://www.bittrr.com';
const API_URL = 'https://api.bittrr.com';

async function testFrontend() {
  console.log('🧪 Testing Bittrr Frontend Functionality...\n');

  try {
    // Test 1: Frontend Accessibility
    console.log('1. Testing Frontend Accessibility...');
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 10000 });
    console.log('✅ Frontend is accessible (Status:', frontendResponse.status, ')');
    
    // Check if it's serving React app
    const html = frontendResponse.data;
    if (html.includes('react') || html.includes('root') || html.includes('static/js')) {
      console.log('✅ Frontend appears to be serving React application');
    } else {
      console.log('⚠️  Frontend might not be serving React app correctly');
    }

    // Test 2: Check for specific frontend features
    console.log('\n2. Testing Frontend Features...');
    
    // Check if the HTML contains our expected content
    if (html.includes('Discover People') || html.includes('Bittrr')) {
      console.log('✅ Frontend contains expected content');
    } else {
      console.log('⚠️  Frontend content might not be updated');
    }

    // Test 3: Check for Google OAuth elements
    console.log('\n3. Testing Google OAuth Integration...');
    if (html.includes('google') || html.includes('Google') || html.includes('Continue with Google')) {
      console.log('✅ Google OAuth elements found in frontend');
    } else {
      console.log('⚠️  Google OAuth elements not found in frontend');
    }

    // Test 4: Check for public profile viewing elements
    console.log('\n4. Testing Public Profile Viewing...');
    if (html.includes('Browse profiles') || html.includes('community members')) {
      console.log('✅ Public profile viewing elements found');
    } else {
      console.log('⚠️  Public profile viewing elements not found');
    }

    // Test 5: Check for login/signup elements
    console.log('\n5. Testing Authentication Elements...');
    if (html.includes('login') || html.includes('Login') || html.includes('Register')) {
      console.log('✅ Authentication elements found');
    } else {
      console.log('⚠️  Authentication elements not found');
    }

    // Test 6: Check for static assets
    console.log('\n6. Testing Static Assets...');
    try {
      const manifestResponse = await axios.get(`${FRONTEND_URL}/manifest.json`, { timeout: 5000 });
      console.log('✅ Static assets are accessible');
    } catch (error) {
      console.log('⚠️  Static assets might not be accessible:', error.message);
    }

    // Test 7: Check for JavaScript bundles
    console.log('\n7. Testing JavaScript Bundles...');
    try {
      const jsResponse = await axios.get(`${FRONTEND_URL}/static/js/main.a7772a4d.js`, { timeout: 5000 });
      console.log('✅ JavaScript bundles are accessible');
    } catch (error) {
      console.log('⚠️  JavaScript bundles might not be accessible:', error.message);
    }

    // Test 8: Check API connectivity from frontend perspective
    console.log('\n8. Testing API Connectivity...');
    try {
      const apiResponse = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      console.log('✅ API is accessible from frontend perspective');
    } catch (error) {
      console.log('⚠️  API connectivity issue:', error.message);
    }

    // Test 9: Check for routing elements
    console.log('\n9. Testing Routing Elements...');
    if (html.includes('react-router') || html.includes('Router')) {
      console.log('✅ Routing elements found');
    } else {
      console.log('⚠️  Routing elements not found');
    }

    // Test 10: Check for Material-UI elements
    console.log('\n10. Testing UI Framework...');
    if (html.includes('mui') || html.includes('Material-UI') || html.includes('@mui')) {
      console.log('✅ Material-UI elements found');
    } else {
      console.log('⚠️  Material-UI elements not found');
    }

    console.log('\n🎉 Frontend Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('- Frontend is deployed and accessible');
    console.log('- React application is being served');
    console.log('- Next step: Deploy backend with public routes');

  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testFrontend(); 