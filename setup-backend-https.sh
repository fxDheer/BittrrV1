#!/bin/bash
set -e

# Update and install Nginx
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Certbot for SSL
sudo wget -r --no-parent -A 'epel-release-*.rpm' http://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/
sudo rpm -Uvh dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/epel-release-*.rpm
sudo yum-config-manager --enable epel
sudo yum install -y certbot python2-certbot-nginx

# Create Nginx config for the backend
sudo bash -c 'cat > /etc/nginx/conf.d/bittrr-backend.conf' << EOF
server {
    listen 80;
    server_name ec2-52-90-23-248.compute-1.amazonaws.com;

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

# Restart Nginx to apply new config
sudo systemctl restart nginx

echo "Nginx setup complete. Ready for Certbot." 