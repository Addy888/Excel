# Database Migration Guide - Phase 3 Updates

## Overview

This guide will help you apply the Phase 3 database schema changes to your existing MIS Report Extractor application.

---

## ⚠️ Important: Backup First!

**ALWAYS backup your database before running migrations!**

```bash
# MySQL Backup
mysqldump -u your_user -p mis_report_extractor > backup_$(date +%Y%m%d).sql

# Restore if needed
mysql -u your_user -p mis_report_extractor < backup_YYYYMMDD.sql
```

---

## 🗄️ Database Schema Changes

### New Tables Added (7 tables):
1. `ProcessingProfile` - Processing configuration storage
2. `CampaignReport` - Campaign analytics data
3. `AgentPerformance` - Agent performance metrics
4. `ReportComparison` - Report comparison results
5. `ScheduledReport` - Report scheduling configuration
6. `ScheduledReportRun` - Schedule execution logs
7. `ErrorReport` - Error tracking data

### Modified Tables (5 tables):
1. `User` - Added foreign key relations
2. `Campaign` - Added campaign reports relation
3. `Agent` - Added performance relation
4. `UploadedReport` - Added error reports relation
5. `ColumnMapping` - Added processing profiles relation

---

## 📝 Step-by-Step Migration

### Step 1: Update Prisma Schema

The Prisma schema has already been updated in:
```
server/prisma/schema.prisma
```

Review the changes to understand what will be created.

---

### Step 2: Generate Migration

```bash
# Navigate to server directory
cd server

# Generate Prisma Client
npx prisma generate

# Create migration (development)
npx prisma migrate dev --name phase3_business_automation

# OR for production (no prompts)
npx prisma migrate deploy
```

---

### Step 3: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# View database schema
npx prisma db pull

# Open Prisma Studio to view data
npx prisma studio
```

---

## 🔍 Migration Details

### New Table: ProcessingProfile
```sql
CREATE TABLE `ProcessingProfile` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `columnMappingId` INT NULL,
  `rules` JSON NULL,
  `filters` JSON NULL,
  `createdById` INT NOT NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### New Table: CampaignReport
```sql
CREATE TABLE `CampaignReport` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `campaignId` INT NOT NULL,
  `reportDate` DATETIME(3) NOT NULL,
  `totalDialed` INT NOT NULL DEFAULT 0,
  `connected` INT NOT NULL DEFAULT 0,
  `qualified` INT NOT NULL DEFAULT 0,
  `converted` INT NOT NULL DEFAULT 0,
  `conversionRate` DOUBLE NOT NULL DEFAULT 0,
  `agentCount` INT NOT NULL DEFAULT 0,
  `metrics` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CampaignReport_campaignId_reportDate_key`(`campaignId`, `reportDate`),
  PRIMARY KEY (`id`)
);
```

### New Table: AgentPerformance
```sql
CREATE TABLE `AgentPerformance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `agentId` INT NOT NULL,
  `reportDate` DATETIME(3) NOT NULL,
  `totalCalls` INT NOT NULL DEFAULT 0,
  `connectedCalls` INT NOT NULL DEFAULT 0,
  `qualifiedLeads` INT NOT NULL DEFAULT 0,
  `convertedLeads` INT NOT NULL DEFAULT 0,
  `conversionRate` DOUBLE NOT NULL DEFAULT 0,
  `productivityScore` DOUBLE NOT NULL DEFAULT 0,
  `rank` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `AgentPerformance_agentId_reportDate_key`(`agentId`, `reportDate`),
  PRIMARY KEY (`id`)
);
```

### New Table: ReportComparison
```sql
CREATE TABLE `ReportComparison` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `report1Id` INT NOT NULL,
  `report2Id` INT NOT NULL,
  `comparisonData` JSON NULL,
  `createdById` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### New Table: ScheduledReport
```sql
CREATE TABLE `ScheduledReport` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `schedule` VARCHAR(191) NOT NULL,
  `frequency` VARCHAR(191) NOT NULL DEFAULT 'daily',
  `templateId` INT NULL,
  `recipients` JSON NULL,
  `subject` VARCHAR(191) NULL,
  `emailBody` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `lastRunAt` DATETIME(3) NULL,
  `nextRunAt` DATETIME(3) NULL,
  `createdById` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### New Table: ScheduledReportRun
```sql
CREATE TABLE `ScheduledReportRun` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `scheduledReportId` INT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  `errorMessage` TEXT NULL,
  `reportFilePath` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);
```

### New Table: ErrorReport
```sql
CREATE TABLE `ErrorReport` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `uploadedReportId` INT NOT NULL,
  `invalidRecords` JSON NULL,
  `missingFields` JSON NULL,
  `duplicateEntries` JSON NULL,
  `totalErrors` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

---

## 🔗 Foreign Key Relationships

The migration will automatically create these relationships:

1. ProcessingProfile → ColumnMapping (optional)
2. ProcessingProfile → User (creator)
3. CampaignReport → Campaign
4. AgentPerformance → Agent
5. ReportComparison → User (creator)
6. ScheduledReport → User (creator)
7. ScheduledReport → ReportTemplate (optional)
8. ScheduledReportRun → ScheduledReport
9. ErrorReport → UploadedReport

---

## 📊 Indexes Created

The migration creates these indexes for better query performance:

```sql
-- Unique indexes
CREATE UNIQUE INDEX `CampaignReport_campaignId_reportDate_key` 
  ON `CampaignReport`(`campaignId`, `reportDate`);

CREATE UNIQUE INDEX `AgentPerformance_agentId_reportDate_key` 
  ON `AgentPerformance`(`agentId`, `reportDate`);

-- Foreign key indexes (created automatically)
-- ProcessingProfile.columnMappingId
-- ProcessingProfile.createdById
-- CampaignReport.campaignId
-- AgentPerformance.agentId
-- ScheduledReport.createdById
-- ScheduledReportRun.scheduledReportId
-- ErrorReport.uploadedReportId
```

---

## ✅ Verification Steps

### 1. Check Tables Exist
```sql
USE mis_report_extractor;
SHOW TABLES;
```

You should see all new tables:
- ProcessingProfile
- CampaignReport
- AgentPerformance
- ReportComparison
- ScheduledReport
- ScheduledReportRun
- ErrorReport

### 2. Check Table Structure
```sql
DESCRIBE ProcessingProfile;
DESCRIBE CampaignReport;
DESCRIBE AgentPerformance;
-- etc.
```

### 3. Test Prisma Client
```bash
# In server directory
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.processingProfile.findMany().then(console.log).finally(() => prisma.$disconnect());"
```

### 4. Check Foreign Keys
```sql
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM
  INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
  REFERENCED_TABLE_SCHEMA = 'mis_report_extractor';
```

---

## 🐛 Troubleshooting

### Issue: Migration Fails

**Error: Table already exists**
```bash
# Solution: Reset database (⚠️ DELETES ALL DATA!)
npx prisma migrate reset

# Then run migration again
npx prisma migrate dev
```

**Error: Foreign key constraint fails**
```bash
# Solution: Check data integrity
# Make sure all referenced IDs exist in parent tables

# Find orphaned records
SELECT * FROM ProcessingProfile WHERE createdById NOT IN (SELECT id FROM User);
```

### Issue: Prisma Client Out of Sync

```bash
# Regenerate Prisma Client
npx prisma generate

# Restart your application
```

### Issue: Migration Pending

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

---

## 🔄 Rollback (If Needed)

### Option 1: Restore from Backup
```bash
# Stop application
# Restore database backup
mysql -u your_user -p mis_report_extractor < backup_YYYYMMDD.sql

# Revert Prisma schema to previous version
git checkout HEAD~1 server/prisma/schema.prisma

# Regenerate Prisma Client
cd server
npx prisma generate
```

### Option 2: Manual Rollback
```sql
-- Drop new tables in reverse order
DROP TABLE IF EXISTS ErrorReport;
DROP TABLE IF EXISTS ScheduledReportRun;
DROP TABLE IF EXISTS ScheduledReport;
DROP TABLE IF EXISTS ReportComparison;
DROP TABLE IF EXISTS AgentPerformance;
DROP TABLE IF EXISTS CampaignReport;
DROP TABLE IF EXISTS ProcessingProfile;

-- Remove added columns (if any were added to existing tables)
-- Example:
-- ALTER TABLE User DROP FOREIGN KEY ...;
```

---

## 📈 Post-Migration Steps

### 1. Restart Application
```bash
# Stop backend
# Start backend
cd server
npm run dev
```

### 2. Test New Endpoints
```bash
# Test health check
curl http://localhost:5000/health

# Test new profile endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/profiles
```

### 3. Seed Sample Data (Optional)
```bash
cd server
npm run seed
```

### 4. Update Environment Variables
No new environment variables are required for Phase 3 features!

---

## 📝 Migration Log

### Keep track of your migration:

**Date:** ___________________  
**Database:** mis_report_extractor  
**Backup File:** ___________________  
**Migration Status:** ___________________  
**Issues Encountered:** ___________________  
**Resolution:** ___________________  

---

## ✅ Success Checklist

After migration, verify:

- [ ] All 7 new tables created
- [ ] Foreign keys created correctly
- [ ] Indexes created
- [ ] Prisma Client regenerated
- [ ] Application starts without errors
- [ ] Health check endpoint responds
- [ ] New API endpoints accessible
- [ ] No database errors in logs
- [ ] Existing data intact
- [ ] Backup saved securely

---

## 🎉 Migration Complete!

Once all checks pass, your database is ready for Phase 3 features!

### Next Steps:
1. Test new features through the API
2. Build frontend components
3. Deploy to staging environment
4. Run integration tests
5. Deploy to production

---

## 📞 Support

If you encounter issues:
1. Check error logs: `server/logs/`
2. Review Prisma logs
3. Check MySQL error log
4. Verify Prisma schema syntax
5. Ensure MySQL version compatibility (8.0+)

---

**Migration Guide Version:** 1.0.0  
**Compatible With:** Phase 3 Implementation  
**MySQL Version:** 8.0+  
**Prisma Version:** 5.0+
