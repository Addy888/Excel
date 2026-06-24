# Testing Guide - Phase 3 Features

## Overview

This guide provides comprehensive testing procedures for all Phase 3 features of the MIS Report Extractor.

---

## 🧪 Testing Prerequisites

### Setup Required:
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000
- MySQL database with migrations applied
- Test user accounts created
- Sample Excel/CSV files ready

### Tools Needed:
- Browser (Chrome/Firefox)
- Postman or cURL
- MySQL Workbench or command line
- Sample data files

---

## 1️⃣ Processing Profiles Testing

### Test 1.1: Create Profile
**Endpoint:** `POST /api/profiles`

```bash
curl -X POST http://localhost:5000/api/profiles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign Profile",
    "description": "Testing profile creation",
    "columnMappingId": 1,
    "rules": [{"field": "status", "condition": "equals", "value": "Connected"}],
    "filters": {"dateRange": "last30days"},
    "isDefault": true
  }'
```

**Expected Result:**
- Status: 201 Created
- Response contains profile ID
- Profile saved in database

### Test 1.2: List Profiles
```bash
curl -X GET "http://localhost:5000/api/profiles?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Array of profiles returned
- Pagination info included

### Test 1.3: Get Default Profile
```bash
curl -X GET http://localhost:5000/api/profiles/default \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Default profile returned (if exists)

### Test 1.4: Update Profile
```bash
curl -X PUT http://localhost:5000/api/profiles/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Profile Name",
    "description": "Updated description"
  }'
```

**Expected Result:**
- Status: 200 OK
- Profile updated successfully

### Test 1.5: Delete Profile
```bash
curl -X DELETE http://localhost:5000/api/profiles/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Profile deleted

---

## 2️⃣ Campaign Reports Testing

### Test 2.1: Create Campaign
```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2024 Campaign",
    "description": "First quarter sales campaign"
  }'
```

**Expected Result:**
- Status: 201 Created
- Campaign created with ID

### Test 2.2: Get Campaign Analytics
```bash
curl -X GET "http://localhost:5000/api/campaigns/1/analytics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Analytics data with summary metrics
- Connection rate, qualification rate calculated

### Test 2.3: Create Campaign Report
```bash
curl -X POST http://localhost:5000/api/campaigns/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": 1,
    "reportDate": "2024-01-15",
    "totalDialed": 1000,
    "connected": 700,
    "qualified": 250,
    "converted": 90,
    "agentCount": 10
  }'
```

**Expected Result:**
- Status: 200 OK
- Campaign report created/updated
- Conversion rate calculated automatically

---

## 3️⃣ Agent Performance Testing

### Test 3.1: Create Agent
```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "campaignId": 1,
    "teamId": 1
  }'
```

**Expected Result:**
- Status: 201 Created
- Agent created successfully

### Test 3.2: Get Performance Dashboard
```bash
curl -X GET "http://localhost:5000/api/agents/performance/dashboard?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Top performers list
- Summary statistics
- Agent rankings

### Test 3.3: Get Individual Agent Performance
```bash
curl -X GET "http://localhost:5000/api/agents/1/performance?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Agent details
- Performance metrics
- Historical data

### Test 3.4: Create Agent Performance
```bash
curl -X POST http://localhost:5000/api/agents/performance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": 1,
    "reportDate": "2024-01-15",
    "totalCalls": 500,
    "connectedCalls": 350,
    "qualifiedLeads": 120,
    "convertedLeads": 45
  }'
```

**Expected Result:**
- Status: 200 OK
- Performance record created
- Productivity score calculated

---

## 4️⃣ Report Comparison Testing

### Test 4.1: Compare Two Reports
```bash
curl -X POST http://localhost:5000/api/comparisons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report1Id": 1,
    "report2Id": 2,
    "name": "Yesterday vs Today"
  }'
```

**Expected Result:**
- Status: 200 OK
- Comparison data with differences
- Percentage changes calculated
- Insights generated

### Test 4.2: Get Comparison
```bash
curl -X GET http://localhost:5000/api/comparisons/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Comparison details
- Both report references

---

## 5️⃣ Scheduled Reports Testing

### Test 5.1: Create Schedule (Admin Only)
```bash
curl -X POST http://localhost:5000/api/scheduled-reports \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily MIS Report",
    "description": "Automated daily report",
    "frequency": "daily",
    "recipients": ["admin@example.com"],
    "subject": "Daily MIS Report",
    "emailBody": "<h2>Daily Report</h2>"
  }'
```

**Expected Result:**
- Status: 201 Created
- Schedule created
- Next run date calculated

### Test 5.2: Trigger Manual Run
```bash
curl -X POST http://localhost:5000/api/scheduled-reports/1/trigger \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Report run created
- Status marked as pending/completed

### Test 5.3: Get Execution History
```bash
curl -X GET http://localhost:5000/api/scheduled-reports/1/runs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- List of report runs
- Status and timestamps

---

## 6️⃣ Executive Dashboard Testing

### Test 6.1: Get Executive Dashboard
```bash
curl -X GET "http://localhost:5000/api/dashboard/executive?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Comprehensive KPIs
- Trend data
- Top agents
- Status distribution

**Verify Metrics:**
- Total Calls > 0
- Conversion Rate calculated correctly
- Connection Rate calculated correctly
- Top agents sorted by productivity

### Test 6.2: Get Detailed Stats
```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- User count
- Report counts
- Processing rate
- Recent uploads

### Test 6.3: Get Download Center
```bash
curl -X GET "http://localhost:5000/api/dashboard/downloads?search=report&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- List of reports
- Download permissions
- Search working

---

## 7️⃣ Dynamic KPI Testing

### Test 7.1: Get Built-in KPIs
```bash
curl -X GET http://localhost:5000/api/kpis/built-in \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- List of built-in KPIs
- Formulas and thresholds

### Test 7.2: Calculate KPI Values
```bash
curl -X GET "http://localhost:5000/api/kpis/values?startDate=2024-01-15&endDate=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- KPI values calculated
- Status (excellent/good/average/poor)
- Aggregate data included

### Test 7.3: Create Custom KPI (Admin Only)
```bash
curl -X POST http://localhost:5000/api/kpis \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Success Rate",
    "description": "Custom success metric",
    "formula": "((convertedLeads + qualifiedLeads) / totalDialed) * 100",
    "category": "custom",
    "displayFormat": "percentage",
    "thresholds": {
      "excellent": 50,
      "good": 30,
      "average": 15,
      "poor": 0
    }
  }'
```

**Expected Result:**
- Status: 201 Created
- KPI created successfully

---

## 8️⃣ Formula Builder Testing

### Test 8.1: Get Built-in Formulas
```bash
curl -X GET http://localhost:5000/api/formulas/built-in \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- List of built-in formulas

### Test 8.2: Test Formula
```bash
curl -X POST http://localhost:5000/api/formulas/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expression": "(qualifiedLeads / connectedCalls) * 100",
    "variables": ["qualifiedLeads", "connectedCalls"],
    "sampleData": {
      "qualifiedLeads": 40,
      "connectedCalls": 80
    }
  }'
```

**Expected Result:**
- Status: 200 OK
- Formula result: 50.0

### Test 8.3: Create Formula (Admin Only)
```bash
curl -X POST http://localhost:5000/api/formulas \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Metric",
    "description": "Test formula",
    "expression": "(convertedLeads / totalDialed) * 100",
    "variables": ["convertedLeads", "totalDialed"],
    "category": "conversion"
  }'
```

**Expected Result:**
- Status: 201 Created
- Formula validated and saved

---

## 9️⃣ Team Management Testing

### Test 9.1: Create Team
```bash
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Alpha",
    "description": "Primary sales team"
  }'
```

**Expected Result:**
- Status: 201 Created
- Team created

### Test 9.2: Assign Agent to Team
```bash
curl -X POST http://localhost:5000/api/teams/assign-agent \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": 1,
    "agentId": 1
  }'
```

**Expected Result:**
- Status: 200 OK
- Agent assigned to team

### Test 9.3: Get Team Performance
```bash
curl -X GET "http://localhost:5000/api/teams/1/performance?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Team statistics
- Aggregated performance

---

## 🔟 Report Designer Testing

### Test 10.1: Create Report Design
```bash
curl -X POST http://localhost:5000/api/report-designer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Sales Report",
    "description": "Customized report layout",
    "columns": ["agent", "totalDialed", "connected", "qualified"],
    "metrics": [
      {
        "name": "Conversion Rate",
        "expression": "(convertedLeads / totalDialed) * 100"
      }
    ]
  }'
```

**Expected Result:**
- Status: 201 Created
- Design saved

### Test 10.2: Apply Design to Report
```bash
curl -X POST http://localhost:5000/api/report-designer/apply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 1,
    "reportId": 5
  }'
```

**Expected Result:**
- Status: 200 OK
- Transformed report data

---

## 🧪 Integration Testing Scenarios

### Scenario 1: Complete Report Workflow
1. Create processing profile
2. Upload file
3. Process with profile
4. View in dashboard
5. Download report
6. Compare with previous
7. Schedule for tomorrow

### Scenario 2: Agent Performance Tracking
1. Create agent
2. Assign to campaign
3. Create performance record
4. View on dashboard
5. Compare with team
6. Generate report

### Scenario 3: Executive View
1. Login as admin
2. View executive dashboard
3. Check all KPIs
4. View top performers
5. Review trends
6. Export data

---

## ✅ Test Results Template

| Test ID | Feature | Status | Notes |
|---------|---------|--------|-------|
| 1.1 | Create Profile | ⬜ Pass / ⬜ Fail | |
| 1.2 | List Profiles | ⬜ Pass / ⬜ Fail | |
| 2.1 | Create Campaign | ⬜ Pass / ⬜ Fail | |
| 2.2 | Get Analytics | ⬜ Pass / ⬜ Fail | |
| 3.1 | Create Agent | ⬜ Pass / ⬜ Fail | |
| 3.2 | Performance Dashboard | ⬜ Pass / ⬜ Fail | |
| 4.1 | Compare Reports | ⬜ Pass / ⬜ Fail | |
| 5.1 | Create Schedule | ⬜ Pass / ⬜ Fail | |
| 6.1 | Executive Dashboard | ⬜ Pass / ⬜ Fail | |
| 7.1 | Get KPIs | ⬜ Pass / ⬜ Fail | |
| 8.1 | Test Formula | ⬜ Pass / ⬜ Fail | |
| 9.1 | Create Team | ⬜ Pass / ⬜ Fail | |
| 10.1 | Create Design | ⬜ Pass / ⬜ Fail | |

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution:** Check JWT token validity, regenerate if expired

### Issue: 404 Not Found
**Solution:** Verify endpoint URL and route registration

### Issue: 500 Internal Server Error
**Solution:** Check server logs, verify database connection

### Issue: Database Errors
**Solution:** Run migrations, check Prisma schema

---

## 📊 Performance Testing

### Load Testing Endpoints:
```bash
# Use Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/dashboard/executive

# Expected: < 200ms average response time
```

### Database Performance:
```sql
-- Check slow queries
SHOW FULL PROCESSLIST;

-- Verify indexes
SHOW INDEX FROM ProcessingProfile;
```

---

## ✅ Final Checklist

- [ ] All API endpoints tested
- [ ] Success responses verified
- [ ] Error handling tested
- [ ] Authorization tested
- [ ] Data validation working
- [ ] Calculations accurate
- [ ] Pagination working
- [ ] Search/filter working
- [ ] Database constraints enforced
- [ ] No memory leaks
- [ ] Response times acceptable
- [ ] Documentation accurate

---

## 🎉 Testing Complete!

Once all tests pass, the Phase 3 features are verified and ready for use!

**Next Steps:**
1. Build frontend components
2. Conduct user acceptance testing
3. Deploy to staging
4. Run regression tests
5. Deploy to production

---

**Testing Guide Version:** 1.0.0  
**Last Updated:** January 2024
