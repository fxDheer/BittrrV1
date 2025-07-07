@echo off
echo Deploying Bittrr Backend to EC2...
echo.

REM Update this with your current EC2 public IP/DNS
set EC2_HOST=ec2-52-90-23-248.compute-1.amazonaws.com
set PEM_PATH=C:\Users\lived\Downloads\bittrrkey.pem

echo Testing SSH connection...
ssh -i "%PEM_PATH%" -o ConnectTimeout=10 ec2-user@%EC2_HOST% "echo SSH connection successful"
if %errorlevel% neq 0 (
    echo ERROR: SSH connection failed. Please check:
    echo 1. EC2 instance is running
    echo 2. Security Group allows SSH (port 22)
    echo 3. Public IP/DNS is correct
    pause
    exit /b 1
)

echo.
echo Copying server files...
scp -i "%PEM_PATH%" -r server/* ec2-user@%EC2_HOST%:/home/ec2-user/bittrr/server/

echo.
echo Installing dependencies and restarting server...
ssh -i "%PEM_PATH%" ec2-user@%EC2_HOST% "cd /home/ec2-user/bittrr/server && npm install && pm2 restart server"

echo.
echo Deployment complete! Test your API at:
echo https://api.bittrr.com/api/users/public/discover
pause 