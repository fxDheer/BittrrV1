@echo off
REM This script securely copies the updated backend files to your EC2 server.

REM --- IMPORTANT ---
REM 1. Make sure this script is saved in your project's root directory (E:\Bittrr).
REM 2. Replace 'YOUR_KEY_FILE_PATH' with the full, correct path to your bittrr-ssh.pem file.
REM    Example: set KEY_FILE="C:\Users\lived\bittrr-key"

set KEY_FILE="C:\Users\lived\bittrr-key.pem"
set REMOTE_USER="ec2-user"
set REMOTE_HOST="13.49.73.45"
set REMOTE_BASE="/home/ec2-user/BittrrV1"

echo "Deploying updated backend files to EC2..."

echo "1. Uploading matchRoutes.js..."
scp -i %KEY_FILE% "server/routes/matchRoutes.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/server/routes/

echo "2. Uploading Match.js model..."
scp -i %KEY_FILE% "server/models/Match.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/server/models/

echo "3. Uploading MatchPreference.js model..."
scp -i %KEY_FILE% "server/models/MatchPreference.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/server/models/

echo "4. Uploading Block.js model..."
scp -i %KEY_FILE% "server/models/Block.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/server/models/

if %errorlevel% equ 0 (
    echo "Files uploaded successfully!"
    echo "Now, connecting to the server to restart the application..."
    ssh -i %KEY_FILE% %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_BASE%/server && pm2 restart server"
    
    if %errorlevel% equ 0 (
        echo "Server restarted successfully!"
        echo "Testing endpoints in 10 seconds..."
        timeout 10
        node test-backend-endpoints.js
    ) else (
        echo "Server restart failed. Please check the server logs."
    )
) else (
    echo "File upload failed. Please check the path to your key file and your internet connection."
)

pause 