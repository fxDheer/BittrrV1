# Deploy Backend Fixes to EC2
# This script uses EC2 Instance Connect to deploy the fixes

Write-Host "🚀 Deploying Backend Fixes to EC2..." -ForegroundColor Green

# Configuration
$INSTANCE_ID = "i-0c1234567890abcdef"  # Replace with your actual instance ID
$REGION = "us-east-1"  # Replace with your actual region
$KEY_NAME = "bittrr-key"  # Replace with your actual key name

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Instance ID: $INSTANCE_ID"
Write-Host "  Region: $REGION"
Write-Host "  Key Name: $KEY_NAME"

# Step 1: Create a temporary directory for the fixes
Write-Host "`n📁 Creating temporary directory for fixes..." -ForegroundColor Yellow
$TEMP_DIR = "temp-backend-fixes"
if (Test-Path $TEMP_DIR) {
    Remove-Item -Recurse -Force $TEMP_DIR
}
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

# Step 2: Copy the fixed files to temp directory
Write-Host "📋 Copying fixed files..." -ForegroundColor Yellow
Copy-Item "server/routes/authRoutes.js" "$TEMP_DIR/authRoutes.js"
Copy-Item "server/models/MatchPreference.js" "$TEMP_DIR/MatchPreference.js"

# Step 3: Create deployment script
Write-Host "📝 Creating deployment script..." -ForegroundColor Yellow
$DEPLOY_SCRIPT = @"
#!/bin/bash
echo "🚀 Starting backend deployment..."

# Navigate to server directory
cd /home/ubuntu/bittrr/server

# Backup current files
echo "📦 Backing up current files..."
cp routes/authRoutes.js routes/authRoutes.js.backup
cp models/MatchPreference.js models/MatchPreference.js.backup

# Stop the server
echo "⏹️  Stopping server..."
pm2 stop server

# Update the files
echo "📝 Updating files..."
cp /tmp/authRoutes.js routes/authRoutes.js
cp /tmp/MatchPreference.js models/MatchPreference.js

# Restart the server
echo "▶️  Starting server..."
pm2 start server

# Check server status
echo "🔍 Checking server status..."
pm2 status

# Test the endpoints
echo "🧪 Testing endpoints..."
sleep 5

echo "Testing /api/auth/debug..."
curl -s https://api.bittrr.com/api/auth/debug | jq .

echo "Testing /api/matches/potential..."
curl -s -H "Authorization: Bearer test" https://api.bittrr.com/api/matches/potential | jq .

echo "✅ Deployment complete!"
"@

$DEPLOY_SCRIPT | Out-File -FilePath "$TEMP_DIR/deploy.sh" -Encoding UTF8

# Step 4: Create EC2 Instance Connect script
Write-Host "🔗 Creating EC2 Instance Connect script..." -ForegroundColor Yellow
$CONNECT_SCRIPT = @"
#!/bin/bash
echo "🔗 Connecting to EC2 instance..."

# Install jq if not present
sudo apt-get update
sudo apt-get install -y jq

# Copy files to instance
echo "📁 Copying files to instance..."
aws s3 cp s3://bittrr-deployment/temp-backend-fixes/ /tmp/ --recursive --region $REGION

# Make deploy script executable
chmod +x /tmp/deploy.sh

# Run deployment
/tmp/deploy.sh

echo "✅ Deployment script completed!"
"@

$CONNECT_SCRIPT | Out-File -FilePath "$TEMP_DIR/connect.sh" -Encoding UTF8

# Step 5: Upload files to S3 (if you have S3 bucket)
Write-Host "☁️  Uploading files to S3..." -ForegroundColor Yellow
try {
    aws s3 cp "$TEMP_DIR" s3://bittrr-deployment/temp-backend-fixes/ --recursive --region $REGION
    Write-Host "✅ Files uploaded to S3" -ForegroundColor Green
} catch {
    Write-Host "⚠️  S3 upload failed, will use direct copy method" -ForegroundColor Yellow
}

# Step 6: Connect to EC2 and deploy
Write-Host "`n🔗 Connecting to EC2 instance..." -ForegroundColor Yellow
Write-Host "You will need to manually connect to your EC2 instance and run the following commands:" -ForegroundColor Cyan

Write-Host "`n📋 Manual Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Go to AWS Console → EC2 → Instances → Select your instance → Connect → EC2 Instance Connect" -ForegroundColor White
Write-Host "2. Run these commands in the terminal:" -ForegroundColor White

Write-Host "`n🔧 Commands to run on EC2:" -ForegroundColor Green
Write-Host "cd /home/ubuntu/bittrr/server" -ForegroundColor Cyan
Write-Host "sudo pm2 stop server" -ForegroundColor Cyan
Write-Host "sudo cp routes/authRoutes.js routes/authRoutes.js.backup" -ForegroundColor Cyan
Write-Host "sudo cp models/MatchPreference.js models/MatchPreference.js.backup" -ForegroundColor Cyan

Write-Host "`n📝 Now copy and paste the contents of these files:" -ForegroundColor Yellow
Write-Host "1. Copy the contents of server/routes/authRoutes.js" -ForegroundColor White
Write-Host "2. Copy the contents of server/models/MatchPreference.js" -ForegroundColor White

Write-Host "`n▶️  Then restart the server:" -ForegroundColor Yellow
Write-Host "sudo pm2 start server" -ForegroundColor Cyan
Write-Host "sudo pm2 status" -ForegroundColor Cyan

Write-Host "`n🧪 Test the endpoints:" -ForegroundColor Yellow
Write-Host "curl https://api.bittrr.com/api/auth/debug" -ForegroundColor Cyan
Write-Host "curl -H 'Authorization: Bearer test' https://api.bittrr.com/api/matches/potential" -ForegroundColor Cyan

# Cleanup
Write-Host "`n🧹 Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TEMP_DIR

Write-Host "`n✅ Deployment script ready!" -ForegroundColor Green
Write-Host "Follow the manual steps above to deploy the fixes to your EC2 instance." -ForegroundColor Cyan 