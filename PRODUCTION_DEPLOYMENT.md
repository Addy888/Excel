# MIS Report Extractor - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [SSL Configuration](#ssl-configuration)
6. [Environment Configuration](#environment-configuration)
7. [Process Management with PM2](#process-management-with-pm2)
8. [Nginx Configuration](#nginx-configuration)
9. [Backup Strategy](#backup-strategy)
10. [Monitoring](#monitoring)
11. [Security Checklist](#security-checklist)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04/22.04 LTS or Windows Server 2019/2022
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores recommended

### Software Requirements
- Node.js 18+ LTS
- MySQL 8.0+
- Nginx (for reverse proxy)
- PM2 (for process management)
- Git

---

## Server Setup

### 1. Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Windows (PowerShell as Admin)
# Windows Update through Settings
```

### 2. Install Node.js
```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v

# Windows
# Download and install from https://nodejs.org/
```

### 3. Install MySQL
```bash
# Ubuntu
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Windows
# Download and install from https://dev.mysql.com/downloads/mysql/
```

### 4. Install Nginx (Linux only)
```bash
# Ubuntu
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Install PM2
```bash
npm install -g pm2

# Setup PM2 startup
pm2 startup

# Windows: Run as Administrator
npm install -g pm2
npm install pm2-windows-startup -g
pm2-startup install
```

---

## Database Setup

### 1. Create MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE mis_report_extractor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'misuser'@'localhost' IDENTIFIED BY 'your_secure_password_here';

GRANT ALL PRIVILEGES ON mis_report_extractor.* TO 'misuser'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

### 2. Configure MySQL for Production
Edit MySQL configuration:
```bash
# Ubuntu
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add/modify:
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_allowed_packet = 64M

# Restart MySQL
sudo systemctl restart mysql
```

### 3. Test Database Connection
```bash
mysql -u misuser -p mis_report_extractor
```

---

## Application Deployment

### 1. Clone Repository
```bash
# Create application directory
mkdir -p /var/www
cd /var/www

# Clone repository
git clone https://github.com/yourusername/mis-report-extractor.git
cd mis-report-extractor
```

### 2. Setup Backend

```bash
cd server

# Install dependencies
npm ci --production

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Production .env Configuration:**
```env
# Application
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="mysql://misuser:your_password@localhost:3306/mis_report_extractor"

# JWT
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# CORS
CORS_ORIGIN=https://your-domain.com

# File Upload
MAX_FILE_SIZE=10485760

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 3. Run Database Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run seed
```

### 4. Build Backend
```bash
npm run build

# Test build
node dist/server.js
# Press Ctrl+C after verification
```

### 5. Setup Frontend

```bash
cd ../client

# Install dependencies
npm ci

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Production .env Configuration:**
```env
VITE_API_URL=https://your-domain.com/api
```

### 6. Build Frontend
```bash
npm run build

# Build output will be in 'dist' folder
```

### 7. Create Upload Directories
```bash
cd /var/www/mis-report-extractor

# Create required directories
mkdir -p server/uploads
mkdir -p server/reports

# Set permissions (Linux)
chmod 755 server/uploads
chmod 755 server/reports
```

---

## SSL Configuration

### 1. Install Certbot (Linux)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts
# Select redirect HTTP to HTTPS
```

### 3. Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Renewal is automatic via cron
```

---

## Process Management with PM2

### 1. Create PM2 Ecosystem File
```bash
cd /var/www/mis-report-extractor/server

# Create ecosystem.config.js
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'mis-backend',
    script: 'dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
```

### 2. Start Application
```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

### 3. PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs mis-backend

# Restart application
pm2 restart mis-backend

# Stop application
pm2 stop mis-backend

# Monitor
pm2 monit
```

---

## Nginx Configuration

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/mis-report-extractor
```

**Nginx Configuration:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream backend
upstream backend {
    least_conn;
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Root directory (Frontend)
    root /var/www/mis-report-extractor/client/dist;
    index index.html;

    # Client max body size (for file uploads)
    client_max_body_size 20M;

    # API proxy
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate, proxy-revalidate";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

### 2. Enable Configuration
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mis-report-extractor /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Backup Strategy

### 1. Database Backup Script

Create backup script:
```bash
sudo nano /usr/local/bin/backup-mis-db.sh
```

```bash
#!/bin/bash

# Configuration
DB_NAME="mis_report_extractor"
DB_USER="misuser"
DB_PASS="your_password"
BACKUP_DIR="/var/backups/mis-reports"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/mis-report-extractor/server/uploads

# Remove old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-mis-db.sh
```

### 2. Setup Cron Job for Daily Backups
```bash
sudo crontab -e

# Add line (runs daily at 2 AM):
0 2 * * * /usr/local/bin/backup-mis-db.sh >> /var/log/mis-backup.log 2>&1
```

### 3. Restore from Backup
```bash
# Restore database
gunzip < /var/backups/mis-reports/db_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u misuser -p mis_report_extractor

# Restore uploads
tar -xzf /var/backups/mis-reports/uploads_backup_YYYYMMDD_HHMMSS.tar.gz -C /
```

---

## Monitoring

### 1. Setup PM2 Monitoring
```bash
# Install PM2 Plus (optional)
pm2 install pm2-server-monit

# Link to PM2 Plus dashboard
pm2 link <secret_key> <public_key>
```

### 2. Log Rotation
```bash
# Install logrotate configuration
sudo nano /etc/logrotate.d/mis-report-extractor
```

```
/var/www/mis-report-extractor/server/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Application Monitoring Endpoints

**Health Check:**
```bash
curl https://your-domain.com/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "MIS Report Extractor API is running"
}
```

---

## Security Checklist

- [ ] SSL/TLS certificate installed and auto-renewing
- [ ] Strong JWT secret (minimum 32 characters)
- [ ] Database user has minimum required privileges
- [ ] Firewall configured (UFW on Linux)
- [ ] Rate limiting enabled
- [ ] Security headers configured in Nginx
- [ ] File upload size limits configured
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Regular backups configured
- [ ] Log rotation configured
- [ ] Server OS up to date
- [ ] MySQL root account secured
- [ ] SSH key authentication (disable password auth)
- [ ] Fail2ban installed (for intrusion prevention)

### Firewall Configuration (Linux)
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MySQL (only from localhost)
sudo ufw deny 3306/tcp

# Check status
sudo ufw status
```

---

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs mis-backend --lines 100

# Check Node.js version
node -v

# Verify environment variables
cat server/.env

# Test database connection
mysql -u misuser -p mis_report_extractor
```

### High Memory Usage
```bash
# Check PM2 memory usage
pm2 monit

# Restart application
pm2 restart mis-backend

# Check for memory leaks
node --inspect dist/server.js
```

### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check MySQL error log
sudo tail -f /var/log/mysql/error.log

# Test connection
mysql -u misuser -p -h localhost mis_report_extractor
```

### Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### File Upload Failures
```bash
# Check upload directory permissions
ls -la /var/www/mis-report-extractor/server/uploads

# Fix permissions
sudo chown -R $USER:$USER /var/www/mis-report-extractor/server/uploads
chmod 755 /var/www/mis-report-extractor/server/uploads
```

---

## Performance Optimization

### 1. Enable Caching
- Implement Redis for session management
- Use CDN for static assets
- Enable browser caching headers

### 2. Database Optimization
- Add indexes on frequently queried columns
- Regular ANALYZE TABLE maintenance
- Monitor slow query log

### 3. Application Optimization
- Use PM2 cluster mode (already configured)
- Enable compression (gzip in Nginx)
- Optimize bundle sizes

---

## Updating the Application

### 1. Pull Latest Changes
```bash
cd /var/www/mis-report-extractor

# Backup current version
cp -r server server_backup_$(date +%Y%m%d)

# Pull updates
git pull origin main
```

### 2. Update Backend
```bash
cd server

# Install new dependencies
npm ci --production

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart PM2
pm2 restart mis-backend
```

### 3. Update Frontend
```bash
cd ../client

# Install new dependencies
npm ci

# Rebuild
npm run build
```

---

## Support and Maintenance

### Regular Maintenance Tasks
- **Daily**: Check PM2 status and logs
- **Weekly**: Review disk space and logs
- **Monthly**: Update system packages and review security
- **Quarterly**: Review and test backup restoration

### Contact Information
- Technical Support: support@your-domain.com
- Emergency: emergency@your-domain.com

---

## Conclusion

Your MIS Report Extractor is now deployed and ready for production use. Remember to:
1. Monitor application logs regularly
2. Keep backups up to date
3. Update software and security patches
4. Review performance metrics

For additional help, refer to the API documentation and troubleshooting sections.

---

**Deployment Date:** ___________________  
**Deployed By:** ___________________  
**Version:** 1.0.0
