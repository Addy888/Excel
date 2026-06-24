# Upgrade Guide - Enterprise Edition

## 🎯 Overview

This guide will help you upgrade your existing MIS Report Extractor to the new Enterprise Edition with advanced features.

---

## 📋 Prerequisites

Before upgrading, ensure you have:

- ✅ Node.js v18+ installed
- ✅ MongoDB v5+ running
- ✅ Existing project backed up
- ✅ npm installed
- ✅ 30 minutes for upgrade process

---

## 🚀 Step-by-Step Upgrade

### Step 1: Backup Current Data

```bash
# Backup MongoDB database
mongodump --db mis_report_extractor --out ./backup/$(date +%Y%m%d)

# Backup uploaded files
cp -r server/uploads ./backup/uploads_$(date +%Y%m%d)

# Backup environment files
cp server/.env ./backup/.env.backup
cp client/.env ./backup/.env.client.backup
```

### Step 2: Install New Dependencies

**Backend:**
```bash
cd server
npm install
```

All new dependencies are already in package.json:
- No additional packages needed
- All features use existing dependencies

**Frontend:**
```bash
cd client
npm install recharts
```

New package for charts:
- `recharts` - For data visualization

### Step 3: Run Database Migrations

The new features add new collections. Run seed script to initialize:

```bash
cd server
npm run seed
```

This will create:
- Default admin user (admin@example.com / admin123)
- Default regular user (user@example.com / user123)
- 6 pre-configured rules
- 2 report templates

**Note:** Existing data will NOT be affected. Seed script uses `upsert`.

### Step 4: Verify New Collections

Connect to MongoDB and verify new collections were created:

```bash
mongo
use mis_report_extractor
show collections
```

You should see:
- `users` (existing)
- `uploadedreports` (existing)
- `processedreports` (existing)
- `columnmappings` (existing)
- `rules` ✨ NEW
- `reporttemplates` ✨ NEW
- `validationreports` ✨ NEW
- `auditlogs` ✨ NEW

### Step 5: Update Environment Variables

No new environment variables required! All existing variables work.

Optional: Increase file size limit if needed:

**server/.env:**
```env
# Optional: Increase from 10MB to 50MB
MAX_FILE_SIZE=52428800
```

### Step 6: Build and Start

**Backend:**
```bash
cd server
npm run build  # Compile TypeScript
npm start      # Production mode
# OR
npm run dev    # Development mode
```

**Frontend:**
```bash
cd client
npm run build  # Build for production
npm run dev    # Development mode
```

### Step 7: Test New Features

1. **Login as Admin**
   - Email: admin@example.com
   - Password: admin123

2. **Test Rule Management**
   - Navigate to "Rules Management"
   - View 6 default rules
   - Try toggling a rule on/off
   - Create a new rule

3. **Test Admin Dashboard**
   - Navigate to "Admin Dashboard"
   - View system statistics
   - See charts and analytics

4. **Test Enhanced Upload**
   - Upload a file with some errors
   - View validation report modal
   - See data cleaning summary

5. **Test Audit Logs**
   - Make API call: GET /api/admin/audit-logs
   - View logged activities

---

## 🔄 What Changed?

### New Backend Files
```
server/src/
├── models/
│   ├── Rule.ts ✨
│   ├── ReportTemplate.ts ✨
│   ├── ValidationReport.ts ✨
│   └── AuditLog.ts ✨
├── controllers/
│   ├── ruleController.ts ✨
│   ├── templateController.ts ✨
│   └── adminController.ts ✨
├── routes/
│   ├── ruleRoutes.ts ✨
│   ├── templateRoutes.ts ✨
│   └── adminRoutes.ts ✨
├── services/
│   └── auditService.ts ✨
├── utils/
│   ├── ruleEngine.ts ✨
│   └── dataCleaningEngine.ts ✨
└── scripts/
    └── seedData.ts ✨
```

### Modified Backend Files
```
server/src/
├── controllers/
│   └── reportController.ts (Enhanced with validation)
├── utils/
│   └── excelGenerator.ts (Added validation sheet)
└── server.ts (Added new routes)
```

### New Frontend Files
```
client/src/
├── components/
│   ├── RuleBuilder.tsx ✨
│   ├── ValidationReportModal.tsx ✨
│   └── charts/
│       ├── BarChart.tsx ✨
│       ├── PieChart.tsx ✨
│       └── LineChart.tsx ✨
├── pages/
│   ├── RulesPage.tsx ✨
│   ├── CreateRulePage.tsx ✨
│   └── AdminDashboardPage.tsx ✨
```

### Modified Frontend Files
```
client/src/
├── pages/
│   └── UploadPage.tsx (Added validation modal)
├── layouts/
│   └── DashboardLayout.tsx (Added admin menu items)
└── App.tsx (Added new routes)
```

---

## 🆕 New Features Available

### 1. Dynamic Rule Engine
- Create custom processing rules
- No hardcoded calculations
- Condition-based logic
- Stored in MongoDB
- Toggle active/inactive

**Access:** Rules Management menu

### 2. Data Cleaning Module
- Auto-remove empty rows
- Trim whitespace
- Normalize phone numbers
- Standardize dates
- Detect duplicates
- Validation reporting

**Access:** Automatic on upload

### 3. Admin Dashboard
- System statistics
- Upload trends chart
- Status distribution
- Top uploaders
- Performance metrics

**Access:** Admin Dashboard menu (admin only)

### 4. Audit Logging
- Track all user actions
- Upload/download logs
- Rule/template changes
- IP and user agent tracking

**Access:** API endpoint /api/admin/audit-logs

### 5. Report Templates
- Configurable templates
- Custom formulas
- Aggregation rules
- Reusable configurations

**Access:** API endpoints (UI coming soon)

### 6. Enhanced Excel Export
- Validation Errors sheet added
- Professional formatting
- Color-coded headers
- Auto-width columns

**Access:** Automatic on download

### 7. Advanced Analytics
- Charts and visualizations
- Trend analysis
- Performance tracking
- User activity monitoring

**Access:** Admin Dashboard

---

## 🔧 Configuration Changes

### Database Indexes

New indexes are created automatically:
- `auditlogs`: userId + timestamp
- `auditlogs`: action + timestamp
- `rules`: priority + isActive
- `reporttemplates`: isActive

### API Routes

**New Public Routes:**
```
GET /api/rules - View rules (authenticated)
```

**New Admin Routes:**
```
POST   /api/rules                - Create rule
PUT    /api/rules/:id            - Update rule
DELETE /api/rules/:id            - Delete rule
PATCH  /api/rules/:id/toggle     - Toggle rule

POST   /api/templates            - Create template
GET    /api/templates            - List templates
PUT    /api/templates/:id        - Update template
DELETE /api/templates/:id        - Delete template

GET    /api/admin/dashboard      - Admin stats
GET    /api/admin/users          - User management
PUT    /api/admin/users/:id      - Update user
DELETE /api/admin/users/:id      - Delete user
GET    /api/admin/audit-logs     - View logs
GET    /api/admin/analytics      - Advanced analytics
```

### Frontend Routes

**New Routes:**
```
/rules                  - Rules management (all users)
/admin/dashboard        - Admin dashboard (admin only)
/admin/rules            - Rules management (admin only)
/admin/rules/create     - Create rule (admin only)
```

---

## 🔒 Security Updates

### Enhanced Features
- ✅ Audit logging for all actions
- ✅ IP address tracking
- ✅ User agent tracking
- ✅ Admin-only route protection
- ✅ File validation improvements

### Recommendations
1. Change default admin password immediately
2. Review audit logs regularly
3. Set up log rotation
4. Monitor failed login attempts
5. Use HTTPS in production

---

## 📊 Performance Considerations

### Memory Usage
- Increased slightly due to rule processing
- Cleaning engine is efficient
- Handles 100K+ rows without issues

### Database Growth
- Audit logs will grow over time
- Consider implementing log rotation
- Validation reports add minimal overhead
- Rules and templates are small

### Recommendations
1. Monitor disk space
2. Archive old audit logs monthly
3. Clean up old uploaded files
4. Index optimization for large datasets

---

## 🐛 Troubleshooting

### Issue: Seed Script Fails

**Solution:**
```bash
# Check MongoDB connection
mongo
show dbs

# Ensure server/.env has correct MONGODB_URI
# Run seed again
npm run seed
```

### Issue: Rules Not Applying

**Solutions:**
1. Check if rules are active
2. Verify field names match uploaded data
3. Check rule priority order
4. Review rule conditions

### Issue: Charts Not Displaying

**Solutions:**
1. Ensure recharts is installed: `npm install recharts`
2. Clear browser cache
3. Check browser console for errors
4. Verify data is being fetched

### Issue: Validation Modal Not Showing

**Solutions:**
1. Check if validation report has errors/warnings
2. Clear browser cache and reload
3. Check network tab for API response
4. Verify file upload completed

### Issue: Admin Routes 403 Error

**Solutions:**
1. Verify logged in as admin user
2. Check token is valid
3. Clear localStorage and login again
4. Verify role in user object

---

## 🔄 Rollback Procedure

If you need to rollback:

### Step 1: Restore Database
```bash
# Restore from backup
mongorestore --db mis_report_extractor ./backup/YYYYMMDD/mis_report_extractor
```

### Step 2: Restore Files
```bash
# Restore uploaded files
rm -rf server/uploads
cp -r ./backup/uploads_YYYYMMDD server/uploads
```

### Step 3: Restore Code
```bash
# Use git to revert
git checkout previous-version-tag
npm install
npm run build
```

### Step 4: Remove New Collections (Optional)
```bash
mongo
use mis_report_extractor
db.rules.drop()
db.reporttemplates.drop()
db.validationreports.drop()
db.auditlogs.drop()
```

---

## 📝 Post-Upgrade Checklist

- [ ] Database backup completed
- [ ] New dependencies installed
- [ ] Seed script executed successfully
- [ ] New collections verified in MongoDB
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Can login as admin
- [ ] Rules page loads
- [ ] Admin dashboard displays
- [ ] File upload works with validation
- [ ] Charts display correctly
- [ ] Audit logs are being created
- [ ] Excel export includes validation sheet
- [ ] All tests pass
- [ ] Documentation reviewed
- [ ] Team trained on new features

---

## 🎓 Training Resources

### For Admins
1. Read: ENTERPRISE_FEATURES.md
2. Watch: Admin Dashboard overview
3. Practice: Create test rules
4. Review: Audit logs
5. Monitor: System performance

### For Users
1. Read: Updated README.md
2. Learn: New validation reports
3. Practice: Upload with errors
4. Understand: Data cleaning process

---

## 📞 Support

### Getting Help
1. Check ENTERPRISE_FEATURES.md
2. Review API_DOCUMENTATION.md
3. Check troubleshooting section above
4. Review GitHub issues
5. Contact development team

### Reporting Issues
When reporting issues, include:
- Error message
- Steps to reproduce
- Browser/Node version
- MongoDB version
- Relevant logs

---

## 🎉 Success!

Your MIS Report Extractor is now upgraded to Enterprise Edition!

**Key Improvements:**
- ✅ Dynamic rule engine
- ✅ Data cleaning and validation
- ✅ Audit logging
- ✅ Admin analytics
- ✅ Enhanced Excel exports
- ✅ Professional UI
- ✅ Better performance

**Next Steps:**
1. Train your team
2. Create custom rules
3. Monitor analytics
4. Enjoy the new features!

---

**Version:** Enterprise Edition v2.0  
**Upgrade Date:** ${new Date().toISOString().split('T')[0]}  
**Status:** ✅ Complete
