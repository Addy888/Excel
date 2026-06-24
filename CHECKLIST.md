# ✅ MIS Report Extractor - Setup Checklist

Use this checklist to ensure everything is properly set up.

## 📋 Pre-Installation Checklist

- [ ] Node.js v18+ installed
  - Check: `node --version`
  - Download: https://nodejs.org/

- [ ] npm installed (comes with Node.js)
  - Check: `npm --version`

- [ ] MongoDB installed
  - Check: `mongod --version`
  - Download: https://www.mongodb.com/try/download/community

- [ ] Git installed (optional, for version control)
  - Check: `git --version`

## 📦 Installation Checklist

- [ ] Backend dependencies installed
  ```bash
  cd server
  npm install
  ```

- [ ] Frontend dependencies installed
  ```bash
  cd client
  npm install
  ```

- [ ] Environment files created
  - [ ] `server/.env` exists (already created)
  - [ ] `client/.env` exists (already created)

- [ ] MongoDB is running
  - Windows: `net start MongoDB`
  - Mac: `brew services start mongodb-community`
  - Linux: `sudo systemctl start mongod`

## 🚀 First Run Checklist

- [ ] Backend server started
  ```bash
  cd server
  npm run dev
  ```
  - [ ] See: "✅ MongoDB connected successfully"
  - [ ] See: "🚀 Server is running on port 5000"

- [ ] Frontend application started
  ```bash
  cd client
  npm run dev
  ```
  - [ ] See: "Local: http://localhost:3000"

- [ ] Can access application in browser
  - [ ] Open: http://localhost:3000
  - [ ] Login page loads correctly

## 👤 User Setup Checklist

- [ ] Registered first admin user
  - Name: _____________
  - Email: _____________
  - Role: Admin

- [ ] Successfully logged in
- [ ] Can see dashboard
- [ ] All navigation items visible

## 📊 Feature Testing Checklist

### Upload & Processing
- [ ] Can navigate to Upload page
- [ ] Can drag and drop file
- [ ] File upload shows progress
- [ ] Column mapping interface appears
- [ ] Can map columns to system fields
- [ ] Report processes successfully
- [ ] Summary statistics display correctly

### Dashboard
- [ ] Statistics cards show data
- [ ] Recent activity table displays
- [ ] Can navigate from dashboard

### Report History
- [ ] Reports list displays
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Can view report details
- [ ] Can download reports
- [ ] Can delete reports (Admin only)

### UI/UX
- [ ] Dark mode toggle works
- [ ] Sidebar collapses/expands
- [ ] Responsive on mobile
- [ ] All buttons functional
- [ ] Error messages display properly

## 🔧 Configuration Checklist

### Backend Configuration (server/.env)
- [ ] PORT is set (default: 5000)
- [ ] MONGODB_URI is correct
- [ ] JWT_SECRET is set
- [ ] NODE_ENV is set

### Frontend Configuration (client/.env)
- [ ] VITE_API_URL points to backend

## 🗄️ Database Checklist

- [ ] MongoDB is accessible
  ```bash
  mongo
  # or
  mongosh
  ```

- [ ] Database created
  ```bash
  show dbs
  # Should see: mis_report_extractor
  ```

- [ ] Collections created (after first user registration)
  ```bash
  use mis_report_extractor
  show collections
  # Should see: users, uploadedreports, processedreports
  ```

## 📁 File Structure Checklist

- [ ] All server files present
  - [ ] src/server.ts
  - [ ] src/config/database.ts
  - [ ] src/controllers/
  - [ ] src/models/
  - [ ] src/routes/
  - [ ] src/middleware/
  - [ ] src/utils/

- [ ] All client files present
  - [ ] src/App.tsx
  - [ ] src/main.tsx
  - [ ] src/components/
  - [ ] src/pages/
  - [ ] src/layouts/
  - [ ] src/services/

- [ ] Documentation files present
  - [ ] README.md
  - [ ] SETUP_GUIDE.md
  - [ ] API_DOCUMENTATION.md
  - [ ] CREATE_TEST_DATA.md
  - [ ] DEPLOYMENT.md

## 🧪 Testing Checklist

### Create Test Data
- [ ] Created test Excel file with columns:
  - Agent Name
  - Call Status
  - Phone Number
  - Call Date
  - Remarks

- [ ] Added sample rows (at least 10)

### Upload Test
- [ ] Upload test file
- [ ] File accepted
- [ ] No error messages
- [ ] Headers detected correctly

### Processing Test
- [ ] Column mapping works
- [ ] Processing completes
- [ ] Summary shows correct data
- [ ] Generated report downloadable

### Download Test
- [ ] Can download processed report
- [ ] Excel file opens correctly
- [ ] Contains all 4 sheets:
  - [ ] Summary
  - [ ] Agent Summary
  - [ ] Date Summary
  - [ ] Status Summary

## 🔒 Security Checklist

- [ ] JWT_SECRET changed from default
- [ ] Password hashing working
- [ ] Protected routes require login
- [ ] Admin routes restricted
- [ ] File validation working
- [ ] File size limit enforced

## 📱 Browser Compatibility Checklist

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browser

## 🎯 Performance Checklist

- [ ] Page loads under 3 seconds
- [ ] File upload completes quickly
- [ ] Report processing is fast
- [ ] No console errors
- [ ] No memory leaks (check with DevTools)

## 📚 Documentation Checklist

Read and understand:
- [ ] README.md - Project overview
- [ ] SETUP_GUIDE.md - Installation steps
- [ ] API_DOCUMENTATION.md - API reference
- [ ] START.md - Quick start
- [ ] CREATE_TEST_DATA.md - Test data guide

## 🐛 Troubleshooting Checklist

If something doesn't work:

- [ ] Check MongoDB is running
- [ ] Check both servers are running
- [ ] Check console for errors
- [ ] Check network tab in DevTools
- [ ] Verify .env files are correct
- [ ] Check file permissions
- [ ] Clear browser cache
- [ ] Restart servers

## ✅ Production Readiness Checklist

Before deploying to production:
- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Use production MongoDB
- [ ] Enable HTTPS
- [ ] Set up MongoDB authentication
- [ ] Configure CORS properly
- [ ] Set up monitoring
- [ ] Set up backups
- [ ] Test all features in production
- [ ] Load test the application

## 🎉 Success Criteria

You're ready when:
- [ ] ✅ Can register and login
- [ ] ✅ Can upload Excel/CSV files
- [ ] ✅ Can map columns
- [ ] ✅ Can process reports
- [ ] ✅ Can view statistics
- [ ] ✅ Can download reports
- [ ] ✅ Can view history
- [ ] ✅ All features work smoothly

## 📝 Notes Section

Write down any issues or customizations:

```
Date: ___________

Issues encountered:
1. _________________________________
2. _________________________________
3. _________________________________

Solutions applied:
1. _________________________________
2. _________________________________
3. _________________________________

Customizations made:
1. _________________________________
2. _________________________________
3. _________________________________
```

---

## 🏁 Final Status

When all checkboxes are complete, you're ready to use the MIS Report Extractor!

**Date Completed:** ___________

**Completed By:** ___________

**Status:** ⬜ In Progress | ⬜ Complete | ⬜ Production Ready

---

**Print this checklist and check items off as you complete them!**
