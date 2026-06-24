# Client Template Report Generator - Complete Guide

## Overview

The Client Template Report Generator produces **ONLY** the final client report that matches the exact template format provided by the client. 

### What It Does ✅
- Generates ONE Excel workbook
- Contains ONE sheet: "Till Time"
- Matches client template exactly
- Professional formatting
- Management-ready output
- Print-ready layout

### What It Does NOT Do ❌
- No custom MIS formats
- No dashboards
- No analytics sheets
- No summary sheets
- No raw data sheets
- No AI-generated content

---

## Sheet Structure

### Sheet Name
**"Till Time"**

### Header
**"FCS TEAM PERFORMANCE - FROM [START DATE] TILL [END DATE]"**
- Merged cells across all columns
- Bold, white text on blue background
- Centered alignment

### Columns
1. **Caller's Name** - Agent name (left-aligned)
2. **Date of Joining** - Agent join date (center-aligned)
3. **Total Dialed** - Total calls made = `CALLS` column
4. **Connected Calls** - Sum of `CP + CMDIS + CALLBK + VC`
5. **Qualified** - Qualified leads = `CMDIS` column
6. **In Process** - Follow-up leads = `CALLBK` column
7. **VC Scheduled** - Video conference scheduled = `VC` column
8. **VC Done** - Completed video conferences (configurable)
9. **Booking Done** - Completed bookings (configurable)
10. **Token Done** - Token collected (configurable)
11. **Remark** - Notes/comments (left-aligned)

### Data Rules
- Each agent gets ONE row
- Multiple records for same agent are aggregated
- Never create "Unknown" agents
- Never create blank agent names
- Never merge different agents
- Never lose USER NAME or ID mapping

### Total Row
- Last row labeled "TOTAL"
- Bold white text on blue background
- Sums all numeric columns
- Matches client format exactly

---

## API Endpoint

### POST `/api/reports/generate-client-template`

**Authentication Required:** Yes (Bearer Token)

#### Request Body

```json
{
  "reportId": 123,
  "columnMapping": {
    "userName": "USER NAME",
    "userId": "ID",
    "dateOfJoining": "DATE OF JOINING",
    "calls": "CALLS",
    "cp": "CP",
    "cmdis": "CMDIS",
    "callbk": "CALLBK",
    "vc": "VC",
    "vcDone": "VC_DONE",
    "bookingDone": "BOOKING",
    "tokenDone": "TOKEN",
    "remark": "REMARKS",
    "date": "DATE"
  },
  "customTitle": "FCS TEAM PERFORMANCE - FROM 01-01-2024 TILL 31-01-2024"
}
```

#### Required Fields
- `reportId` - The uploaded report ID
- `columnMapping.userName` - Column containing agent names
- `columnMapping.calls` - Column containing total calls

#### Optional Fields
All other column mappings are optional but recommended for complete reports.

#### Response Success (200)

```json
{
  "success": true,
  "message": "Client template report generated successfully",
  "processedReport": {
    "id": 456,
    "filePath": "/path/to/Team_Performance_Report_1234567890.xlsx",
    "fileName": "Team_Performance_Report_1234567890.xlsx",
    "agentCount": 25,
    "dateRange": {
      "startDate": "01-01-2024",
      "endDate": "31-01-2024"
    },
    "summary": {
      "totalDialed": 5000,
      "connectedCalls": 3200,
      "qualified": 800,
      "inProcess": 400,
      "vcScheduled": 200,
      "vcDone": 150,
      "bookingDone": 100,
      "tokenDone": 80
    }
  }
}
```

#### Error Responses

**400 - Missing Required Fields**
```json
{
  "message": "Missing required fields: reportId and columnMapping are required"
}
```

**400 - Missing Column Mappings**
```json
{
  "message": "Missing required column mappings: userName, calls"
}
```

**404 - Report Not Found**
```json
{
  "message": "Report not found"
}
```

**400 - No Valid Data**
```json
{
  "message": "No valid agent data found. Please check column mappings."
}
```

---

## Column Mapping Logic

### Total Dialed
```
Total Dialed = CALLS column value
```

### Connected Calls
```
Connected Calls = CP + CMDIS + CALLBK + VC
```

### Qualified
```
Qualified = CMDIS (Call Made - Disposition)
```

### In Process
```
In Process = CALLBK (Callback scheduled)
```

### VC Scheduled
```
VC Scheduled = VC (Video Conference scheduled)
```

### VC Done, Booking Done, Token Done
These are configured through custom column mappings. If not provided, they default to 0.

---

## Data Aggregation Rules

When multiple CSV rows belong to the same agent:

1. **Identify Agent:** Group by `USER NAME` (case-sensitive)
2. **Aggregate Totals:**
   - Sum all numeric metrics
   - Keep the most recent Date of Joining
   - Concatenate or keep last Remark
3. **Never Lose Data:**
   - All rows for an agent are counted
   - No data is discarded
   - Duplicates are properly handled

### Example

**Input CSV:**
```
USER NAME,CALLS,CP,CMDIS,CALLBK,VC
John Doe,100,20,15,10,5
John Doe,150,30,25,15,8
```

**Output Row:**
```
John Doe: Total Dialed=250, Connected Calls=128, Qualified=40, In Process=25, VC Scheduled=13
```

---

## Formatting Specifications

### Colors
- **Title Background:** `#366092` (Professional Blue)
- **Title Text:** White
- **Header Background:** `#4472C4` (Header Blue)
- **Header Text:** White
- **Alternate Rows:** `#F2F2F2` (Light Gray)
- **Total Row Background:** `#366092` (Same as title)
- **Total Row Text:** White, Bold

### Fonts
- **Font Family:** Calibri
- **Title:** Size 14, Bold
- **Headers:** Size 11, Bold
- **Data:** Size 10, Regular
- **Total Row:** Size 11, Bold

### Borders
- All cells have borders
- Headers: Medium top/bottom, Thin sides
- Data: Thin all sides
- Total Row: Medium top/bottom, Thin sides

### Alignment
- **Caller's Name:** Left-aligned
- **Remark:** Left-aligned
- **All other columns:** Center-aligned
- **Headers:** Center-aligned with wrap text

### Row Heights
- **Title Row:** 25
- **Blank Row:** 5
- **Header Row:** 30
- **Data Rows:** 20
- **Total Row:** 25

### Column Widths
| Column | Width |
|--------|-------|
| Caller's Name | 25 |
| Date of Joining | 15 |
| Total Dialed | 12 |
| Connected Calls | 15 |
| Qualified | 12 |
| In Process | 12 |
| VC Scheduled | 13 |
| VC Done | 10 |
| Booking Done | 13 |
| Token Done | 12 |
| Remark | 30 |

### Page Setup
- **Paper Size:** A4
- **Orientation:** Landscape
- **Fit to Page:** Yes (1 page wide)
- **Margins:** 0.5" left/right, 0.75" top/bottom

---

## Usage Examples

### Example 1: Basic Client Template

```javascript
const response = await fetch('/api/reports/generate-client-template', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reportId: 123,
    columnMapping: {
      userName: 'USER NAME',
      calls: 'CALLS',
      cp: 'CP',
      cmdis: 'CMDIS',
      callbk: 'CALLBK',
      vc: 'VC',
    }
  })
});

const result = await response.json();
console.log(`Report generated: ${result.processedReport.fileName}`);
```

### Example 2: Full Configuration

```javascript
const response = await fetch('/api/reports/generate-client-template', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reportId: 123,
    columnMapping: {
      userName: 'USER NAME',
      userId: 'ID',
      dateOfJoining: 'DATE OF JOINING',
      calls: 'CALLS',
      cp: 'CP',
      cmdis: 'CMDIS',
      callbk: 'CALLBK',
      vc: 'VC',
      vcDone: 'VC_COMPLETED',
      bookingDone: 'BOOKINGS',
      tokenDone: 'TOKENS',
      remark: 'NOTES',
      date: 'CALL_DATE'
    },
    customTitle: 'FCS TEAM PERFORMANCE - JANUARY 2024 REPORT'
  })
});

const result = await response.json();

// Download the generated report
window.location.href = `/api/reports/download/${result.processedReport.id}`;
```

---

## Download Generated Report

After generating the client template, download it using the processed report ID:

```
GET /api/reports/download/:id
```

**Example:**
```javascript
// Get the processed report ID from generation response
const processedReportId = result.processedReport.id;

// Download the file
window.location.href = `/api/reports/download/${processedReportId}`;
```

---

## Validation & Error Handling

### Before Calling API
1. ✅ Ensure report is uploaded (have reportId)
2. ✅ Verify column names match your CSV headers
3. ✅ Check that userName and calls columns exist
4. ✅ Authenticate (have valid token)

### Common Issues

**Issue:** "No valid agent data found"
- **Cause:** Column mapping doesn't match CSV headers
- **Solution:** Check CSV column names, update mapping

**Issue:** "Report not found"
- **Cause:** Invalid reportId
- **Solution:** Upload report first, use correct ID

**Issue:** Agents missing in report
- **Cause:** Empty or invalid USER NAME values
- **Solution:** Clean data, ensure no blank agent names

**Issue:** Wrong totals
- **Cause:** Incorrect column mapping for CP, CMDIS, etc.
- **Solution:** Verify mapping matches actual CSV columns

---

## Integration Workflow

### Step 1: Upload CSV
```
POST /api/reports/upload
```
Save the returned `reportId`.

### Step 2: Generate Client Template
```
POST /api/reports/generate-client-template
{
  "reportId": <saved_reportId>,
  "columnMapping": { ... }
}
```
Save the returned `processedReport.id`.

### Step 3: Download Report
```
GET /api/reports/download/:id
```
Use the `processedReport.id` from Step 2.

---

## Testing

### Test with Sample Data

**Sample CSV Structure:**
```csv
USER NAME,ID,DATE OF JOINING,CALLS,CP,CMDIS,CALLBK,VC,REMARKS
Alice Johnson,101,2024-01-15,150,30,25,15,10,Top Performer
Bob Smith,102,2024-01-20,120,20,18,12,8,Good Progress
Charlie Davis,103,2024-02-01,180,35,30,20,12,Excellent
```

**Sample Column Mapping:**
```json
{
  "userName": "USER NAME",
  "userId": "ID",
  "dateOfJoining": "DATE OF JOINING",
  "calls": "CALLS",
  "cp": "CP",
  "cmdis": "CMDIS",
  "callbk": "CALLBK",
  "vc": "VC",
  "remark": "REMARKS"
}
```

**Expected Output:**
- 3 agent rows
- 1 total row
- Total Dialed: 450
- Connected Calls: 235
- Qualified: 73
- Professional formatting

---

## Best Practices

1. **Column Mapping:**
   - Use exact column names from CSV (case-sensitive)
   - Test with small dataset first
   - Verify mapping before large uploads

2. **Data Quality:**
   - Ensure no blank agent names
   - Clean data before upload
   - Handle special characters properly

3. **Performance:**
   - Process large files during off-peak hours
   - Monitor report generation time
   - Cache column mappings for repeated use

4. **Security:**
   - Always use authentication
   - Validate user permissions
   - Sanitize file names

5. **Error Handling:**
   - Check response status codes
   - Log errors for debugging
   - Provide user feedback

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Columns not aligned | Check column mapping keys match exactly |
| Missing agents | Verify USER NAME column has no empty values |
| Wrong calculations | Confirm CP, CMDIS, CALLBK, VC columns are correct |
| Download fails | Ensure processedReport.id is valid |
| Formatting issues | Re-generate report, check Excel version compatibility |
| Date parsing errors | Ensure date column contains valid dates |
| Authentication error | Refresh token, check authorization header |

---

## Output File

### File Name Format
```
Team_Performance_Report_<timestamp>.xlsx
```

### File Location
```
server/uploads/reports/
```

### File Size
Typical size: 50-200 KB depending on number of agents

### Compatibility
- Microsoft Excel 2010+
- Google Sheets
- LibreOffice Calc
- Apple Numbers

---

## Audit Trail

Every client template generation is logged with:
- User ID
- Timestamp
- Report ID
- Agent count
- Date range
- Template type
- IP address
- User agent

Access audit logs:
```
GET /api/admin/audit-logs?action=GENERATE_CLIENT_TEMPLATE
```

---

## Summary

The Client Template Report Generator is designed to produce **management-ready Excel reports** that match the exact format provided by the client. 

### Key Features:
✅ Single sheet: "Till Time"
✅ Exact client format
✅ Professional styling
✅ Automatic aggregation
✅ Print-ready layout
✅ Management-ready output

### Remember:
❌ No dashboards
❌ No analytics
❌ No custom formats
❌ Just the final report

When the client opens the file, it should feel like a **manually prepared team performance report**.

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages
3. Test with sample data
4. Contact system administrator

---

**Last Updated:** June 2026
**Version:** 1.0.0
