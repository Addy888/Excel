# Phase 4 - Enterprise Deployment Guide

## Overview
This guide covers deploying the enterprise-grade MIS Report Extractor on an Ubuntu VPS using Node.js, MySQL, PM2, and Nginx.

## Prerequisites
- Ubuntu Server 20.04 or 22.04 LTS
- Root or sudo access
- Domain name (optional but recommended)
- At least 2GB RAM, 2 CPU cores, 20GB storage

## Step 1: Server Preparation

### Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### Install Required Packages
```bash
sudo apt install -y curl git build-essential
```

## Step 2: Install Node.js

### Install Node.js 18.x LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 3: Install MySQL

### Install MySQL Server
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Configure MySQL
```bash
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE mis_report_extractor;

-- Create user
CREATE USER 'mis_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON mis_report_extractor.* TO 'mis_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### Configure MySQL for production
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
query_cache_type = 1
query_cache_size = 32M
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

## Step 4: Install PM2

```bash
sudo npm install -g pm2
```

## Step 5: Setup Application

### Create Application User
```bash
sudo useradd -m -s /bin/bash misapp
sudo passwd misapp
```

### Clone Repository
```bash
sudo su - misapp
cd ~
git clone <your-repo-url> mis-report-extractor
cd mis-report-extractor
```

### Setup Server
```bash
cd server

# Install dependencies
npm install

# Create production .env file
cp .env.example .env.production
nano .env.production
```

### Configure Environment (.env.production)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://mis_user:your_secure_password@localhost:3306/mis_report_extractor"
JWT_SECRET=your_very_long_and_secure_jwt_secret_here_change_this
UPLOAD_PATH=/home/misapp/mis-report-extractor/uploads
BACKUP_PATH=/home/misapp/mis-report-extractor/backups
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

### Build Application
```bash
npm run build
```

### Run Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

### Seed Database (Optional)
```bash
npm run seed
```

## Step 6: Configure PM2

### Start Application
```bash
pm2 start ecosystem.config.js
```

### Save PM2 Process List
```bash
pm2 save
```

### Setup PM2 Startup Script
```bash
pm2 startup
# Run the command shown in the output
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u misapp --hp /home/misapp
```

### Monitor Application
```bash
pm2 status
pm2 logs mis-report-extractor
pm2 monit
```

## Step 7: Install and Configure Nginx

### Install Nginx
```bash
sudo apt install -y nginx
```

### Create Nginx Configuration
Create `/etc/nginx/sites-available/mis-report-extractor`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=20r/h;

# Upstream backend
upstream mis_backend {
    least_conn;
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Max upload size
    client_max_body_size 100M;
    client_body_timeout 300s;

    # Logging
    access_log /var/log/nginx/mis-access.log;
    error_log /var/log/nginx/mis-error.log;

    # Frontend (React build)
    location / {
        root /home/misapp/mis-report-extractor/client/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://mis_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Auth endpoints (stricter rate limit)
    location /api/auth/ {
        limit_req zone=auth_limit burst=5 nodelay;
        
        proxy_pass http://mis_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Upload endpoints
    location /api/upload/ {
        limit_req zone=upload_limit burst=2 nodelay;
        
        proxy_pass http://mis_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Health check endpoint (no rate limit)
    location /api/health {
        proxy_pass http://mis_backend;
        access_log off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /home/misapp/mis-report-extractor/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/mis-report-extractor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Setup SSL with Let's Encrypt

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal
Certbot automatically sets up renewal. Test it:
```bash
sudo certbot renew --dry-run
```

## Step 9: Setup Frontend

### Build Frontend
```bash
cd /home/misapp/mis-report-extractor/client

# Install dependencies
npm install

# Create production .env
cp .env.example .env.production
nano .env.production
```

### Configure Frontend Environment
```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=MIS Report Extractor
```

### Build for Production
```bash
npm run build
```

## Step 10: Setup Automated Backups

### Create Backup Script
Create `/home/misapp/backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/home/misapp/mis-report-extractor/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_NAME="mis_report_extractor"
DB_USER="mis_user"
DB_PASS="your_secure_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" /home/misapp/mis-report-extractor/uploads

# Delete backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Make Script Executable
```bash
chmod +x /home/misapp/backup.sh
```

### Setup Cron Job
```bash
crontab -e
```

Add:
```cron
# Daily backup at 2 AM
0 2 * * * /home/misapp/backup.sh >> /home/misapp/backup.log 2>&1

# Restart PM2 weekly
0 3 * * 0 pm2 restart all
```

## Step 11: Setup Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to application port
sudo ufw deny 5000/tcp

# Check status
sudo ufw status
```

## Step 12: Monitoring and Logs

### View Application Logs
```bash
# PM2 logs
pm2 logs mis-report-extractor

# Application logs
tail -f /home/misapp/mis-report-extractor/server/logs/combined-$(date +%Y-%m-%d).log
tail -f /home/misapp/mis-report-extractor/server/logs/error-$(date +%Y-%m-%d).log

# Nginx logs
sudo tail -f /var/log/nginx/mis-access.log
sudo tail -f /var/log/nginx/mis-error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Monitor System Resources
```bash
# PM2 monitoring
pm2 monit

# System resources
htop

# Disk usage
df -h

# MySQL status
sudo systemctl status mysql
```

## Step 13: Performance Optimization

### Enable Gzip Compression in Nginx
Add to server block:
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### Optimize MySQL
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 1G  # 70% of available RAM
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections = 200
```

### Setup Log Rotation
Create `/etc/logrotate.d/mis-report-extractor`:
```
/home/misapp/mis-report-extractor/server/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 misapp misapp
    sharedscripts
}
```

## Step 14: Security Hardening

### Disable Password Authentication (Use SSH Keys)
```bash
sudo nano /etc/ssh/sshd_config
```
Set:
```
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### Setup Fail2Ban
```bash
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates
```bash
# Setup unattended upgrades
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Useful PM2 Commands

```bash
# List processes
pm2 list

# Show detailed info
pm2 show mis-report-extractor

# Monitor
pm2 monit

# Restart
pm2 restart mis-report-extractor

# Stop
pm2 stop mis-report-extractor

# Delete
pm2 delete mis-report-extractor

# Reload (zero downtime)
pm2 reload mis-report-extractor

# View logs
pm2 logs mis-report-extractor

# Clear logs
pm2 flush
```

## Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs mis-report-extractor

# Check Node.js process
ps aux | grep node

# Check port
sudo netstat -tulpn | grep 5000
```

### Database connection errors
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u mis_user -p mis_report_extractor

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Nginx errors
```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/mis-error.log

# Restart nginx
sudo systemctl restart nginx
```

## Updating Application

```bash
# As misapp user
cd /home/misapp/mis-report-extractor

# Pull latest code
git pull origin main

# Update server
cd server
npm install
npm run build
npx prisma migrate deploy
npx prisma generate

# Update client
cd ../client
npm install
npm run build

# Restart application
pm2 restart all

# Clear nginx cache if needed
sudo systemctl restart nginx
```

## Health Check Endpoint

The application provides a health check endpoint:
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": 123456789,
    "total": 2147483648
  }
}
```

## Backup and Restore

### Manual Backup
```bash
/home/misapp/backup.sh
```

### Restore from Backup
```bash
# Restore database
gunzip < /path/to/backup.sql.gz | mysql -u mis_user -p mis_report_extractor

# Restore uploads
tar -xzf /path/to/uploads_backup.tar.gz -C /home/misapp/mis-report-extractor/

# Restart application
pm2 restart all
```

## Support

For issues or questions:
1. Check logs
2. Review documentation
3. Check GitHub issues
4. Contact support

## License

MIT License
