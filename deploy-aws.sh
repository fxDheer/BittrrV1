#!/bin/bash

# AWS Deployment Script for Bittrr

# Load environment variables
source .env

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting AWS deployment...${NC}"

# Build frontend
echo "Building frontend..."
cd client
npm install
npm run build
cd ..

# Deploy frontend to S3
echo "Deploying frontend to S3..."
aws s3 sync client/build/ s3://bittrr-frontend --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

# --- Backend Deployment ---
echo "Deploying backend to EC2..."

# 1. Copy updated backend code
scp -r -i ~/bittrr-key.pem server/* ec2-user@$EC2_HOST:/home/ec2-user/bittrr/

# 2. Copy the new setup script
scp -i ~/bittrr-key.pem setup-backend-https.sh ec2-user@$EC2_HOST:/home/ec2-user/

# 3. Run the setup script
ssh -i ~/bittrr-key.pem ec2-user@$EC2_HOST "chmod +x /home/ec2-user/setup-backend-https.sh && /home/ec2-user/setup-backend-https.sh"

# 4. Install backend dependencies and restart app
ssh -i ~/bittrr-key.pem ec2-user@$EC2_HOST "cd /home/ec2-user/bittrr && npm install && pm2 restart all"


echo -e "${GREEN}Deployment phase 1 completed successfully!${NC}"
echo -e "${GREEN}Next, run Certbot on the server to enable HTTPS.${NC}" 