# Report Transformation Calculations & Test Data

## Sample Input Data

### AGENT_PERFORMANCE_DETAIL CSV (25 Agents)

```csv
AgentName,TotalCalls,CP,CMDIS,CALLBK,BUSY,VM,VIO,DND,OTHER
John Doe,150,45,20,15,30,25,10,3,2
Jane Smith,200,80,35,25,30,20,8,1,1
Bob Wilson,180,60,28,18,35,25,12,1,1
Alice Johnson,165,52,24,19,32,22,14,2,0
Mike Brown,140,38,18,14,28,26,13,2,1
```

---

## Default Transformation Rules

```javascript
[
  { statusColumn: 'CP', targetMetric: 'Connected', category: 'connected' },
  { statusColumn: 'CMDIS', targetMetric: 'Qualified', category: 'qualified' },
  { statusColumn: 'CALLBK', targetMetric: 'In Process', category: 'in_process' },
  { statusColumn: 'BUSY', targetMetric: 'Busy', category: 'not_connected' },
  { statusColumn: 'VM', targetMetric: 'Voice Mail', category: 'not_connected' },
  { statusColumn: 'VIO', targetMetric: 'VIO', category: 'not_connected' }
]
```

---

## Calculation Logic

### 1. Total Dialed

```
Total Dialed = Sum of TotalCalls for all agents
```

**Formula:**
```
= John(150) + Jane(200) + Bob(180) + Alice(165) + Mike(140) + ... (all 25 agents)
= 4,305 calls
```

### 2. Connected Calls

```
Connected Calls = Sum of all columns in 'connected' category
```

**Formula:**
```
= Sum of CP column
= John(45) + Jane(80) + Bob(60) + Alice(52) + Mike(38) + ... (all 25 agents)
= 1,513 calls
```

### 3. Qualified Leads

```
Qualified = Sum of all columns in 'qualified' category
```

**Formula:**
```
= Sum of CMDIS column
= John(20) + Jane(35) + Bob(28) + Alice(24) + Mike(18) + ... (all 25 agents)
= 686 leads
```

### 4. In Process Leads

```
In Process = Sum of all columns in 'in_process' category
```

**Formula:**
```
= Sum of CALLBK column
= John(15) + Jane(25) + Bob(18) + Alice(19) + Mike(14) + ... (all 25 agents)
= 508 leads
```

### 5. Not Connected

```
Not Connected = Sum of all columns in 'not_connected' category
```

**Formula:**
```
= Sum(BUSY + VM + VIO)
= BUSY: John(30) + Jane(30) + ... = 776
  VM: John(25) + Jane(20) + ... = 538
  VIO: John(10) + Jane(8) + ... = 253
= 776 + 538 + 253 = 1,567 calls
```

### 6. Active Agents

```
Active Agents = Count of agents where TotalCalls > 0
```

**Formula:**
```
= Count where TotalCalls > 0
= 25 agents (all agents in sample have calls)
```

### 7. Connection Rate

```
Connection Rate % = (Connected Calls / Total Dialed) × 100
```

**Formula:**
```
= (1,513 / 4,305) × 100
= 35.14%
```

### 8. Qualification Rate

```
Qualification Rate % = (Qualified / Connected Calls) × 100
```

**Formula:**
```
= (686 / 1,513) × 100
= 45.34%
```

### 9. Conversion Rate (if configured)

```
Conversion Rate % = (Converted / Qualified) × 100
```

---

## Expected Output - MIS Summary Sheet

| Category | No Of Agent | Total Dialed | Connected Calls | Qualified | In Process | VC Scheduled | VC Done | Booking Done | Token Done | Remark |
|----------|-------------|--------------|-----------------|-----------|------------|--------------|---------|--------------|------------|--------|
| Overall  | 25          | 4,305        | 1,513           | 686       | 508        | 0            | 0       | 0            | 0          | Auto-generated report |

---

## Expected Output - Day Wise Sheet (Sample 5 Agents)

| Date       | Agent         | Total Dialed | Connected Calls | Qualified | In Process | VC Scheduled | VC Done | Booking Done | Token Done |
|------------|---------------|--------------|-----------------|-----------|------------|--------------|---------|--------------|------------|
| 2024-01-15 | John Doe      | 150          | 45              | 20        | 15         | 0            | 0       | 0            | 0          |
| 2024-01-15 | Jane Smith    | 200          | 80              | 35        | 25         | 0            | 0       | 0            | 0          |
| 2024-01-15 | Bob Wilson    | 180          | 60              | 28        | 18         | 0            | 0       | 0            | 0          |
| 2024-01-15 | Alice Johnson | 165          | 52              | 24        | 19         | 0            | 0       | 0            | 0          |
| 2024-01-15 | Mike Brown    | 140          | 38              | 18        | 14         | 0            | 0       | 0            | 0          |

---

## Expected Output - Month Wise Sheet

| Year | Month   | Total Agents | Total Dialed | Connected Calls | Qualified | In Process | VC Scheduled | VC Done | Booking Done | Token Done |
|------|---------|--------------|--------------|-----------------|-----------|------------|--------------|---------|--------------|------------|
| 2024 | January | 25           | 4,305        | 1,513           | 686       | 508        | 0            | 0       | 0            | 0          |

---

## Expected Output - Till Time Sheet

| Report Type          | Total Agents | Total Dialed | Connected Calls | Qualified | In Process | VC Scheduled | VC Done | Booking Done | Token Done | Connection Rate % | Qualification Rate % |
|----------------------|--------------|--------------|-----------------|-----------|------------|--------------|---------|--------------|------------|-------------------|----------------------|
| Cumulative Till Date | 25           | 4,305        | 1,513           | 686       | 508        | 0            | 0       | 0            | 0          | 35.14             | 45.34                |

---

## Agent-Level Calculation Example

### Agent: John Doe

**Input Data:**
```
TotalCalls: 150
CP: 45
CMDIS: 20
CALLBK: 15
BUSY: 30
VM: 25
VIO: 10
DND: 3
OTHER: 2
```

**Calculated Metrics:**
```
Total Dialed:    150
Connected:       45  (CP)
Qualified:       20  (CMDIS)
In Process:      15  (CALLBK)
Not Connected:   65  (BUSY: 30 + VM: 25 + VIO: 10)
Other:           5   (DND: 3 + OTHER: 2)

Connection Rate: (45/150) × 100 = 30.00%
Qualification Rate: (20/45) × 100 = 44.44%
Process Rate: (15/20) × 100 = 75.00%
```

---

## Custom Rule Example

### Scenario: Healthcare Campaign

**Custom Rules:**
```javascript
[
  { statusColumn: 'CP', targetMetric: 'Connected', category: 'connected' },
  { statusColumn: 'INTERESTED', targetMetric: 'Interested', category: 'qualified' },
  { statusColumn: 'CALLBACK', targetMetric: 'Callback', category: 'in_process' },
  { statusColumn: 'VC_SCH', targetMetric: 'VC Scheduled', category: 'vc_scheduled' },
  { statusColumn: 'VC_DONE', targetMetric: 'VC Completed', category: 'vc_done' },
  { statusColumn: 'BOOKING', targetMetric: 'Appointment Booked', category: 'booking_done' },
  { statusColumn: 'TOKEN', targetMetric: 'Token Generated', category: 'token_done' }
]
```

**Modified Input CSV:**
```csv
AgentName,TotalCalls,CP,INTERESTED,CALLBACK,VC_SCH,VC_DONE,BOOKING,TOKEN,BUSY,VM
Dr. Smith Team,250,90,45,30,20,15,12,10,40,25
```

**Calculated Output:**
```
Total Dialed:     250
Connected:        90  (CP)
Qualified:        45  (INTERESTED)
In Process:       30  (CALLBACK)
VC Scheduled:     20  (VC_SCH)
VC Done:          15  (VC_DONE)
Booking Done:     12  (BOOKING)
Token Done:       10  (TOKEN)
Not Connected:    65  (BUSY: 40 + VM: 25)
```

---

## Validation Rules

### Data Integrity Checks

1. **Sum Validation**
```
CP + CMDIS + CALLBK + BUSY + VM + VIO + DND + OTHER = TotalCalls
```

2. **Range Validation**
```
All metrics >= 0
TotalCalls >= 0
Connected <= TotalCalls
Qualified <= Connected
```

3. **Agent Validation**
```
AgentName must not be empty
AgentName must be unique per row
```

4. **Rate Validation**
```
Connection Rate = 0-100%
Qualification Rate = 0-100%
```

---

## Test Cases

### Test Case 1: Basic Transformation

**Input:**
```javascript
{
  "uploadedReportId": 1,
  "reportDate": "2024-01-15"
}
```

**Expected Output:**
```javascript
{
  "success": true,
  "data": {
    "processedReportId": 123,
    "outputPath": "MIS_Report_1234567890.xlsx"
  }
}
```

**Verification:**
- ✅ Excel file created
- ✅ 5 sheets present (MIS Summary, Day Wise, Month Wise, Till Time, Rule Mapping)
- ✅ All metrics calculated correctly
- ✅ Formatting applied (colors, borders, alignment)

### Test Case 2: Custom Rules

**Input:**
```javascript
{
  "uploadedReportId": 1,
  "customRules": [
    { statusColumn: 'CP', targetMetric: 'Connected', category: 'connected' },
    { statusColumn: 'NEW_COL', targetMetric: 'New Metric', category: 'qualified' }
  ]
}
```

**Expected Output:**
```javascript
{
  "success": true
}
```

**Verification:**
- ✅ Custom rules applied
- ✅ NEW_COL mapped to Qualified category
- ✅ Summary reflects custom mapping

### Test Case 3: Preview Mode

**Input:**
```javascript
{
  "uploadedReportId": 1
}
```

**Expected Output:**
```javascript
{
  "success": true,
  "data": {
    "summary": [...],
    "dayWiseSample": [...],
    "totalAgents": 25,
    "previewNote": "Preview shows first 100 rows only"
  }
}
```

**Verification:**
- ✅ Only first 100 rows processed
- ✅ Fast response time (<2 seconds)
- ✅ Summary metrics calculated

### Test Case 4: Empty Data

**Input:**
```csv
AgentName,TotalCalls,CP,CMDIS,CALLBK
```

**Expected Output:**
```javascript
{
  "success": true,
  "data": {
    "summary": {
      "noOfAgent": 0,
      "totalDialed": 0,
      "connectedCalls": 0
    }
  }
}
```

**Verification:**
- ✅ Handles empty data gracefully
- ✅ All metrics = 0
- ✅ No errors thrown

### Test Case 5: Missing Columns

**Input:**
```csv
AgentName,TotalCalls,CP
John Doe,150,45
```

**Expected Output:**
```javascript
{
  "success": true,
  "data": {
    "summary": {
      "connectedCalls": 45,
      "qualified": 0,  // Missing CMDIS column
      "inProcess": 0   // Missing CALLBK column
    }
  }
}
```

**Verification:**
- ✅ Missing columns treated as 0
- ✅ No errors thrown
- ✅ Available data processed correctly

---

## Performance Benchmarks

### Expected Performance

| Data Size | Processing Time | Memory Usage |
|-----------|-----------------|--------------|
| 25 rows   | < 1 second      | ~10 MB       |
| 100 rows  | < 2 seconds     | ~15 MB       |
| 1,000 rows| < 5 seconds     | ~50 MB       |
| 10,000 rows| < 30 seconds   | ~200 MB      |

### Optimization Tips

1. **Use Preview Mode** for large datasets during testing
2. **Enable Database Caching** for transformation rules
3. **Batch Processing** for reports > 10,000 rows
4. **Async Processing** for background report generation

---

## Complete Sample Data

Full 25-agent sample data is available at:
```
sample-data/agent_performance_sample.csv
```

Total metrics for complete dataset:
- **Total Agents**: 25
- **Total Dialed**: 4,305 calls
- **Connected**: 1,513 calls (35.14%)
- **Qualified**: 686 leads (45.34% of connected)
- **In Process**: 508 leads (74.05% of qualified)

---

## Excel Formatting Details

### Header Colors
- **MIS Summary**: Blue (#4472C4)
- **Day Wise**: Green (#70AD47)
- **Month Wise**: Orange (#FFC000)
- **Till Time**: Red-Orange (#ED7D31)
- **Rule Mapping**: Purple (#A569BD)

### Cell Formatting
- **Borders**: Thin black borders on all cells
- **Alignment**: Headers centered, data left-aligned
- **Font**: Headers bold 11pt, data regular 10pt
- **Header Text**: White color on colored background
- **Row Height**: Header 20px, data auto

### Column Widths
- **Auto-calculated** based on content
- **Minimum**: 10 characters
- **Maximum**: 50 characters
- **Padding**: +2 characters for readability

---

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Report transformed successfully",
  "data": {
    "processedReportId": 456,
    "outputPath": "MIS_Report_1705334400000.xlsx",
    "downloadUrl": "/api/reports/download/456",
    "summary": {
      "totalAgents": 25,
      "totalDialed": 4305,
      "connectedCalls": 1513,
      "qualified": 686,
      "inProcess": 508
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Uploaded report not found",
  "error": "Report with ID 999 does not exist",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

**Last Updated**: June 21, 2026  
**Test Data Version**: 1.0.0
