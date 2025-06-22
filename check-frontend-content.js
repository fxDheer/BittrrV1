const axios = require('axios');

async function checkFrontendContent() {
  console.log('🔍 Checking Actual Frontend Content...\n');

  try {
    const response = await axios.get('https://www.bittrr.com', { timeout: 10000 });
    const html = response.data;
    
    console.log('📄 Full HTML Content:');
    console.log('='.repeat(50));
    console.log(html);
    console.log('='.repeat(50));
    
    console.log('\n📊 Content Analysis:');
    console.log('- Total length:', html.length, 'characters');
    console.log('- Contains React root:', html.includes('id="root"'));
    console.log('- Contains static/js:', html.includes('static/js'));
    console.log('- Contains Bittrr:', html.toLowerCase().includes('bittrr'));
    
    // Check if it's a default React app
    if (html.includes('Welcome to React') || html.includes('react-scripts')) {
      console.log('\n⚠️  This appears to be a default React app!');
      console.log('The frontend needs to be rebuilt and redeployed with our actual Bittrr code.');
    }
    
  } catch (error) {
    console.error('❌ Failed to get frontend content:', error.message);
  }
}

checkFrontendContent(); 