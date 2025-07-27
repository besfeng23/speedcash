#!/bin/bash

# CPay Server Deployment Script
# This script automates the deployment of CPay to a traditional server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="cpay"
APP_DIR="/var/www/cpay"
LOG_DIR="/var/log/cpay"
BACKUP_DIR="/backups/cpay"
DOMAIN="${1:-yourdomain.com}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    apt update && apt upgrade -y
    print_success "System updated successfully"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install Node.js 20
    if ! command -v node &> /dev/null; then
        print_status "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        npm install -g pm2
    fi
    
    # Install Nginx
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        apt install nginx -y
    fi
    
    # Install Certbot
    if ! command -v certbot &> /dev/null; then
        print_status "Installing Certbot..."
        apt install certbot python3-certbot-nginx -y
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to create directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    
    print_success "Directories created successfully"
}

# Function to backup existing installation
backup_existing() {
    if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
        print_status "Creating backup of existing installation..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        tar -czf "$BACKUP_DIR/cpay_backup_$TIMESTAMP.tar.gz" -C "$APP_DIR" .
        print_success "Backup created: cpay_backup_$TIMESTAMP.tar.gz"
    fi
}

# Function to deploy application
deploy_application() {
    print_status "Deploying CPay application..."
    
    # Navigate to app directory
    cd "$APP_DIR"
    
    # Install dependencies
    print_status "Installing npm dependencies..."
    npm install --production
    
    # Build application
    print_status "Building application..."
    npm run build
    
    print_success "Application deployed successfully"
}

# Function to setup PM2
setup_pm2() {
    print_status "Setting up PM2..."
    
    cd "$APP_DIR"
    
    # Start application with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    print_success "PM2 configured successfully"
}

# Function to setup Nginx
setup_nginx() {
    print_status "Setting up Nginx..."
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/cpay << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /_next/static {
        alias $APP_DIR/.next/static;
        expires 365d;
        access_log off;
    }

    # Public files
    location /public {
        alias $APP_DIR/public;
        expires 30d;
        access_log off;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/cpay /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    print_success "Nginx configured successfully"
}

# Function to setup SSL
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Get SSL certificate
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN
    
    print_success "SSL certificate configured successfully"
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    # Allow SSH, HTTP, HTTPS
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    
    # Enable firewall
    ufw --force enable
    
    print_success "Firewall configured successfully"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create log rotation
    cat > /etc/logrotate.d/cpay << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    print_success "Monitoring configured successfully"
}

# Function to display deployment summary
display_summary() {
    print_success "CPay deployment completed successfully!"
    echo
    echo "=== Deployment Summary ==="
    echo "Application URL: https://$DOMAIN"
    echo "Application Directory: $APP_DIR"
    echo "Log Directory: $LOG_DIR"
    echo "Backup Directory: $BACKUP_DIR"
    echo
    echo "=== Useful Commands ==="
    echo "View logs: pm2 logs cpay"
    echo "Restart app: pm2 restart cpay"
    echo "Stop app: pm2 stop cpay"
    echo "Nginx status: systemctl status nginx"
    echo "SSL renewal: certbot renew"
    echo
    echo "=== Next Steps ==="
    echo "1. Update your DNS to point $DOMAIN to this server"
    echo "2. Configure your environment variables in $APP_DIR/.env.local"
    echo "3. Test the application at https://$DOMAIN"
    echo "4. Set up automated backups"
    echo "5. Configure monitoring and alerting"
}

# Main deployment function
main() {
    echo "🚀 CPay Server Deployment Script"
    echo "================================"
    echo
    
    # Check if domain is provided
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
        print_error "Please provide a domain name as an argument"
        echo "Usage: $0 yourdomain.com"
        exit 1
    fi
    
    # Check if running as root
    check_root
    
    # Run deployment steps
    update_system
    install_dependencies
    create_directories
    backup_existing
    deploy_application
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    setup_monitoring
    
    # Display summary
    display_summary
}

# Run main function
main "$@" 