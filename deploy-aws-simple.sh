#!/bin/bash

# Simplified AWS Deployment Script for Bittrr

echo "🚀 Starting Bittrr AWS Deployment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Build the frontend
echo -e "${YELLOW}Step 1: Building frontend...${NC}"
cd client
npm install
npm run build
cd ..

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed!${NC}"

# Step 2: Deploy frontend to S3
echo -e "${YELLOW}Step 2: Deploying frontend to S3...${NC}"
aws s3 sync client/build/ s3://bittrr-frontend --delete

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ S3 deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend deployed to S3!${NC}"

# Step 3: Invalidate CloudFront cache
echo -e "${YELLOW}Step 3: Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id E2SN7SX0HJARJI --paths "/*"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ CloudFront invalidation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CloudFront cache invalidated!${NC}"

# Step 4: Deploy backend (if we have EC2 access)
echo -e "${YELLOW}Step 4: Backend deployment...${NC}"
echo -e "${YELLOW}Note: Backend appears to be running on a different service.${NC}"
echo -e "${YELLOW}You may need to deploy backend changes manually or through your deployment platform.${NC}"

echo -e "${GREEN}🎉 Frontend deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your app should be available at: https://www.bittrr.com${NC}"
echo -e "${YELLOW}⚠️  Backend deployment may require manual intervention${NC}" 