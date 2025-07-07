# Simple Backend Deployment to EC2
Write-Host "Deploying backend updates to EC2..." -ForegroundColor Green

# EC2 details
$EC2_IP = "13.49.73.45"
$KEY_PATH = "C:\Users\lived\bittrrkey.pem"

# Create temp directory
$TEMP_DIR = "temp-server-deploy"
if (Test-Path $TEMP_DIR) {
    Remove-Item -Recurse -Force $TEMP_DIR
}
New-Item -ItemType Directory -Name $TEMP_DIR | Out-Null

# Copy server files
Write-Host "Preparing server files..." -ForegroundColor Yellow
Copy-Item -Recurse "server\*" $TEMP_DIR

# Create simple deploy script
$deployScript = @'
#!/bin/bash
echo "Deploying backend updates..."

# Stop current server
sudo systemctl stop bittrr-backend || true
pkill -f "node server.js" || true

# Backup and replace
sudo cp -r /home/ec2-user/bittrr-server /home/ec2-user/bittrr-server-backup-$(date +%Y%m%d-%H%M%S) || true
sudo rm -rf /home/ec2-user/bittrr-server
sudo mkdir -p /home/ec2-user/bittrr-server
sudo chown ec2-user:ec2-user /home/ec2-user/bittrr-server

# Copy new files
sudo cp -r /tmp/server-deploy/* /home/ec2-user/bittrr-server/

# Install dependencies
cd /home/ec2-user/bittrr-server
npm install

# Set permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/bittrr-server

# Start server
sudo systemctl start bittrr-backend

# Test
sleep 5
echo "Testing database connection..."
curl -s http://localhost:5000/api/auth/test-db
echo "Deployment complete!"
'@

$deployScript | Out-File -FilePath "$TEMP_DIR\deploy.sh" -Encoding ASCII

# Upload to EC2
Write-Host "Uploading to EC2..." -ForegroundColor Yellow
scp -i $KEY_PATH -r $TEMP_DIR "ec2-user@${EC2_IP}:/tmp/server-deploy"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Files uploaded! Executing deployment..." -ForegroundColor Green
    ssh -i $KEY_PATH ec2-user@$EC2_IP "chmod +x /tmp/server-deploy/deploy.sh && /tmp/server-deploy/deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment successful!" -ForegroundColor Green
        
        # Test the endpoints
        Write-Host "Testing endpoints..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        $testResponse = Invoke-WebRequest -Uri "http://$EC2_IP:5000/api/auth/test-db" -Method GET -ErrorAction SilentlyContinue
        if ($testResponse) {
            Write-Host "Database test response:" -ForegroundColor Green
            $testResponse.Content
        } else {
            Write-Host "Could not test database connection" -ForegroundColor Red
        }
    } else {
        Write-Host "Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to upload files" -ForegroundColor Red
}

# Cleanup
Remove-Item -Recurse -Force $TEMP_DIR
Write-Host "Deployment process completed." -ForegroundColor Green 