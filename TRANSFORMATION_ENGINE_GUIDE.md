# Report Transformation Engine Documentation

## Overview

The Report Transformation Engine converts **AGENT_PERFORMANCE_DETAIL CSV** reports into **MIS Excel** format matching the CP Caller format layout. It provides configurable rule mappings that allow administrators to define how CSV columns map to MIS metrics without changing code.

---

## Features

### ✅ Core Capabilities

1. **CSV Parsing**: Reads AGENT_PERFORMANCE_DETAIL CSV reports
2. **Data Extraction**: Extracts Agent Name, Total Calls, and all status columns (CP, CMDIS, CALLBK, BUSY, VM, VIO, etc.)
3. **Metric Calculation**: Calculates aggregated metrics based on configurable rules
4. **Excel Generation**: Creates formatted Excel with multiple sheets
5. **Rule Configuration**: Admin-configurable mappings without code changes

### 📊 Generated Sheets

1. **MIS Summary Sheet**: Overall metrics with agent count
2. **Day Wise Sheet**: Daily breakdown by agent
3. **Month Wise Sheet**: Monthly aggregated data
4. **Till Time Sheet**: Cumulative statistics with rates
5. **Rule Mapping Panel**: Visual reference of current transformation rules

### 🎨 Excel Formatting

- ✅ Merged headers
- ✅ Bold titles
- ✅ Borders on all cells
- ✅ Auto-width columns
- ✅ Center alignment
- ✅ Color-coded headers (matching CP Caller format)
- ✅ Frozen header rows

---

## Architecture

### File Structure

```
server/src/
├── services/
│   └── ReportTransformationEngine.ts  # Core transformation logic
├── controllers/
│   └── transformationController.ts     # API endpoints
└── routes/
    └── transformationRoutes.ts         # Route definitions
```

### Data Flow

```
CSV Upload → Parse Data → Apply Rules → Calculate Metrics → Generate Excel
     ↓           ↓            ↓              ↓               ↓
Database    Extract     Transform      Aggregate        Format
Storage     Columns     Columns        Results          & Style
```

---

## Transformation Rules

### Rule Structure

```typescript
interface TransformationRule {
  statusColumn: string;   // CSV column name (e.g., "CP")
  targetMetric: string;   // Display name (e.g., "Connected")
  category: string;       // Metric category
}
```

### Categories

| Category       | Description                    | Example Columns |
|----------------|--------------------------------|-----------------|
| `connected`    | Connected calls                | CP, ANSWERED    |
| `qualified`    | Qualified leads                | CMDIS, INTERESTED |
| `in_process`   | In-process leads               | CALLBK, FOLLOW  |
| `vc_scheduled` | Video consultation scheduled   | VC_SCH          |
| `vc_done`      | Video consultation completed   | VC_DONE         |
| `booking_done` | Booking completed              | BOOKING         |
| `token_done`   | Token generated                | TOKEN           |
| `not_connected`| Not connected calls            | BUSY, VM, VIO   |

### Default Rules

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

## API Endpoints

### 1. Transform Report

**POST** `/api/transform/agent-performance`

Transform CSV to MIS Excel format.

**Request Body:**
```json
{
  "uploadedReportId": 123,
  "customRules": [
    {
      "statusColumn": "CP",
      "targetMetric": "Connected",
      "category": "connected"
    }
  ],
  "reportDate": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report transformed successfully",
  "data": {
    "processedReportId": 456,
    "outputPath": "MIS_Report_1234567890.xlsx",
    "downloadUrl": "/api/reports/download/456"
  }
}
```

### 2. Get Transformation Rules

**GET** `/api/transform/rules`

Retrieve current transformation rules.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "statusColumn": "CP",
      "targetMetric": "Connected",
      "category": "connected"
    }
  ]
}
```

### 3. Update Transformation Rules

**PUT** `/api/transform/rules`

Update transformation rules (admin only).

**Request Body:**
```json
{
  "rules": [
    {
      "statusColumn": "CP",
      "targetMetric": "Connected Calls",
      "category": "connected"
    },
    {
      "statusColumn": "NEW_STATUS",
      "targetMetric": "Custom Metric",
      "category": "qualified"
    }
  ]
}
```

### 4. Preview Transformation

**POST** `/api/transform/preview`

Preview transformation without saving (first 100 rows).

**Request Body:**
```json
{
  "uploadedReportId": 123,
  "customRules": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": [
      {
        "category": "Overall",
        "noOfAgent": 25,
        "totalDialed": 1500,
        "connectedCalls": 850,
        "qualified": 320,
        "inProcess": 180
      }
    ],
    "dayWiseSample": [...],
    "totalAgents": 25,
    "previewNote": "Preview shows first 100 rows only"
  }
}
```

### 5. Get Sample Rules

**GET** `/api/transform/sample-rules`

Get sample rules and available categories for reference.

---

## Usage Examples

### Example 1: Basic Transformation

```javascript
// Upload CSV
const formData = new FormData();
formData.append('file', csvFile);
const uploadResponse = await fetch('/api/reports/upload', {
  method: 'POST',
  body: formData
});
const { uploadedReportId } = uploadResponse.data;

// Transform to MIS Excel
const transformResponse = await fetch('/api/transform/agent-performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadedReportId: uploadedReportId,
    reportDate: '2024-01-15'
  })
});

// Download result
const { downloadUrl } = transformResponse.data;
window.location.href = downloadUrl;
```

### Example 2: Custom Rule Mapping

```javascript
// Define custom rules
const customRules = [
  { statusColumn: 'CP', targetMetric: 'Connected', category: 'connected' },
  { statusColumn: 'INTERESTED', targetMetric: 'Qualified', category: 'qualified' },
  { statusColumn: 'CALLBACK', targetMetric: 'In Process', category: 'in_process' },
  { statusColumn: 'VC_SCH', targetMetric: 'VC Scheduled', category: 'vc_scheduled' },
  { statusColumn: 'VC_DONE', targetMetric: 'VC Done', category: 'vc_done' }
];

// Transform with custom rules
await fetch('/api/transform/agent-performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadedReportId: uploadedReportId,
    customRules: customRules
  })
});
```

### Example 3: Update Global Rules (Admin)

```javascript
// Update rules for all future transformations
await fetch('/api/transform/rules', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rules: customRules
  })
});
```

---

## Sample Data Structure

### Input CSV Format

```csv
AgentName,TotalCalls,CP,CMDIS,CALLBK,BUSY,VM,VIO
John Doe,150,45,20,15,30,25,15
Jane Smith,200,80,35,25,30,20,10
Bob Wilson,180,60,28,18,35,25,14
```

### Output Excel - MIS Summary Sheet

| Category | No Of Agent | Total Dialed | Connected Calls | Qualified | In Process | VC Scheduled | VC Done | Booking Done | Token Done | Remark |
|----------|-------------|--------------|-----------------|-----------|------------|--------------|---------|--------------|------------|--------|
| Overall  | 3           | 530          | 185             | 83        | 58         | 0            | 0       | 0            | 0          | Auto-generated |

### Output Excel - Day Wise Sheet

| Date       | Agent      | Total Dialed | Connected Calls | Qualified | In Process | VC Scheduled | VC Done | Booking Done | Token Done |
|------------|------------|--------------|-----------------|-----------|------------|--------------|---------|--------------|------------|
| 2024-01-15 | John Doe   | 150          | 45              | 20        | 15         | 0            | 0       | 0            | 0          |
| 2024-01-15 | Jane Smith | 200          | 80              | 35        | 25         | 0            | 0       | 0            | 0          |
| 2024-01-15 | Bob Wilson | 180          | 60              | 28        | 18         | 0            | 0       | 0            | 0          |

---

## Formula Logic

### Metric Calculations

```typescript
// Total Dialed
totalDialed = Sum of all agent TotalCalls

// Connected Calls
connectedCalls = Sum of all columns mapped to 'connected' category
// Example: CP + ANSWERED + ...

// Qualified
qualified = Sum of all columns mapped to 'qualified' category
// Example: CMDIS + INTERESTED + ...

// In Process
inProcess = Sum of all columns mapped to 'in_process' category
// Example: CALLBK + FOLLOW + ...

// Active Agents
noOfAgent = Count of agents where TotalCalls > 0

// Connection Rate %
connectionRate = (connectedCalls / totalDialed) * 100

// Qualification Rate %
qualificationRate = (qualified / connectedCalls) * 100
```

---

## Configuration Guide

### Step 1: Access Rule Configuration

Navigate to **Admin Panel → Transformation Rules** or use API endpoint `/api/transform/rules`

### Step 2: Define Rules

1. Identify CSV column names from your report
2. Choose appropriate category for each column
3. Define display name for the metric

### Step 3: Save Rules

```javascript
const rules = [
  { statusColumn: 'YOUR_COLUMN', targetMetric: 'Display Name', category: 'category_name' }
];

await updateRules(rules);
```

### Step 4: Test Transformation

Use preview endpoint to test before full transformation:

```javascript
const preview = await fetch('/api/transform/preview', {
  method: 'POST',
  body: JSON.stringify({ uploadedReportId, customRules: rules })
});
```

---

## Future Report Formats

The engine is designed to support additional report formats:

### Adding New Format Support

1. **Create new parser method** in `ReportTransformationEngine.ts`
2. **Define format-specific rules** in database
3. **Add new controller endpoint** for the format
4. **Update rule categories** if needed

### Example: Adding CRM Report Format

```typescript
// In ReportTransformationEngine.ts
parseCRMPerformanceData(csvData: any[]): CRMPerformanceRow[] {
  return csvData.map(row => ({
    agentName: row.AgentName,
    leadsAssigned: row.LeadsAssigned,
    leadsContacted: row.LeadsContacted,
    leadsConverted: row.LeadsConverted
  }));
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `uploadedReportId is required` | Missing report ID | Provide valid uploaded report ID |
| `Uploaded report not found` | Invalid report ID | Verify report exists in database |
| `rules must be an array` | Invalid rules format | Provide rules as array of objects |
| `Each rule must have statusColumn, targetMetric, and category` | Incomplete rule definition | Include all required fields |

### Validation

- ✅ Report ID existence validation
- ✅ Rule structure validation
- ✅ Category validation against allowed values
- ✅ CSV data format validation

---

## Performance Considerations

- **Preview Mode**: Processes only first 100 rows for quick feedback
- **Async Processing**: Large reports processed asynchronously
- **Database Caching**: Rules cached in database for performance
- **Batch Processing**: Efficient batch operations for large datasets

---

## Testing

### Sample Test Cases

```javascript
// Test 1: Basic transformation
test('Transform agent performance report', async () => {
  const result = await transformAgentPerformance(uploadedReportId);
  expect(result.success).toBe(true);
  expect(result.data.processedReportId).toBeDefined();
});

// Test 2: Custom rules
test('Transform with custom rules', async () => {
  const customRules = [
    { statusColumn: 'CP', targetMetric: 'Connected', category: 'connected' }
  ];
  const result = await transformAgentPerformance(uploadedReportId, customRules);
  expect(result.success).toBe(true);
});

// Test 3: Preview transformation
test('Preview transformation', async () => {
  const preview = await previewTransformation(uploadedReportId);
  expect(preview.data.summary).toBeDefined();
  expect(preview.data.totalAgents).toBeGreaterThan(0);
});
```

---

## Files Modified

### New Files Created

1. `server/src/services/ReportTransformationEngine.ts` - Core engine
2. `server/src/controllers/transformationController.ts` - API controller
3. `server/src/routes/transformationRoutes.ts` - API routes
4. `TRANSFORMATION_ENGINE_GUIDE.md` - This documentation

### Files to be Modified

1. `server/src/server.ts` - Register transformation routes
2. `client/src/pages/UploadPage.tsx` - Add transformation UI
3. `client/src/services/api.ts` - Add transformation API methods

---

## Integration Steps

### Server Integration

```typescript
// In server/src/server.ts
import transformationRoutes from './routes/transformationRoutes';

app.use('/api/transform', transformationRoutes);
```

### Client Integration

```typescript
// In client/src/services/api.ts
export const transformAgentPerformance = async (data: any) => {
  return apiClient.post('/transform/agent-performance', data);
};

export const getTransformationRules = async () => {
  return apiClient.get('/transform/rules');
};

export const updateTransformationRules = async (rules: any[]) => {
  return apiClient.put('/transform/rules', { rules });
};
```

---

## Summary

The Report Transformation Engine provides:

✅ **Flexible**: Admin-configurable rules without code changes  
✅ **Scalable**: Supports future report formats  
✅ **Formatted**: Professional Excel output matching CP Caller format  
✅ **Comprehensive**: Multiple sheet types (Summary, Day Wise, Month Wise, Till Time)  
✅ **Testable**: Preview mode for validation  
✅ **Documented**: Complete API and usage documentation  

---

## Support

For issues or questions:
- Check API documentation: `/api/transform/sample-rules`
- Review transformation rules: `/api/transform/rules`
- Test with preview: `/api/transform/preview`

---

**Last Updated**: June 21, 2026  
**Version**: 1.0.0
