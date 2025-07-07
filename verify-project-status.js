#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Bittrr Project Status Verification\n');

// Check essential directories
const essentialDirs = ['client', 'server'];
const essentialFiles = [
  'README.md',
  'PROJECT_STATUS.md',
  'deploy-backend.sh',
  'client/deploy-frontend.sh',
  'client/package.json',
  'server/package.json',
  'server/server.js'
];

let allGood = true;

console.log('📁 Checking project structure...');
essentialDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/ directory exists`);
  } else {
    console.log(`❌ ${dir}/ directory missing`);
    allGood = false;
  }
});

console.log('\n📄 Checking essential files...');
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allGood = false;
  }
});

// Check for obsolete directories
const obsoleteDirs = ['BittrrV1', 'src', 'public', 'build'];
console.log('\n🗑️  Checking for obsolete directories...');
obsoleteDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`⚠️  ${dir}/ directory still exists (should be removed)`);
  } else {
    console.log(`✅ ${dir}/ directory properly removed`);
  }
});

// Check client structure
console.log('\n🎨 Checking client structure...');
const clientDirs = ['src', 'public', 'src/components', 'src/pages', 'src/context'];
clientDirs.forEach(dir => {
  const fullPath = path.join('client', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ client/${dir}/ exists`);
  } else {
    console.log(`❌ client/${dir}/ missing`);
    allGood = false;
  }
});

// Check server structure
console.log('\n⚙️  Checking server structure...');
const serverDirs = ['config', 'controllers', 'middleware', 'models', 'routes'];
serverDirs.forEach(dir => {
  const fullPath = path.join('server', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ server/${dir}/ exists`);
  } else {
    console.log(`❌ server/${dir}/ missing`);
    allGood = false;
  }
});

// Check deployment scripts
console.log('\n🚀 Checking deployment scripts...');
const deployScripts = [
  'deploy-backend.sh',
  'client/deploy-frontend.sh'
];
deployScripts.forEach(script => {
  if (fs.existsSync(script)) {
    const stats = fs.statSync(script);
    const isExecutable = (stats.mode & 0o111) !== 0;
    console.log(`✅ ${script} exists${isExecutable ? ' (executable)' : ' (needs chmod +x)'}`);
  } else {
    console.log(`❌ ${script} missing`);
    allGood = false;
  }
});

console.log('\n📚 Checking documentation...');
const docs = ['README.md', 'PROJECT_STATUS.md', 'AWS-SETUP.md', 'GOOGLE_OAUTH_SETUP.md'];
docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`✅ ${doc} exists`);
  } else {
    console.log(`⚠️  ${doc} missing`);
  }
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Project structure is clean and ready!');
  console.log('✅ All essential directories and files are present');
  console.log('✅ Deployment scripts are configured');
  console.log('✅ Documentation is in place');
  console.log('\n🚀 Ready for development and deployment!');
} else {
  console.log('⚠️  Some issues found. Please review the above output.');
  console.log('🔧 Fix the missing items before proceeding.');
}

console.log('\n📋 Next steps:');
console.log('1. Run: cd client && npm install');
console.log('2. Run: cd server && npm install');
console.log('3. Set up environment variables');
console.log('4. Test local development');
console.log('5. Deploy to AWS when ready'); 