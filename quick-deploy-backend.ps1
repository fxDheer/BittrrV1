# Quick Backend Deployment Script
$EC2_USER = "ec2-user"
$EC2_HOST = "ec2-52-90-23-248.compute-1.amazonaws.com"
$PEM_PATH = "C:\Users\lived\Downloads\bittrrkey.pem"
$REMOTE_DIR = "/home/ec2-user/bittrr/server"

Write-Host "🚀 Quick Backend Deployment to EC2..." -ForegroundColor Green

# Test SSH connection
Write-Host "🔑 Testing SSH connection..." -ForegroundColor Yellow
try {
    ssh -i $PEM_PATH -o BatchMode=yes -o ConnectTimeout=5 "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful!'"
    Write-Host "✅ SSH connection works!" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH connection failed. Please check your .pem file." -ForegroundColor Red
    exit 1
}

# Create remote directory if it doesn't exist
Write-Host "📁 Creating remote directory..." -ForegroundColor Yellow
ssh -i $PEM_PATH "$EC2_USER@$EC2_HOST" "mkdir -p $REMOTE_DIR"

# Copy server files
Write-Host "📦 Copying server files..." -ForegroundColor Yellow
scp -i $PEM_PATH -r server/* "$EC2_USER@$EC2_HOST`:$REMOTE_DIR/"

# Install dependencies and restart
Write-Host "🔧 Installing dependencies and restarting server..." -ForegroundColor Yellow
ssh -i $PEM_PATH "$EC2_USER@$EC2_HOST" "cd $REMOTE_DIR; npm install; pm2 restart server; if ($LASTEXITCODE -ne 0) { pm2 start server.js --name server }"

Write-Host "✅ Backend deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your API should be available at: https://api.bittrr.com" -ForegroundColor Cyan 