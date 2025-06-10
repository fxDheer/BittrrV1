#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# Update system
echo "Updating system..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt-get install -y nginx certbot python3-certbot-nginx docker.io docker-compose

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/bittrr << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bittrr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Obtain SSL certificates
echo "Obtaining SSL certificates..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN --non-interactive --agree-tos --email your-email@$DOMAIN

# Set up automatic renewal
echo "Setting up automatic renewal..."
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Create application directory
echo "Setting up application directory..."
sudo mkdir -p /var/www/bittrr
sudo chown -R $USER:$USER /var/www/bittrr

# Copy application files
echo "Copying application files..."
cp -r ./* /var/www/bittrr/

# Set up Docker
echo "Setting up Docker..."
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Build and start the application
echo "Building and starting the application..."
cd /var/www/bittrr
docker-compose up -d --build

echo "Domain setup completed! Your application should be accessible at https://$DOMAIN"
echo "Please check the following:"
echo "1. DNS records are properly configured"
echo "2. SSL certificates are working"
echo "3. Application is running (docker-compose ps)"
echo "4. Nginx is running (systemctl status nginx)" 