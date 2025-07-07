const axios = require('axios');

async function testImageAccess() {
  const baseUrl = 'http://13.49.73.45:5000';
  
  console.log('Testing image access...');
  
  try {
    // Test the uploads directory access
    const response = await axios.get(`${baseUrl}/uploads/`, {
      timeout: 5000
    });
    console.log('✅ Uploads directory accessible');
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('❌ Uploads directory not accessible');
    console.log('Error:', error.message);
  }
  
  try {
    // Test CORS headers
    const response = await axios.options(`${baseUrl}/uploads/test.jpg`, {
      timeout: 5000
    });
    console.log('✅ CORS headers present');
    console.log('CORS headers:', response.headers);
  } catch (error) {
    console.log('❌ CORS headers test failed');
    console.log('Error:', error.message);
  }
  
  try {
    // Test user discovery endpoint
    const response = await axios.get(`${baseUrl}/api/users/public/discover?limit=5`, {
      timeout: 5000
    });
    console.log('✅ User discovery endpoint working');
    console.log('Users found:', response.data.length);
    
    if (response.data.length > 0) {
      const user = response.data[0];
      console.log('First user photos:', user.photos);
      if (user.photos && user.photos.length > 0) {
        console.log('First photo URL:', user.photos[0].url);
      }
    }
  } catch (error) {
    console.log('❌ User discovery endpoint failed');
    console.log('Error:', error.message);
  }
}

testImageAccess(); 