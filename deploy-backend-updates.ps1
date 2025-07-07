# Deploy Backend Updates to EC2
Write-Host "Deploying backend updates to EC2 instance..." -ForegroundColor Green

# EC2 instance details
$EC2_IP = "13.49.73.45"
$EC2_USER = "ubuntu"
$KEY_PATH = "~/.ssh/bittrr-key.pem"

# Check if we have the key file
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "SSH key not found at $KEY_PATH" -ForegroundColor Red
    Write-Host "Please ensure your SSH key is available for EC2 access" -ForegroundColor Yellow
    exit 1
}

# Create a temporary directory for the server files
$TEMP_DIR = "temp-server-deploy"
if (Test-Path $TEMP_DIR) {
    Remove-Item -Recurse -Force $TEMP_DIR
}
New-Item -ItemType Directory -Name $TEMP_DIR | Out-Null

Write-Host "Copying server files to temporary directory..." -ForegroundColor Yellow
Copy-Item -Recurse "server\*" $TEMP_DIR

# Create deployment script for EC2
$DEPLOY_SCRIPT = @'
#!/bin/bash
echo 'Deploying backend updates...'

# Stop the current server
sudo systemctl stop bittrr-backend || true
pkill -f "node server.js" || true

# Backup current server
sudo cp -r /home/ubuntu/bittrr-server /home/ubuntu/bittrr-server-backup-$(date +%Y%m%d-%H%M%S) || true

# Remove old server directory
sudo rm -rf /home/ubuntu/bittrr-server

# Create new server directory
sudo mkdir -p /home/ubuntu/bittrr-server
sudo chown ubuntu:ubuntu /home/ubuntu/bittrr-server

# Copy new files
sudo cp -r /tmp/server-deploy/* /home/ubuntu/bittrr-server/

# Install dependencies
cd /home/ubuntu/bittrr-server
npm install

# Set proper permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/bittrr-server

# Start the server
sudo systemctl start bittrr-backend

# Check if server started successfully
sleep 5
if systemctl is-active --quiet bittrr-backend; then
    echo 'Backend deployed and started successfully!'
    echo 'Testing database connection...'
    curl -s http://localhost:5000/api/auth/test-db
else
    echo 'Failed to start backend service'
    sudo systemctl status bittrr-backend
fi
'@

$DEPLOY_SCRIPT | Out-File -FilePath "$TEMP_DIR\deploy.sh" -Encoding ASCII

Write-Host "Uploading files to EC2..." -ForegroundColor Yellow

# Upload files to EC2
scp -i $KEY_PATH -r $TEMP_DIR ubuntu@$EC2_IP:/tmp/server-deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "Files uploaded successfully!" -ForegroundColor Green
    
    # Execute deployment script on EC2
    Write-Host "Executing deployment script on EC2..." -ForegroundColor Yellow
    ssh -i $KEY_PATH ubuntu@$EC2_IP "chmod +x /tmp/server-deploy/deploy.sh && /tmp/server-deploy/deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment completed successfully!" -ForegroundColor Green
        
        # Test the endpoints
        Write-Host "Testing database connection..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        $response = Invoke-WebRequest -Uri "http://$EC2_IP:5000/api/auth/test-db" -Method GET -ErrorAction SilentlyContinue
        
        if ($response) {
            Write-Host "Database test response:" -ForegroundColor Green
            $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        } else {
            Write-Host "Could not test database connection" -ForegroundColor Red
        }
    } else {
        Write-Host "Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to upload files to EC2" -ForegroundColor Red
}

# Clean up
Remove-Item -Recurse -Force $TEMP_DIR
Write-Host "Deployment process completed." -ForegroundColor Green 