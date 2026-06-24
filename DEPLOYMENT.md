# Deployment Guide

## Production Deployment Options

### Option 1: Traditional VPS/Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or similar Linux server
- Node.js 18+
- MongoDB
- Nginx (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Deploy Backend

```bash
# Create application directory
sudo mkdir -p /var/www/mis-report-extractor
sudo chown $USER:$USER /var/www/mis-report-extractor

# Upload your code (using git or scp)
cd /var/www/mis-report-extractor
git clone <your-repo-url> .

# Install dependencies
cd server
npm install --production

# Build TypeScript
npm run build

# Setup environment variables
nano .env
# Add production values:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/mis_report_extractor
# JWT_SECRET=<strong-random-secret>
# NODE_ENV=production

# Start with PM2
pm2 start dist/server.js --name mis-api
pm2 save
pm2 startup
```

#### Step 3: Deploy Frontend

```bash
# Build frontend
cd /var/www/mis-report-extractor/client
npm install
npm run build

# Move build to web directory
sudo mkdir -p /var/www/html/mis-app
sudo cp -r dist/* /var/www/html/mis-app/
```

#### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/mis-report
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html/mis-app;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mis-report /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

### Option 2: Docker Deployment

#### Create Docker Files

**Backend Dockerfile** (`server/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile** (`client/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: mis-mongodb
    restart: always
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: mis_report_extractor

  backend:
    build: ./server
    container_name: mis-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/mis_report_extractor
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
      - PORT=5000
    depends_on:
      - mongodb
    volumes:
      - ./server/uploads:/app/uploads

  frontend:
    build: ./client
    container_name: mis-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

**Deploy with Docker:**
```bash
# Create .env file
echo "JWT_SECRET=your-secret-key" > .env

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

### Option 3: Cloud Platform Deployment

#### Heroku

**Backend:**
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create mis-report-backend

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix server heroku master

# Or create Procfile in server directory:
# web: node dist/server.js
```

**Frontend (Vercel/Netlify):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel --prod
```

#### AWS (EC2 + S3)

**Backend on EC2:**
- Launch EC2 instance (t2.micro for testing)
- Follow VPS deployment steps above
- Configure security groups (ports 22, 80, 443, 5000)

**Frontend on S3:**
```bash
# Build
cd client
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --acl public-read

# Configure S3 for static website hosting
# Enable CloudFront for CDN
```

---

## Environment Variables for Production

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://username:password@host:27017/database?authSource=admin
JWT_SECRET=<use-strong-random-64-char-string>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://api.your-domain.com/api
```

---

## Security Checklist

- [ ] Use strong JWT_SECRET (64+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set secure MongoDB credentials
- [ ] Enable MongoDB authentication
- [ ] Configure CORS properly
- [ ] Set rate limiting
- [ ] Enable firewall (UFW)
- [ ] Regular security updates
- [ ] Secure file upload validation
- [ ] Add helmet.js for security headers
- [ ] Implement request size limits
- [ ] Add brute force protection
- [ ] Set secure cookie flags
- [ ] Implement CSP headers
- [ ] Regular backups

---

## Monitoring & Maintenance

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
pm2 status
```

### MongoDB Backup
```bash
# Backup
mongodump --db mis_report_extractor --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --db mis_report_extractor /backup/20240115/mis_report_extractor
```

### Log Rotation
```bash
# Install logrotate
sudo apt install logrotate

# Configure
sudo nano /etc/logrotate.d/mis-report
```

Add:
```
/var/log/mis-report/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## Performance Optimization

### Backend
- Enable compression middleware
- Use caching (Redis)
- Optimize database queries
- Use connection pooling
- Enable gzip compression in Nginx

### Frontend
- Enable code splitting
- Lazy load components
- Optimize images
- Use CDN for static assets
- Enable browser caching

### Nginx Optimization
```nginx
# Add to nginx.conf
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Scaling Strategies

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Deploy multiple backend instances
- Use MongoDB replica set
- Implement session store (Redis)

### Vertical Scaling
- Increase server resources
- Optimize database indexes
- Use SSD storage
- Increase MongoDB connection pool

---

## Rollback Strategy

```bash
# PM2 rollback
pm2 restart all --update-env

# Docker rollback
docker-compose down
docker-compose up -d --build

# Git rollback
git checkout <previous-commit>
npm run build
pm2 restart all
```

---

## Health Checks

Add health check endpoint in server:

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

Monitor with:
```bash
curl http://localhost:5000/health
```

---

## Troubleshooting Production Issues

### High Memory Usage
```bash
pm2 monit
# Restart if needed
pm2 restart mis-api
```

### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connections
mongo --eval "db.serverStatus().connections"
```

### Nginx Issues
```bash
# Check config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

---

## Cost Estimation

### Small Scale (< 1000 users)
- VPS: $10-20/month (DigitalOcean, Linode)
- Domain: $10-15/year
- Total: ~$15-25/month

### Medium Scale (1000-10000 users)
- VPS: $40-80/month
- MongoDB Atlas: $57/month (M10)
- CDN: $5-20/month
- Total: ~$100-150/month

### Large Scale (> 10000 users)
- Load balancer: $40/month
- App servers (2x): $160/month
- Database cluster: $200/month
- CDN: $50/month
- Total: ~$450-500/month
