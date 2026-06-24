# Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code committed to git
- [ ] No console.log statements in production code
- [ ] All TODO/FIXME comments addressed
- [ ] Dead code removed
- [ ] Unused imports removed
- [ ] TypeScript build succeeds without errors
- [ ] ESLint passes with no errors

### 2. Configuration
- [ ] `.env.production` created with production values
- [ ] `JWT_SECRET` changed to secure random string
- [ ] `DATABASE_URL` configured for production MySQL
- [ ] `ALLOWED_ORIGINS` set to production domain(s)
- [ ] `NODE_ENV=production` set
- [ ] `LOG_LEVEL=info` or `warn` for production
- [ ] Upload directory configured
- [ ] Backup directory configured

### 3. Database
- [ ] Production MySQL server installed
- [ ] Database created
- [ ] Database user created with secure password
- [ ] User granted necessary privileges
- [ ] `DATABASE_URL` tested and working
- [ ] Prisma migrations ready
- [ ] Backup strategy planned

### 4. Server Preparation
- [ ] VPS/Server provisioned
- [ ] Ubuntu 20.04/22.04 LTS installed
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Node.js 18.x installed
- [ ] MySQL 8.x installed and secured
- [ ] PM2 installed globally
- [ ] Nginx installed
- [ ] Firewall configured (UFW)
- [ ] SSH keys configured (password auth disabled recommended)

### 5. Security
- [ ] Change all default passwords
- [ ] Update default admin credentials in database
- [ ] Configure firewall (ports 22, 80, 443 only)
- [ ] Setup fail2ban (optional but recommended)
- [ ] Generate strong JWT secret
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] HTTPS redirect configured
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting enabled

### 6. Application Files
- [ ] Code uploaded to server
- [ ] `node_modules` NOT uploaded (will install on server)
- [ ] `.env.production` uploaded separately (secure method)
- [ ] `ecosystem.config.js` configured
- [ ] Upload directory created with correct permissions
- [ ] Backup directory created with correct permissions
- [ ] Logs directory created with correct permissions

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies
```bash
cd /path/to/project/server
npm install --production
```
- [ ] Server dependencies installed
- [ ] No errors during installation

```bash
cd /path/to/project/client
npm install
```
- [ ] Client dependencies installed
- [ ] No errors during installation

### Step 2: Database Setup
```bash
cd /path/to/project/server
npx prisma migrate deploy
npx prisma generate
```
- [ ] Database migrations applied successfully
- [ ] Prisma client generated
- [ ] All tables created in MySQL

### Step 3: Build Application
```bash
# Build server
cd /path/to/project/server
npm run build
```
- [ ] Server build successful
- [ ] `dist` directory created
- [ ] No TypeScript errors

```bash
# Build client
cd /path/to/project/client
npm run build
```
- [ ] Client build successful
- [ ] `dist` directory created
- [ ] Assets optimized

### Step 4: Configure PM2
```bash
cd /path/to/project/server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Run the command shown by pm2 startup
```
- [ ] PM2 started successfully
- [ ] Application running
- [ ] PM2 saved
- [ ] PM2 startup configured
- [ ] Check status: `pm2 status`

### Step 5: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/mis-report-extractor
# Paste nginx configuration
sudo ln -s /etc/nginx/sites-available/mis-report-extractor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
- [ ] Nginx configuration file created
- [ ] Symlink created
- [ ] Nginx configuration test passed
- [ ] Nginx restarted successfully
- [ ] Frontend accessible via HTTP

### Step 6: Setup SSL
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal configured

### Step 7: Setup Backups
```bash
sudo nano /usr/local/bin/mis-backup.sh
# Paste backup script
sudo chmod +x /usr/local/bin/mis-backup.sh
crontab -e
# Add: 0 2 * * * /usr/local/bin/mis-backup.sh
```
- [ ] Backup script created
- [ ] Script has execute permissions
- [ ] Cron job configured
- [ ] Test backup manually
- [ ] Verify backup file created

### Step 8: Configure Logging
```bash
# Create log rotation config
sudo nano /etc/logrotate.d/mis-report-extractor
```
- [ ] Log rotation configured
- [ ] PM2 logs accessible
- [ ] Application logs writing correctly
- [ ] Nginx logs accessible

---

## 🧪 Post-Deployment Testing

### 1. Basic Connectivity
- [ ] Can access website via HTTPS
- [ ] HTTPS redirect working
- [ ] Frontend loads correctly
- [ ] No console errors in browser

### 2. Health Check
- [ ] `/api/health` endpoint responds
- [ ] Returns healthy status
- [ ] Database connection verified

### 3. Authentication
- [ ] Can access login page
- [ ] Can login with admin credentials
- [ ] JWT token received
- [ ] Protected routes require authentication
- [ ] Logout works

### 4. Core Functionality
- [ ] Can upload Excel file
- [ ] File processes successfully
- [ ] Can view processed report
- [ ] Can download Excel export
- [ ] Can download CSV export
- [ ] Can download PDF export
- [ ] Dashboard loads with data
- [ ] Charts render correctly

### 5. Admin Functions
- [ ] Can access admin panel
- [ ] Can create new user
- [ ] Can edit user
- [ ] Can delete user
- [ ] Can view activity logs
- [ ] Can access system settings
- [ ] Can upload logo
- [ ] Settings persist after refresh

### 6. Performance
- [ ] Page load time < 3 seconds
- [ ] API responses < 500ms
- [ ] File upload works (test with 10MB file)
- [ ] Large report processes (test with 50K rows)
- [ ] No memory leaks (monitor for 1 hour)

### 7. Security
- [ ] HTTPS enforced
- [ ] Security headers present (check with securityheaders.com)
- [ ] Rate limiting works (test by exceeding limit)
- [ ] Authentication required for protected routes
- [ ] RBAC works (test with different roles)
- [ ] Audit logs created for actions

---

## 📊 Monitoring Setup

### 1. Server Monitoring
```bash
# Install monitoring tools
pm2 install pm2-logrotate
```
- [ ] PM2 monitoring dashboard accessible
- [ ] CPU usage monitored
- [ ] Memory usage monitored
- [ ] Disk usage monitored

### 2. Application Monitoring
- [ ] Health endpoint monitored
- [ ] Error logs reviewed
- [ ] Access logs reviewed
- [ ] Database connection monitored

### 3. Alerts (Optional)
- [ ] Setup email alerts for errors
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Setup error tracking (Sentry, optional)

---

## 🔧 Post-Deployment Configuration

### 1. Change Default Credentials
```sql
-- Connect to MySQL
mysql -u root -p

-- Change admin password
USE mis_report_extractor;
UPDATE users SET password = '$2a$10$YourNewHashedPassword' WHERE email = 'admin@example.com';
```
- [ ] Admin password changed
- [ ] New password tested
- [ ] New credentials documented securely

### 2. System Settings
- [ ] Update company name
- [ ] Upload company logo
- [ ] Set timezone
- [ ] Set currency
- [ ] Set date format
- [ ] Configure brand colors

### 3. Initial Data
- [ ] Create teams
- [ ] Create campaigns
- [ ] Add users
- [ ] Set user roles
- [ ] Create report templates

---

## 📋 Maintenance Schedule

### Daily
- [ ] Check PM2 status: `pm2 status`
- [ ] Check disk space: `df -h`
- [ ] Review error logs: `pm2 logs --err`
- [ ] Verify backups created

### Weekly
- [ ] Review activity logs
- [ ] Check storage usage
- [ ] Review security logs
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Review and cleanup old reports
- [ ] Database optimization: `mysqlcheck -o mis_report_extractor`
- [ ] Review user accounts
- [ ] Update system packages
- [ ] Review SSL certificate expiry

### Quarterly
- [ ] Full security audit
- [ ] Performance review
- [ ] Backup restore test
- [ ] Documentation update

---

## 🆘 Rollback Plan

### If Deployment Fails

1. **Stop Application**
   ```bash
   pm2 stop all
   ```

2. **Restore Database**
   ```bash
   mysql -u mis_user -p mis_report_extractor < /path/to/backup.sql
   ```

3. **Revert Code**
   ```bash
   git checkout previous-working-version
   npm run build
   ```

4. **Restart Application**
   ```bash
   pm2 restart all
   ```

5. **Verify**
   - [ ] Application accessible
   - [ ] No errors in logs
   - [ ] Basic functionality working

---

## 📞 Support Contacts

### Emergency Contacts
- **Technical Lead:** _______________
- **Database Admin:** _______________
- **DevOps Engineer:** _______________
- **Support Email:** support@example.com

### Service Providers
- **VPS Provider:** _______________
- **Domain Registrar:** _______________
- **SSL Provider:** Let's Encrypt
- **MySQL Support:** _______________

---

## ✅ Final Sign-Off

### Deployment Completed By
**Name:** _____________________  
**Date:** _____________________  
**Time:** _____________________

### Deployment Verified By
**Name:** _____________________  
**Date:** _____________________  
**Time:** _____________________

### Client Acceptance
**Name:** _____________________  
**Date:** _____________________  
**Signature:** _____________________

---

## 📝 Notes

**Deployment Duration:** _____________ hours

**Issues Encountered:**
- _____________________________________
- _____________________________________
- _____________________________________

**Resolutions:**
- _____________________________________
- _____________________________________
- _____________________________________

**Post-Deployment Actions Required:**
- _____________________________________
- _____________________________________
- _____________________________________

---

**Deployment Status:** ☐ Success ☐ Partial ☐ Failed

**Production URL:** https://_________________

**Admin Credentials:** (Document securely, not here)

**Backup Location:** _____________________

**Monitoring Dashboard:** _____________________

---

**This checklist ensures a smooth, successful production deployment. Check off each item as completed.**
