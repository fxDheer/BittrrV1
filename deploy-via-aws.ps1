# Deploy Backend via AWS CLI (without SSH)
Write-Host "Deploying backend updates via AWS CLI..." -ForegroundColor Green

# EC2 details
$EC2_IP = "13.49.73.45"
$INSTANCE_ID = "i-044c0be8934ac6fbd"

# Create temp directory
$TEMP_DIR = "temp-server-deploy"
if (Test-Path $TEMP_DIR) {
    Remove-Item -Recurse -Force $TEMP_DIR
}
New-Item -ItemType Directory -Name $TEMP_DIR | Out-Null

# Copy server files
Write-Host "Preparing server files..." -ForegroundColor Yellow
Copy-Item -Recurse "server\*" $TEMP_DIR

# Create deployment script
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

# Try to use AWS Systems Manager to run commands
Write-Host "Attempting to deploy via AWS Systems Manager..." -ForegroundColor Yellow

# Send command to restart backend
$command = "cd /home/ec2-user/bittrr-server && pkill -f 'node server.js' || true && nohup node server.js > server.log 2>&1 & && echo 'Backend restarted'"

try {
    $result = aws ssm send-command --instance-ids $INSTANCE_ID --document-name "AWS-RunShellScript" --parameters commands="$command" --output json
    Write-Host "Command sent successfully!" -ForegroundColor Green
    Write-Host $result
} catch {
    Write-Host "Failed to send command via SSM: $_" -ForegroundColor Red
}

# Test the backend
Write-Host "Testing backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $testResponse = Invoke-WebRequest -Uri "http://13.49.73.45:5000/api/auth/test-db" -Method GET -ErrorAction SilentlyContinue
    if ($testResponse) {
        Write-Host "Backend is responding!" -ForegroundColor Green
        Write-Host "Response: $($testResponse.Content)" -ForegroundColor Green
    } else {
        Write-Host "Backend is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "Could not test backend: $_" -ForegroundColor Red
}

# Cleanup
Remove-Item -Recurse -Force $TEMP_DIR
Write-Host "Deployment process completed." -ForegroundColor Green 