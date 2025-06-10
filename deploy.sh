#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# Build the application
echo "Building the application..."
docker-compose build

# Push to Docker registry (if using one)
# echo "Pushing to Docker registry..."
# docker push your-registry/bittrr:latest

# Deploy to production server
echo "Deploying to production server..."
ssh $PROD_SERVER "cd /app/bittrr && \
  docker-compose pull && \
  docker-compose up -d && \
  docker system prune -f"

# Run database migrations
echo "Running database migrations..."
ssh $PROD_SERVER "cd /app/bittrr && \
  docker-compose exec app npm run migrate"

# Verify deployment
echo "Verifying deployment..."
curl -f https://api.bittrr.com/health || exit 1

echo "Deployment completed successfully!" 