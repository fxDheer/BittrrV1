#!/bin/bash

# Navigate to the server directory
cd /home/ec2-user/BittrrV1/server

# Install required packages for Google OAuth
npm install passport passport-google-oauth20 express-session

# Add Google OAuth environment variables to .env file
echo "GOOGLE_CLIENT_ID=your_google_client_id_here" >> .env
echo "GOOGLE_CLIENT_SECRET=your_google_client_secret_here" >> .env

echo "Google OAuth packages installed and environment variables added to .env"
echo "Please replace 'your_google_client_id_here' and 'your_google_client_secret_here' with your actual Google credentials" 