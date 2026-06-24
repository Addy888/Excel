# Client Template Testing Guide

## Test Data Setup

### Sample CSV File

Create a test CSV file with the following structure:

**test-agent-performance.csv**

```csv
USER NAME,ID,DATE OF JOINING,DATE,CALLS,CP,CMDIS,CALLBK,VC,REMARKS
John Doe,101,2024-01-15,2024-06-01,150,30,25,15,10,Excellent performance
John Doe,101,2024-01-15,2024-06-02,120,25,20,10,8,Good follow-up
Jane Smith,102,2024-02-01,2024-06-01,180,40,35,20,12,Top performer
Jane Smith,102,2024-02-01,2024-06-02,160,35,30,18,10,Consistent results
Alice Johnson,103,2024-02-15,2024-06-01,140,28,22,12,9,Steady improvement
Bob Williams,104,2024-03-01,2024-06-01,100,20,15,8,5,New team member
Charlie Brown,105,2024-03-10,2024-06-01,130,26,20,11,7,Good potential
David Lee,106,2024-03-15,2024-06-01,110,22,18,9,6,Learning curve
Emma Davis,107,2024-04-01,2024-06-01,145,29,24,13,8,Strong performance
Frank Miller,108,2024-04-05,2024-06-01,125,25,19,10,7,Reliable agent
```

---

## Test Scenarios

### Test 1: Basic Generation (Minimal Mapping)

**Objective:** Generate report with only required fields

**API Request:**
```json
POST /api/reports/generate-client-template

{
  "reportId": 1,
  "columnMapping": {
    "userName": "USER NAME",
    "calls": "CALLS"
  }
}
```

**Expected Result:**
- ✅ Report generates successfully
- ✅ All agents listed (8 unique agents)
- ✅ Total Dialed calculated correctly
- ✅ Connected Calls = 0 (no CP, CMDIS, etc. mapped)
- ✅ Other columns show 0
- ✅ TOTAL row present and correct

**Validation:**
```
John Doe: Total Dialed = 270 (150 + 120)
Jane Smith: Total Dialed = 340 (180 + 160)
...
TOTAL: Total Dialed = 1260
```

---

### Test 2: Full Mapping

**Objective:** Generate report with all columns mapped

**API Request:**
```json
POST /api/reports/generate-client-template

{
  "reportId": 1,
  "columnMapping": {
    "userName": "USER NAME",
    "userId": "ID",
    "dateOfJoining": "DATE OF JOINING",
    "calls": "CALLS",
    "cp": "CP",
    "cmdis": "CMDIS",
    "callbk": "CALLBK",
    "vc": "VC",
    "remark": "REMARKS",
    "date": "DATE"
  }
}
```

**Expected Result:**
- ✅ All columns populated
- ✅ Date of Joining shown for each agent
- ✅ Connected Calls = CP + CMDIS + CALLBK + VC
- ✅ Qualified = CMDIS
- ✅ In Process = CALLBK
- ✅ VC Scheduled = VC
- ✅ Remarks shown (last remark for each agent)
- ✅ Date range calculated: 01-06-2024 to 02-06-2024

**Validation:**
```
John Doe:
  Total Dialed = 270
  Connected Calls = 30+25+15+10 + 25+20+10+8 = 143
  Qualified = 25 + 20 = 45
  In Process = 15 + 10 = 25
  VC Scheduled = 10 + 8 = 18

Jane Smith:
  Total Dialed = 340
  Connected Calls = 40+35+20+12 + 35+30+18+10 = 200
  ...
```

---

### Test 3: Custom Title

**Objective:** Generate report with custom title

**API Request:**
```json
POST /api/reports/generate-client-template

{
  "reportId": 1,
  "columnMapping": {
    "userName": "USER NAME",
    "calls": "CALLS",
    "cp": "CP",
    "cmdis": "CMDIS",
    "callbk": "CALLBK",
    "vc": "VC"
  },
  "customTitle": "FCS TEAM PERFORMANCE - JUNE 2024 MONTHLY REPORT"
}
```

**Expected Result:**
- ✅ Title row shows custom title
- ✅ All other formatting intact

---

### Test 4: Missing Agent Names

**Objective:** Verify handling of invalid data

**Test CSV:**
```csv
USER NAME,CALLS
John Doe,100
,50
Unknown,75
Jane Smith,120
```

**Expected Result:**
- ✅ Empty USER NAME rows skipped
- ✅ "Unknown" rows skipped (if configured)
- ✅ Only valid agents in output (John Doe, Jane Smith)
- ✅ Total = 220 (100 + 120)

---

### Test 5: Duplicate Agent Aggregation

**Objective:** Verify proper aggregation of multiple records

**Test CSV:**
```csv
USER NAME,CALLS,CP,CMDIS
Alice,50,10,8
Alice,60,12,9
Alice,70,14,10
```

**Expected Result:**
- ✅ Single row for Alice
- ✅ Total Dialed = 180 (50 + 60 + 70)
- ✅ Connected Calls = (10+8) + (12+9) + (14+10) = 63
- ✅ Qualified = 8 + 9 + 10 = 27

---

### Test 6: Error Handling - Missing reportId

**API Request:**
```json
POST /api/reports/generate-client-template

{
  "columnMapping": {
    "userName": "USER NAME",
    "calls": "CALLS"
  }
}
```

**Expected Response:**
```json
{
  "message": "Missing required fields: reportId and columnMapping are required"
}
```
**Status Code:** 400

---

### Test 7: Error Handling - Invalid Column Mapping

**API Request:**
```json
POST /api/reports/generate-client-template

{
  "reportId": 1,
  "columnMapping": {
    "userName": "WRONG_COLUMN",
    "calls": "CALLS"
  }
}
```

**Expected Response:**
```json
{
  "message": "No valid agent data found. Please check column mappings."
}
```
**Status Code:** 400

---

### Test 8: Error Handling - Report Not Found

**API Request:**
```json
POST /api/reports/generate-client-template

{
  "reportId": 99999,
  "columnMapping": {
    "userName": "USER NAME",
    "calls": "CALLS"
  }
}
```

**Expected Response:**
```json
{
  "message": "Report not found"
}
```
**Status Code:** 404

---

## Manual Testing Checklist

### Visual Inspection

Open the generated Excel file and verify:

#### Title Row (Row 1)
- [ ] Merged across all columns (A1:K1)
- [ ] Text: "FCS TEAM PERFORMANCE - FROM [DATE] TILL [DATE]"
- [ ] Background color: Dark blue (#366092)
- [ ] Text color: White
- [ ] Font: Calibri, 14pt, Bold
- [ ] Alignment: Centered
- [ ] Height: 25

#### Blank Row (Row 2)
- [ ] Height: 5
- [ ] No content

#### Header Row (Row 3)
- [ ] All 11 columns present
- [ ] Column names correct and spelled properly
- [ ] Background color: Blue (#4472C4)
- [ ] Text color: White
- [ ] Font: Calibri, 11pt, Bold
- [ ] Alignment: Centered
- [ ] Height: 30
- [ ] Borders: Medium top/bottom, Thin sides

#### Data Rows
- [ ] One row per agent
- [ ] No duplicate agents
- [ ] No blank agent names
- [ ] Numeric columns show numbers (not text)
- [ ] Caller's Name: Left-aligned
- [ ] Date of Joining: Center-aligned
- [ ] All numeric columns: Center-aligned
- [ ] Remark: Left-aligned
- [ ] Alternate row colors (light gray every other row)
- [ ] All cells have borders
- [ ] Row height: 20

#### Total Row (Last Row)
- [ ] First column shows "TOTAL"
- [ ] All numeric columns show correct sums
- [ ] Background color: Dark blue (#366092)
- [ ] Text color: White
- [ ] Font: Calibri, 11pt, Bold
- [ ] Borders: Medium top/bottom
- [ ] Height: 25

#### Column Widths
- [ ] Caller's Name: 25
- [ ] Date of Joining: 15
- [ ] Total Dialed: 12
- [ ] Connected Calls: 15
- [ ] Qualified: 12
- [ ] In Process: 12
- [ ] VC Scheduled: 13
- [ ] VC Done: 10
- [ ] Booking Done: 13
- [ ] Token Done: 12
- [ ] Remark: 30

#### Page Setup
- [ ] Paper size: A4
- [ ] Orientation: Landscape
- [ ] Fit to 1 page wide
- [ ] Print area set correctly
- [ ] Margins appropriate

---

## Automated Testing

### Unit Tests

Create unit tests for the processing functions:

**clientTemplateGenerator.test.ts**

```typescript
import {
  processRawDataForClientTemplate,
  calculateDateRange,
} from '../utils/clientTemplateGenerator';

describe('Client Template Generator', () => {
  test('should aggregate agent data correctly', () => {
    const rawData = [
      { 'USER NAME': 'John', 'CALLS': '100', 'CP': '20', 'CMDIS': '15' },
      { 'USER NAME': 'John', 'CALLS': '150', 'CP': '30', 'CMDIS': '25' },
    ];

    const mapping = {
      userName: 'USER NAME',
      calls: 'CALLS',
      cp: 'CP',
      cmdis: 'CMDIS',
    };

    const result = processRawDataForClientTemplate(rawData, mapping);

    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('John');
    expect(result[0].totalDialed).toBe(250);
    expect(result[0].qualified).toBe(40);
  });

  test('should skip invalid agent names', () => {
    const rawData = [
      { 'USER NAME': 'John', 'CALLS': '100' },
      { 'USER NAME': '', 'CALLS': '50' },
      { 'USER NAME': 'Jane', 'CALLS': '120' },
    ];

    const mapping = {
      userName: 'USER NAME',
      calls: 'CALLS',
    };

    const result = processRawDataForClientTemplate(rawData, mapping);

    expect(result).toHaveLength(2);
    expect(result.map(a => a.userName)).toEqual(['Jane', 'John']);
  });

  test('should calculate date range correctly', () => {
    const rawData = [
      { 'DATE': '2024-06-01' },
      { 'DATE': '2024-06-15' },
      { 'DATE': '2024-06-30' },
    ];

    const result = calculateDateRange(rawData, 'DATE');

    expect(result.startDate).toBe('01-06-2024');
    expect(result.endDate).toBe('30-06-2024');
  });
});
```

---

## Integration Testing

### End-to-End Test Flow

1. **Upload CSV**
   ```bash
   curl -X POST http://localhost:3000/api/reports/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-agent-performance.csv"
   ```

2. **Generate Client Template**
   ```bash
   curl -X POST http://localhost:3000/api/reports/generate-client-template \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "reportId": 1,
       "columnMapping": {
         "userName": "USER NAME",
         "calls": "CALLS",
         "cp": "CP",
         "cmdis": "CMDIS",
         "callbk": "CALLBK",
         "vc": "VC"
       }
     }'
   ```

3. **Download Report**
   ```bash
   curl -X GET http://localhost:3000/api/reports/download/1 \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -o Team_Performance_Report.xlsx
   ```

4. **Verify File**
   - Open in Excel
   - Check all formatting
   - Verify calculations
   - Test printing

---

## Performance Testing

### Large Dataset Test

Create a CSV with 1000+ agents:

```python
import csv

with open('large-test-data.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['USER NAME', 'CALLS', 'CP', 'CMDIS', 'CALLBK', 'VC'])
    
    for i in range(1, 1001):
        writer.writerow([
            f'Agent {i}',
            100 + i,
            20 + (i % 10),
            15 + (i % 8),
            10 + (i % 5),
            5 + (i % 3)
        ])
```

**Expected Results:**
- ✅ Generation completes within 10 seconds
- ✅ File size < 500 KB
- ✅ Excel opens without issues
- ✅ All 1000 agents present
- ✅ Totals calculated correctly

---

## Browser Compatibility Testing

Test download functionality in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Excel Compatibility Testing

Open generated files in:
- [ ] Microsoft Excel 2016+
- [ ] Microsoft Excel Online
- [ ] Google Sheets
- [ ] LibreOffice Calc
- [ ] Apple Numbers

Verify:
- [ ] Formatting intact
- [ ] Colors displayed correctly
- [ ] Borders visible
- [ ] Formulas work (if any)
- [ ] Can print properly

---

## Security Testing

- [ ] Authentication required (401 without token)
- [ ] User can only access their reports
- [ ] File paths sanitized
- [ ] No SQL injection in column mapping
- [ ] No XSS in custom title
- [ ] Audit log created

---

## Regression Testing

After any changes, re-run:
1. Basic generation (Test 1)
2. Full mapping (Test 2)
3. Error handling (Tests 6-8)
4. Visual inspection checklist
5. Download test

---

## Test Results Template

```markdown
## Test Execution Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [Dev/Staging/Production]

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Basic Generation | ✅ Pass | - |
| Test 2: Full Mapping | ✅ Pass | - |
| Test 3: Custom Title | ✅ Pass | - |
| Test 4: Missing Agents | ✅ Pass | - |
| Test 5: Aggregation | ✅ Pass | - |
| Test 6: Missing reportId | ✅ Pass | - |
| Test 7: Invalid Mapping | ✅ Pass | - |
| Test 8: Report Not Found | ✅ Pass | - |
| Visual Inspection | ✅ Pass | All formatting correct |
| Performance Test | ✅ Pass | 1000 agents in 8s |
| Excel Compatibility | ✅ Pass | Tested in Excel 2021 |

### Issues Found
None

### Recommendations
None
```

---

## Debugging Tips

### Issue: No agents in output
- Check column mapping keys match CSV headers exactly
- Verify CSV has data rows
- Look for leading/trailing spaces in headers

### Issue: Wrong calculations
- Verify column names in mapping
- Check data types (numbers as strings?)
- Review aggregation logic

### Issue: Formatting broken
- Check ExcelJS version compatibility
- Verify color codes (ARGB format)
- Test in different Excel versions

### Issue: Download fails
- Check file permissions on uploads/reports
- Verify file path exists
- Check disk space

---

## Sign-Off Checklist

Before deploying to production:

- [ ] All 8 test scenarios pass
- [ ] Visual inspection complete
- [ ] Performance acceptable (<10s for 1000 agents)
- [ ] Excel compatibility verified
- [ ] Browser compatibility verified
- [ ] Security testing passed
- [ ] Documentation reviewed
- [ ] API examples tested
- [ ] Error messages user-friendly
- [ ] Audit logging working

---

**Testing Complete:** ___________
**Approved By:** ___________
**Date:** ___________
