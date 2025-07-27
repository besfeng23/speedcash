# 🏠 CPay Local Deployment Guide

## Overview

This guide covers deploying CPay locally for development and testing. Choose the method that best fits your workflow.

## 🎯 Local Deployment Options

### Option 1: **Direct Local Deployment** (Recommended for development)

**Best for:** Active development, quick iterations, debugging

**Requirements:**
- Node.js 20+
- npm or yarn
- Git

**Quick Start:**
```bash
# Run the automated script
deploy-local.bat

# Or manually:
npm install
npm run build
npm start
```

**Pros:**
- ✅ Fastest development cycle
- ✅ Direct access to files
- ✅ Easy debugging
- ✅ Hot reloading
- ✅ No container overhead

**Cons:**
- ❌ Environment differences
- ❌ Dependency conflicts possible

---

### Option 2: **Docker Local Deployment** (Recommended for consistency)

**Best for:** Consistent environments, team development, production-like testing

**Requirements:**
- Docker Desktop
- Docker Compose

**Quick Start:**
```bash
# Using development Dockerfile
docker build -f Dockerfile.local -t cpay-local .
docker run -p 3000:3000 -v ${PWD}:/app cpay-local

# Or using Docker Compose
docker-compose -f docker-compose.local.yml up --build
```

**Pros:**
- ✅ Consistent environment
- ✅ Isolated dependencies
- ✅ Easy cleanup
- ✅ Production-like testing

**Cons:**
- ❌ Slower startup
- ❌ More resource usage
- ❌ Docker knowledge required

---

### Option 3: **Development Server Only**

**Best for:** Quick testing, simple development

**Quick Start:**
```bash
npm install
npm run dev
```

**Access:** http://localhost:3000

---

## 🚀 Step-by-Step Local Deployment

### Method 1: Automated Script (Windows)

1. **Run the deployment script:**
   ```cmd
   deploy-local.bat
   ```

2. **The script will:**
   - Check Node.js installation
   - Install dependencies
   - Create `.env.local` from `env.example`
   - Build the application
   - Start the development server

3. **Access your application:**
   - Open browser: http://localhost:3000
   - Health check: http://localhost:3000/api/health

### Method 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   # Copy environment template
   cp env.example .env.local
   
   # Edit with your local settings
   notepad .env.local
   ```

3. **Build and start:**
   ```bash
   # Development mode (recommended for local)
   npm run dev
   
   # Or production build
   npm run build
   npm start
   ```

### Method 3: Docker Local

1. **Build and run with Docker:**
   ```bash
   # Build the development image
   docker build -f Dockerfile.local -t cpay-local .
   
   # Run the container
   docker run -p 3000:3000 -v ${PWD}:/app cpay-local
   ```

2. **Or use Docker Compose:**
   ```bash
   # Start all services
   docker-compose -f docker-compose.local.yml up --build
   
   # Run in background
   docker-compose -f docker-compose.local.yml up -d --build
   ```

## 🔧 Local Environment Configuration

### Essential Environment Variables

Create `.env.local` with these settings:

```env
# Local Development Environment
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# Firebase Configuration (use your existing config)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API Keys (use test/sandbox keys for local development)
GEMINI_API_KEY=your_gemini_api_key
CHANNEL_AGGREGATOR_MERCHANT_NAME=CPAY
CHANNEL_AGGREGATOR_MERCHANT_NO=your_test_merchant_no
CHANNEL_AGGREGATOR_SHA256_KEY=your_test_sha256_key
CHANNEL_AGGREGATOR_ENDPOINT=https://api.channelaggregator.com

# Local Development Settings
PORT=3000
HOSTNAME=localhost

# Disable telemetry for local development
NEXT_TELEMETRY_DISABLED=1
```

### Optional Local Services

For full local development, you can add these services to `docker-compose.local.yml`:

```yaml
# Database
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: cpay_local
    POSTGRES_USER: cpay_user
    POSTGRES_PASSWORD: cpay_password
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data

# Redis for caching
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"

# Mailhog for email testing
mailhog:
  image: mailhog/mailhog
  ports:
    - "1025:1025"
    - "8025:8025"
```

## 🛠️ Development Tools

### Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript check

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Docker
docker-compose -f docker-compose.local.yml up    # Start local services
docker-compose -f docker-compose.local.yml down  # Stop local services
docker-compose -f docker-compose.local.yml logs  # View logs
```

### Debugging

1. **Browser Developer Tools:**
   - Open browser dev tools (F12)
   - Check Console for errors
   - Monitor Network tab for API calls

2. **Application Logs:**
   ```bash
   # View Next.js logs
   npm run dev
   
   # View Docker logs
   docker-compose -f docker-compose.local.yml logs -f cpay-local
   ```

3. **Health Check:**
   ```bash
   # Test application health
   curl http://localhost:3000/api/health
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   # Find process using port 3000
   netstat -ano | findstr :3000
   
   # Kill the process
   taskkill /PID <process_id> /F
   ```

2. **Node.js version issues:**
   ```bash
   # Check Node.js version
   node --version
   
   # Should be 20.x or higher
   # Install from https://nodejs.org/
   ```

3. **Dependencies issues:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Docker issues:**
   ```bash
   # Rebuild Docker image
   docker-compose -f docker-compose.local.yml down
   docker-compose -f docker-compose.local.yml up --build
   ```

### Performance Optimization

1. **Enable Fast Refresh:**
   - Next.js Fast Refresh is enabled by default in development
   - Changes are reflected immediately

2. **Optimize Build Time:**
   ```bash
   # Use Turbopack for faster builds
   npm run dev -- --turbopack
   ```

3. **Monitor Resources:**
   ```bash
   # Check memory usage
   npm run dev
   # Monitor in Task Manager or Activity Monitor
   ```

## 📊 Local Testing

### Test Your Application

1. **Basic Functionality:**
   - Visit http://localhost:3000
   - Test user registration/login
   - Check admin dashboard
   - Test partner portal

2. **API Endpoints:**
   - Health check: http://localhost:3000/api/health
   - Test all API routes

3. **Integration Testing:**
   - Test Firebase integration
   - Test payment gateway connections
   - Test email functionality

### Local Data

- **Firebase:** Uses your existing Firebase project
- **Local Storage:** Browser local storage
- **Session Storage:** Browser session storage
- **Cookies:** Browser cookies

## 🎯 Next Steps

After successful local deployment:

1. **Configure your environment variables** in `.env.local`
2. **Test all features** thoroughly
3. **Set up your IDE** for development
4. **Configure debugging** tools
5. **Set up version control** if not already done

## 📞 Support

For local deployment issues:

1. Check the console output for error messages
2. Verify Node.js version (20+)
3. Ensure all dependencies are installed
4. Check port availability
5. Review environment configuration

---

**Your CPay application is now running locally! 🎉**

Access it at: http://localhost:3000 