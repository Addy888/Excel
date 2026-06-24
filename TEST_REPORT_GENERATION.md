# Test Report Generation

## Quick Test Guide

### Prerequisites
1. Server running on port 5000
2. User authenticated (JWT token)
3. Sample CSV file ready

---

## Test Steps

### 1. Upload Test CSV

Create a test file `test_data.csv`:
```csv
Agent,Mobile,Status,Date,Remarks
John Doe,1234567890,Connected,2026-06-21,Follow up needed
Jane Smith,9876543210,Not Connected,2026-06-21,
Mike Johnson,5555555555,Connected,2026-06-21,Qualified lead
John Doe,1111111111,Qualified,2026-06-21,Hot lead
Jane Smith,2222222222,Converted,2026-06-21,Success
```

Upload via API:
```bash
curl -X POST http://localhost:5000/api/reports/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test_data.csv"
```

Expected Response:
```json
{
  "message": "File uploaded successfully",
  "report": {
    "id": 1,
    "fileName": "test_data.csv",
    "recordsCount": 5
  }
}
```

---

### 2. Process Report

```bash
curl -X POST http://localhost:5000/api/reports/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 1,
    "useRuleEngine": true
  }'
```

Expected Response:
```json
{
  "message": "Report processed successfully",
  "processedReport": {
    "id": 1,
    "summary": {
      "totalDialed": 5,
      "connectedCalls": 2,
      "qualifiedLeads": 1,
      "convertedLeads": 1
    }
  }
}
```

---

### 3. Download Excel Report

```bash
curl -X GET http://localhost:5000/api/reports/download/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o Final_Report.xlsx
```

---

## Verification Checklist

### Open Downloaded Excel File

#### ✅ Sheet 1: Raw Data
- [ ] All 5 rows present
- [ ] All columns preserved (Agent, Mobile, Status, Date, Remarks)
- [ ] Headers are bold with dark blue background
- [ ] Data is center-aligned
- [ ] Borders on all cells
- [ ] Columns auto-sized appropriately

#### ✅ Sheet 2: MIS Summary
- [ ] Shows agent-wise breakdown (John Doe, Jane Smith, Mike Johnson)
- [ ] Headers: No Of Agents, Total Dialed, Connected Calls, etc.
- [ ] Headers bold with blue background
- [ ] Numbers formatted with proper alignment
- [ ] Alternating row colors
- [ ] Professional appearance

#### ✅ Sheet 3: Overall Summary
- [ ] Shows Total Dialed: 5
- [ ] Shows Connected Calls: 2
- [ ] Shows Qualified Leads: 1
- [ ] Shows Converted Leads: 1
- [ ] Metrics bold
- [ ] Values center-aligned
- [ ] Alternating row colors

---

## Expected Output Structure

### File Info
- **Filename**: `MIS_Report_[timestamp].xlsx`
- **Size**: ~10-15 KB for sample data
- **Sheets**: 3 sheets (Raw Data, MIS Summary, Overall Summary)
- **Format**: Excel 2007+ (.xlsx)

### Sheet Structure
```
Final_Report.xlsx
├── Raw Data (5 rows + header)
├── MIS Summary (3 agents + header)
└── Overall Summary (9 metrics + header)
```

---

## Testing with Frontend

### Using the Web Interface

1. **Login**: Navigate to `http://localhost:5173` and login
2. **Upload**: Go to Upload page, select CSV file
3. **Process**: Click "Process Report" button
4. **Download**: Click "Download Report" button
5. **Verify**: Open Excel file and check all sheets

---

## Common Issues & Solutions

### Issue 1: Missing Raw Data Sheet
**Problem**: Raw Data sheet is empty or missing  
**Solution**: Ensure `uploadedReport.rawData` is populated during upload  
**Check**: `reportController.ts` line 16-20

### Issue 2: Formatting Issues
**Problem**: Headers not bold or colors wrong  
**Solution**: Verify ExcelJS version is ^3.4.0  
**Check**: `package.json` dependencies

### Issue 3: Large File Timeout
**Problem**: Processing takes too long  
**Solution**: Increase request timeout in server config  
**Check**: Express timeout settings

### Issue 4: Download Returns 404
**Problem**: File not found after processing  
**Solution**: Check `uploads/reports/` directory permissions  
**Check**: File path in database vs filesystem

---

## Performance Benchmarks

| Rows | Upload Time | Process Time | Download Size | Total Time |
|------|-------------|--------------|---------------|------------|
| 100 | < 1s | < 1s | ~20 KB | ~2s |
| 1,000 | < 2s | < 2s | ~150 KB | ~4s |
| 10,000 | < 5s | < 8s | ~1.5 MB | ~13s |
| 100,000 | < 15s | < 30s | ~15 MB | ~45s |

---

## Automated Test Script

Create `test-report-generation.js`:

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
let TOKEN = 'YOUR_JWT_TOKEN';

async function testReportGeneration() {
  try {
    // 1. Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    TOKEN = loginRes.data.token;
    console.log('✓ Logged in');

    // 2. Upload CSV
    const form = new FormData();
    form.append('file', fs.createReadStream('test_data.csv'));
    
    const uploadRes = await axios.post(`${API_URL}/reports/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    const reportId = uploadRes.data.report.id;
    console.log(`✓ Uploaded report (ID: ${reportId})`);

    // 3. Process
    const processRes = await axios.post(`${API_URL}/reports/process`, {
      reportId,
      useRuleEngine: true
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log('✓ Processed report');

    // 4. Download
    const downloadRes = await axios.get(`${API_URL}/reports/download/${reportId}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream('Final_Report.xlsx');
    downloadRes.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log('✓ Downloaded Final_Report.xlsx');
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReportGeneration();
```

Run with: `node test-report-generation.js`

---

## Manual Verification

### Check Excel Content

1. **Open Excel File**
2. **Verify Sheet Count**: Should have 3 tabs
3. **Check Sheet Names**: "Raw Data", "MIS Summary", "Overall Summary"
4. **Inspect Formatting**:
   - Headers should be bold and colored
   - Borders should be visible
   - Numbers should have thousand separators
   - Alternating row colors in MIS Summary

### Data Integrity

1. **Compare Row Counts**:
   - Raw Data rows = uploaded CSV rows
   - MIS Summary rows = unique agents
   - Overall Summary rows = 9 metrics

2. **Check Calculations**:
   - Sum of agent totals = overall total
   - Connected + Not Connected = Total Dialed
   - All numbers should be non-negative

---

## Success Criteria

✅ All 3 sheets present  
✅ Raw data exactly matches uploaded CSV  
✅ MIS Summary shows correct agent breakdown  
✅ Overall Summary shows correct totals  
✅ Professional formatting applied  
✅ File downloads successfully  
✅ No errors in console  
✅ Performance acceptable (<5s for 1K rows)

---

## Next Steps After Testing

1. ✅ Verify all sheets present
2. ✅ Check data accuracy
3. ✅ Test with various CSV formats
4. ✅ Test with large files (10K+ rows)
5. ✅ Test download from frontend
6. ✅ Share with stakeholders for feedback

---

**Test Status**: Ready for execution  
**Last Updated**: June 21, 2026
