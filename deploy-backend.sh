#!/bin/bash

# === CONFIGURATION ===
EC2_USER=ec2-user
EC2_HOST=ec2-52-90-23-248.compute-1.amazonaws.com
REMOTE_DIR=/home/ec2-user/bittrr/server
PEM_PATH="/c/Users/lived/Downloads/bittrrkey.pem"

# === SAFETY CHECKS ===
if [ ! -d "server" ]; then
  echo "❌ 'server' directory not found. Please run this script from the project root."
  exit 1
fi

# === TEST SSH CONNECTION ===
echo "🔑 Testing SSH key: $PEM_PATH"
ssh -i "$PEM_PATH" -o BatchMode=yes -o ConnectTimeout=5 $EC2_USER@$EC2_HOST "echo 'SSH key works!'" 2>/dev/null
if [ $? -ne 0 ]; then
  echo "❌ SSH key or connection failed. Please check your .pem file and network."
  exit 1
fi

echo "✅ SSH key works. Proceeding with deployment."

# === BACKUP REMOTE SERVER DIRECTORY ===
echo "📦 Backing up remote server directory..."
ssh -i "$PEM_PATH" $EC2_USER@$EC2_HOST "cp -r $REMOTE_DIR $REMOTE_DIR.backup_$(date +%Y%m%d%H%M%S)"

# === DEPLOY ENTIRE SERVER DIRECTORY ===
echo "⬆️  Deploying entire server/ directory (excluding node_modules, .env, and backups)..."
if command -v rsync &> /dev/null; then
  rsync -avz --exclude 'node_modules' --exclude '.env' --exclude '*.backup*' -e "ssh -i $PEM_PATH" server/ $EC2_USER@$EC2_HOST:$REMOTE_DIR/
else
  echo "⚠️  rsync not found, falling back to scp (may be slower)"
  scp -i "$PEM_PATH" -r server/* $EC2_USER@$EC2_HOST:$REMOTE_DIR/
fi

# === RESTART SERVER ===
echo "🔄 Restarting PM2 server..."
ssh -i "$PEM_PATH" $EC2_USER@$EC2_HOST "cd $REMOTE_DIR && pm2 restart server && pm2 status"

echo "✅ Deployment complete! Test your endpoints and proceed with CloudFront invalidation if needed." 