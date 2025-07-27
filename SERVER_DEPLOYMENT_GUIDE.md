# 🚀 CPay Server Deployment Guide

## Overview

This guide covers deploying the CPay application to various server environments. The application is built with Next.js and can be deployed to traditional servers, Docker containers, or cloud platforms.

## 🎯 Deployment Options

### Option 1: Traditional Server Deployment (Recommended)

#### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- PM2 (for process management)
- Nginx (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

#### Step 2: Application Setup

```bash
# Clone the repository
git clone <your-repo-url> /var/www/cpay
cd /var/www/cpay

# Install dependencies
npm install

# Build the application
npm run build

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your production values
nano .env.local
```

#### Step 3: Environment Configuration

Create `.env.local` with production values:

```env
# Production Environment
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production

# Firebase Configuration (keep your existing Firebase config)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API Keys (update with production values)
GEMINI_API_KEY=your_production_gemini_key
CHANNEL_AGGREGATOR_MERCHANT_NAME=CPAY
CHANNEL_AGGREGATOR_MERCHANT_NO=your_merchant_no
CHANNEL_AGGREGATOR_SHA256_KEY=your_sha256_key
CHANNEL_AGGREGATOR_ENDPOINT=https://api.channelaggregator.com

# Security
JWT_SECRET=your_secure_jwt_secret
ENCRYPTION_KEY=your_secure_encryption_key
WEBHOOK_SECRET=your_webhook_secret

# Email Configuration
MAILCHIMP_API_KEY=your_mailchimp_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=CPay
```

#### Step 4: PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'cpay',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/cpay',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/cpay/err.log',
      out_file: '/var/log/cpay/out.log',
      log_file: '/var/log/cpay/combined.log',
      time: true
    }
  ]
};
```

#### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/cpay`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /_next/static {
        alias /var/www/cpay/.next/static;
        expires 365d;
        access_log off;
    }

    # Public files
    location /public {
        alias /var/www/cpay/public;
        expires 30d;
        access_log off;
    }
}
```

#### Step 6: Start the Application

```bash
# Create log directory
sudo mkdir -p /var/log/cpay

# Start with PM2
cd /var/www/cpay
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/cpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
# Use Node.js 20 Alpine
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  cpay:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_ENVIRONMENT=production
    env_file:
      - .env.local
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - cpay-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - cpay
    restart: unless-stopped
    networks:
      - cpay-network

networks:
  cpay-network:
    driver: bridge
```

#### Step 3: Deploy with Docker

```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f cpay

# Stop containers
docker-compose down
```

### Option 3: Cloud Platform Deployment

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

#### Netlify Deployment

```bash
# Build the application
npm run build

# Deploy to Netlify (using Netlify CLI)
netlify deploy --prod --dir=.next
```

## 🔧 Production Optimizations

### 1. Performance Optimization

```javascript
// next.config.ts
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### 2. Monitoring Setup

```javascript
// utils/monitoring.ts
import { monitor } from '@vercel/analytics';

export const setupMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    monitor();
  }
};
```

### 3. Error Tracking

```javascript
// utils/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## 🔒 Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Environment variables secured
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## 📊 Monitoring and Maintenance

### Health Check Endpoint

```javascript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
}
```

### Automated Backups

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/cpay"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/cpay_$DATE.tar.gz /var/www/cpay

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "cpay_*.tar.gz" -mtime +7 -delete
```

## 🚀 Deployment Commands Summary

### Traditional Server
```bash
# Initial setup
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# Application deployment
cd /var/www/cpay
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# SSL setup
sudo certbot --nginx -d yourdomain.com
```

### Docker
```bash
# Build and deploy
docker-compose up -d --build

# Update deployment
git pull
docker-compose down
docker-compose up -d --build
```

### Cloud Platforms
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

## 📞 Support

For deployment issues:
1. Check application logs: `pm2 logs cpay`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed
5. Check firewall and security group settings

---

**Your CPay application is now ready for production deployment! 🎉** 