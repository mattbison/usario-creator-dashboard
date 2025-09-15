# Deployment Guide - Usario Creators

This guide provides step-by-step instructions for deploying the Usario Creators application to various hosting platforms and environments.

## 🎯 Deployment Overview

The Usario Creators application is a React-based single-page application (SPA) that can be deployed as static files to any web server or hosting platform. The application uses local storage for data persistence in the MVP version, making it simple to deploy without backend infrastructure.

## 🚀 Quick Deployment Options

### 1. Netlify (Recommended for Beginners)

Netlify offers the simplest deployment process with automatic builds and deployments.

**Step 1: Prepare Your Repository**
```bash
# Ensure your code is in a Git repository
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Step 2: Deploy via Netlify Dashboard**
1. Visit [netlify.com](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Connect your Git provider (GitHub, GitLab, Bitbucket)
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

**Step 3: Configure Custom Domain (Optional)**
1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS settings as instructed

**Environment Variables (if needed):**
```
VITE_APP_TITLE=Usario Creators
VITE_API_URL=https://your-api-domain.com
```

### 2. Vercel (Great for React Apps)

Vercel provides excellent React support with zero-configuration deployments.

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name: usario-creators
# - Directory: ./
# - Override settings? No
```

**Step 3: Production Deployment**
```bash
vercel --prod
```

### 3. GitHub Pages (Free Option)

Deploy directly from your GitHub repository.

**Step 1: Install gh-pages**
```bash
npm install --save-dev gh-pages
```

**Step 2: Update package.json**
```json
{
  "homepage": "https://yourusername.github.io/usario-creators",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**Step 3: Deploy**
```bash
npm run deploy
```

## 🖥️ Server Deployment

### VPS/Dedicated Server Setup

For more control over your deployment environment.

**Step 1: Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

**Step 2: Application Setup**
```bash
# Clone your repository
git clone https://github.com/yourusername/usario-creators.git
cd usario-creators

# Install dependencies
npm install

# Build the application
npm run build
```

**Step 3: Nginx Configuration**
```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/usario-creators
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /path/to/usario-creators/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Optimize static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

**Step 4: Enable Site**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/usario-creators /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

**Step 5: SSL Certificate (Recommended)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 🐳 Docker Deployment

Containerize your application for consistent deployments.

**Step 1: Create Dockerfile**
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Step 2: Create nginx.conf**
```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Step 3: Build and Run**
```bash
# Build the image
docker build -t usario-creators .

# Run the container
docker run -d -p 80:80 --name usario-creators-app usario-creators
```

**Step 4: Docker Compose (Optional)**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

```bash
docker-compose up -d
```

## ☁️ Cloud Platform Deployment

### AWS S3 + CloudFront

Deploy as a static website with global CDN.

**Step 1: Build Application**
```bash
npm run build
```

**Step 2: Create S3 Bucket**
```bash
# Install AWS CLI
aws configure

# Create bucket
aws s3 mb s3://usario-creators-app

# Upload files
aws s3 sync dist/ s3://usario-creators-app --delete

# Configure bucket for static hosting
aws s3 website s3://usario-creators-app --index-document index.html --error-document index.html
```

**Step 3: CloudFront Distribution**
1. Go to AWS CloudFront console
2. Create new distribution
3. Set origin to your S3 bucket
4. Configure custom error pages (404 → /index.html)
5. Set up custom domain and SSL certificate

### Google Cloud Platform

Deploy using Google Cloud Storage and CDN.

**Step 1: Setup**
```bash
# Install gcloud CLI
gcloud init

# Create bucket
gsutil mb gs://usario-creators-app

# Upload files
gsutil -m rsync -r -d dist/ gs://usario-creators-app

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://usario-creators-app
```

**Step 2: Configure Load Balancer**
1. Go to GCP Console > Network services > Load balancing
2. Create HTTP(S) load balancer
3. Configure backend bucket
4. Set up URL map with default route to bucket

## 🔧 Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

```env
VITE_APP_TITLE=Usario Creators
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://api.usario-creators.com
VITE_ENVIRONMENT=production
VITE_ANALYTICS_ID=your-analytics-id
```

### Build Optimization

**Vite Configuration (vite.config.js)**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          charts: ['recharts']
        }
      }
    }
  }
})
```

## 📊 Monitoring and Analytics

### Performance Monitoring

**Step 1: Add Performance Monitoring**
```javascript
// src/utils/analytics.js
export const trackPageView = (page) => {
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: page,
      page_location: window.location.href
    })
  }
}

export const trackEvent = (action, category, label) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label
    })
  }
}
```

**Step 2: Error Tracking**
```javascript
// src/utils/errorTracking.js
export const logError = (error, errorInfo) => {
  console.error('Application Error:', error, errorInfo)
  
  // Send to error tracking service
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: {
        react: errorInfo
      }
    })
  }
}
```

### Health Checks

Create a health check endpoint:

```javascript
// public/health.json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔒 Security Best Practices

### Content Security Policy

Add to your HTML head:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.usario-creators.com;
">
```

### Security Headers

Configure in your web server:

```nginx
# Nginx security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## 🚨 Troubleshooting

### Common Deployment Issues

**1. Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**2. Routing Issues (404 on refresh)**
- Ensure your server is configured to serve index.html for all routes
- Check nginx/Apache configuration for try_files directive

**3. Environment Variables Not Loading**
- Verify variable names start with VITE_
- Check .env file is in project root
- Ensure variables are available at build time

**4. Performance Issues**
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx vite-bundle-analyzer
```

### Rollback Procedures

**Git-based Rollback**
```bash
# Identify last working commit
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>

# Force push (be careful!)
git push --force-with-lease origin main
```

**Docker Rollback**
```bash
# List previous images
docker images usario-creators

# Run previous version
docker run -d -p 80:80 usario-creators:previous-tag
```

## 📈 Scaling Considerations

### CDN Setup

Configure CDN for better global performance:

1. **CloudFlare**: Easy setup with free tier
2. **AWS CloudFront**: Enterprise-grade CDN
3. **Google Cloud CDN**: Integrated with GCP

### Load Balancing

For high-traffic scenarios:

```nginx
upstream usario_creators {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    location / {
        proxy_pass http://usario_creators;
    }
}
```

## 📞 Support and Maintenance

### Automated Deployments

**GitHub Actions Example**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Build
      run: npm run build
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Backup Strategies

Since the MVP uses local storage, consider:

1. **Data Export Features**: Regular CSV exports
2. **Browser Backup**: Instructions for users
3. **Migration Path**: Plan for database migration

---

This deployment guide covers the most common scenarios for deploying the Usario Creators application. Choose the option that best fits your technical requirements and budget constraints.

