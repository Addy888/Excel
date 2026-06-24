# Technical Design Document

## High-Level Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Report Generation System              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│    Backend   │────▶│  Processing  │────▶│    Excel     │
│   (Upload)   │     │   (API)      │     │   Engine     │     │  Generator   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │                     │
       │                     │                     │                     │
       ▼                     ▼                     ▼                     ▼
  File Upload         CSV Parser          Agent Aggregator      ExcelJS Formatter
  Validation          Column Mapper       Data Calculator       Template Matcher
  UI Feedback         Error Handler       Total Calculator      File Generator
```

### Component Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                     Client Report Generation Module                    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│  │   Validator  │───▶│ Column_Mapper│───▶│Data_Processor│            │
│  └──────────────┘    └──────────────┘    └──────────────┘            │
│         │                   │                    │                     │
│         │                   │                    │                     │
│         ▼                   ▼                    ▼                     │
│  CSV Validation      Find Required       Agent Aggregation            │
│  Size Check          Columns              Calculate Metrics            │
│  Empty Check         Map to Fields        Group by USER NAME           │
│                                                                         │
│         │                   │                    │                     │
│         │                   │                    │                     │
│         └───────────────────┴────────────────────┘                     │
│                             │                                          │
│                             ▼                                          │
│                  ┌──────────────────┐                                  │
│                  │ Report_Generator │                                  │
│                  └──────────────────┘                                  │
│                             │                                          │
│                             ▼                                          │
│           ┌─────────────────┴─────────────────┐                       │
│           │                                    │                       │
│           ▼                                    ▼                       │
│  ┌─────────────────┐              ┌─────────────────┐                 │
│  │  Excel_Formatter│              │  Template_Builder│                 │
│  └─────────────────┘              └─────────────────┘                 │
│           │                                    │                       │
│           │                                    │                       │
│           └─────────────┬──────────────────────┘                       │
│                         ▼                                              │
│              Team_Performance_Report.xlsx                              │
│              Sheet: "Till Time"                                        │
│                                                                         │
└───────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Uploads CSV
       │
       ▼
┌──────────────────┐
│  File Validation │
│  - Check .csv    │
│  - Check size    │
│  - Check empty   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CSV Parsing     │
│  - Parse headers │
│  - Parse rows    │
│  - Identify cols │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Column Mapping   │
│  - Find USER NAME│
│  - Find CALLS    │
│  - Find CP, etc. │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Agent Aggregation│
│  - Group by NAME │
│  - Sum metrics   │
│  - Calculate     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Template Gen     │
│  - Create sheet  │
│  - Add title     │
│  - Add headers   │
│  - Add data rows │
│  - Add TOTAL row │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Excel Formatting │
│  - Bold headers  │
│  - Borders       │
│  - Colors        │
│  - Alignment     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  File Download   │
│  Team_Performance│
│  _Report.xlsx    │
└──────────────────┘
```

### Integration with Existing System

```
Existing MIS Report Extractor
├── Upload Endpoint: /api/reports/upload
├── Process Endpoint: /api/reports/process
└── Download Endpoint: /api/reports/download/:id

New Client Report Generator
├── Reuses: Upload infrastructure (multer, file validation)
├── Reuses: Database models (UploadedReport, ProcessedReport)
├── Adds: clientReportGenerator.ts (new Excel template generator)
├── Modifies: reportController.ts (add template selection logic)
└── Adds: clientReportProcessor.ts (agent aggregation logic)
```

## Low-Level Design

### Agent Aggregation Algorithm

**Purpose**: Group multiple CSV rows by USER NAME and sum performance metrics

**Input**: Array of CSV row objects
**Output**: Array of aggregated Agent_Record objects

```typescript
interface CSVRow {
  USER_NAME: string;
  ID: string;
  CALLS: number;
  CP: number;
  CMDIS: number;
  CALLBK: number;
  VC: number;
  BUSY: number;
  VM: number;
  VI: number;
}

interface AgentRecord {
  callerName: string;
  dateOfJoining: string;
  totalDialed: number;
  connectedCalls: number;
  qualified: number;
  inProcess: number;
  vcScheduled: number;
  vcDone: string;
  bookingDone: string;
  tokenDone: string;
  remark: string;
}

function aggregateAgentData(csvRows: CSVRow[]): AgentRecord[] {
  // STEP 1: Group rows by USER_NAME
  const agentMap = new Map<string, CSVRow[]>();
  
  for (const row of csvRows) {
    const userName = row.USER_NAME?.trim();
    
    // Skip rows with empty USER_NAME
    if (!userName) {
      console.warn('Skipped row with empty USER_NAME');
      continue;
    }
    
    if (!agentMap.has(userName)) {
      agentMap.set(userName, []);
    }
    
    agentMap.get(userName)!.push(row);
  }
  
  // STEP 2: Aggregate metrics for each agent
  const agentRecords: AgentRecord[] = [];
  
  for (const [userName, rows] of agentMap.entries()) {
    const aggregated = {
      calls: 0,
      cp: 0,
      cmdis: 0,
      callbk: 0,
      vc: 0,
      busy: 0,
      vm: 0,
      vi: 0
    };
    
    // Sum all metrics for this agent
    for (const row of rows) {
      aggregated.calls += parseNumber(row.CALLS);
      aggregated.cp += parseNumber(row.CP);
      aggregated.cmdis += parseNumber(row.CMDIS);
      aggregated.callbk += parseNumber(row.CALLBK);
      aggregated.vc += parseNumber(row.VC);
      aggregated.busy += parseNumber(row.BUSY);
      aggregated.vm += parseNumber(row.VM);
      aggregated.vi += parseNumber(row.VI);
    }
    
    // STEP 3: Calculate derived metrics
    const connectedCalls = aggregated.cp + aggregated.cmdis + 
                          aggregated.callbk + aggregated.vc;
    
    // STEP 4: Create AgentRecord
    const record: AgentRecord = {
      callerName: userName,
      dateOfJoining: '', // Leave blank per requirements
      totalDialed: aggregated.calls,
      connectedCalls: connectedCalls,
      qualified: aggregated.cmdis,
      inProcess: aggregated.callbk,
      vcScheduled: aggregated.vc,
      vcDone: '', // Leave blank per requirements
      bookingDone: '', // Leave blank per requirements
      tokenDone: '', // Leave blank per requirements
      remark: '' // Leave blank per requirements
    };
    
    agentRecords.push(record);
  }
  
  return agentRecords;
}

function parseNumber(value: any): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}
```

### Excel Template Generation Logic

**Purpose**: Create Excel workbook matching client template exactly

```typescript
import ExcelJS from 'exceljs';

async function generateClientReport(
  agentRecords: AgentRecord[],
  startDate: string,
  tillDate: string
): Promise<string> {
  
  // STEP 1: Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Till Time');
  
  // STEP 2: Create title row (row 1)
  const titleText = `FCS TEAM PERFORMANCE - FROM ${startDate} TILL DATE`;
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = titleText;
  titleCell.font = { name: 'Calibri', size: 11, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // STEP 3: Create header row (row 2)
  const headers = [
    "Caller's Name",
    'Date of Joining',
    'Total Dialed',
    'Connected Calls',
    'Qualified',
    'In Process',
    'VC Scheduled',
    'VC Done',
    'Booking Done',
    'Token Done',
    'Remark'
  ];
  
  worksheet.getRow(2).values = headers;
  
  // Style headers
  const headerRow = worksheet.getRow(2);
  headerRow.font = { name: 'Calibri', size: 11, bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' } // Light blue
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // STEP 4: Add agent data rows (starting from row 3)
  let currentRow = 3;
  
  for (const agent of agentRecords) {
    const row = worksheet.getRow(currentRow);
    
    row.values = [
      agent.callerName,
      agent.dateOfJoining,
      agent.totalDialed,
      agent.connectedCalls,
      agent.qualified,
      agent.inProcess,
      agent.vcScheduled,
      agent.vcDone,
      agent.bookingDone,
      agent.tokenDone,
      agent.remark
    ];
    
    // Apply alternating row colors
    if (currentRow % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' } // Light gray
      };
    }
    
    currentRow++;
  }
  
  // STEP 5: Add TOTAL row
  const totalRow = worksheet.getRow(currentRow);
  const totals = calculateTotals(agentRecords);
  
  totalRow.values = [
    'TOTAL',
    '', // Date of Joining blank
    totals.totalDialed,
    totals.connectedCalls,
    totals.qualified,
    totals.inProcess,
    totals.vcScheduled,
    '', // VC Done blank
    '', // Booking Done blank
    '', // Token Done blank
    '' // Remark blank
  ];
  
  totalRow.font = { name: 'Calibri', size: 11, bold: true };
  
  // STEP 6: Apply formatting to all cells
  applyClientFormatting(worksheet, currentRow);
  
  // STEP 7: Save workbook
  const outputPath = './uploads/reports/Team_Performance_Report.xlsx';
  await workbook.xlsx.writeFile(outputPath);
  
  return outputPath;
}

function calculateTotals(agentRecords: AgentRecord[]) {
  return {
    totalDialed: agentRecords.reduce((sum, agent) => sum + agent.totalDialed, 0),
    connectedCalls: agentRecords.reduce((sum, agent) => sum + agent.connectedCalls, 0),
    qualified: agentRecords.reduce((sum, agent) => sum + agent.qualified, 0),
    inProcess: agentRecords.reduce((sum, agent) => sum + agent.inProcess, 0),
    vcScheduled: agentRecords.reduce((sum, agent) => sum + agent.vcScheduled, 0)
  };
}
```

### Formatting Functions

```typescript
function applyClientFormatting(worksheet: ExcelJS.Worksheet, lastRow: number) {
  // Define column widths
  worksheet.columns = [
    { width: 25 }, // Caller's Name
    { width: 15 }, // Date of Joining
    { width: 12 }, // Total Dialed
    { width: 15 }, // Connected Calls
    { width: 12 }, // Qualified
    { width: 12 }, // In Process
    { width: 14 }, // VC Scheduled
    { width: 10 }, // VC Done
    { width: 14 }, // Booking Done
    { width: 12 }, // Token Done
    { width: 20 }  // Remark
  ];
  
  // Apply borders to all cells with data
  for (let row = 1; row <= lastRow; row++) {
    for (let col = 1; col <= 11; col++) {
      const cell = worksheet.getCell(row, col);
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      // Set font
      if (!cell.font) {
        cell.font = { name: 'Calibri', size: 11 };
      }
      
      // Set alignment based on column
      if (col === 1 || col === 2 || col === 11) {
        // Text columns: left align
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        // Numeric columns: center align
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
  }
  
  // Freeze header row
  worksheet.views = [
    { state: 'frozen', ySplit: 2 }
  ];
  
  // Set page setup for printing
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0 // Allow multiple pages vertically if needed
  };
}
```

### API Endpoints Design

```typescript
// New endpoint for client template generation
router.post('/process-client-template', 
  authenticateToken, 
  processClientTemplate
);

async function processClientTemplate(req: AuthRequest, res: Response) {
  try {
    const { reportId } = req.body;
    
    // 1. Fetch uploaded report
    const uploadedReport = await prisma.uploadedReport.findUnique({
      where: { id: parseInt(reportId, 10) }
    });
    
    if (!uploadedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // 2. Parse CSV data
    const csvRows = uploadedReport.rawData as CSVRow[];
    
    // 3. Aggregate agent data
    const agentRecords = aggregateAgentData(csvRows);
    
    // 4. Get date range
    const startDate = findEarliestDate(csvRows);
    const tillDate = new Date().toISOString().split('T')[0];
    
    // 5. Generate client template Excel
    const outputPath = await generateClientReport(
      agentRecords,
      startDate,
      tillDate
    );
    
    // 6. Save to database
    const processedReport = await prisma.processedReport.create({
      data: {
        uploadedReportId: uploadedReport.id,
        processedById: req.user!.id,
        generatedFilePath: outputPath,
        totalDialed: calculateSum(agentRecords, 'totalDialed'),
        connectedCalls: calculateSum(agentRecords, 'connectedCalls'),
        qualifiedLeads: calculateSum(agentRecords, 'qualified'),
        agentWiseSummary: agentRecords
      }
    });
    
    res.json({
      message: 'Client report generated successfully',
      processedReport: {
        id: processedReport.id,
        filePath: outputPath
      }
    });
    
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Report generation failed', 
      error: error.message 
    });
  }
}
```

### File Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── clientReportController.ts    (NEW - handles client template)
│   ├── routes/
│   │   └── clientReportRoutes.ts        (NEW - /api/client-report/*)
│   ├── utils/
│   │   ├── clientReportGenerator.ts     (NEW - ExcelJS template builder)
│   │   ├── clientReportProcessor.ts     (NEW - agent aggregation)
│   │   └── excelGenerator.ts            (EXISTING - keep for other reports)
│   └── services/
│       └── clientTemplateService.ts     (NEW - business logic)
│
└── uploads/
    └── reports/
        └── Team_Performance_Report.xlsx  (OUTPUT)
```

### Error Handling Strategy

```typescript
class ClientReportError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ClientReportError';
  }
}

// Usage in processing
try {
  if (csvRows.length === 0) {
    throw new ClientReportError(
      'EMPTY_FILE',
      'No data rows found in CSV file',
      400
    );
  }
  
  if (!hasRequiredColumns(csvRows[0])) {
    throw new ClientReportError(
      'MISSING_COLUMNS',
      'Required columns USER NAME or CALLS not found',
      400
    );
  }
  
  const agentRecords = aggregateAgentData(csvRows);
  
  if (agentRecords.length === 0) {
    throw new ClientReportError(
      'NO_VALID_AGENTS',
      'No valid agent records found after processing',
      400
    );
  }
  
} catch (error) {
  if (error instanceof ClientReportError) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message
    });
  }
  
  // Unexpected errors
  console.error('Unexpected error:', error);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  });
}
```

## Design Decisions

### Decision 1: Single-Purpose Template Generator

**Choice**: Create separate `clientReportGenerator.ts` instead of modifying existing `excelGenerator.ts`

**Rationale**:
- Existing generator creates multi-sheet reports with Raw Data, MIS Summary, etc.
- Client template requires completely different structure (single sheet, specific layout)
- Separation prevents breaking existing functionality
- Easier to maintain and test independently

### Decision 2: Agent Aggregation by USER NAME Only

**Choice**: Group CSV rows by USER NAME (exact string match), ignoring ID field

**Rationale**:
- Requirements specify "Each USER NAME becomes one row"
- ID may vary for same agent in different CSV exports
- USER NAME is more stable identifier in client context
- Simplifies aggregation logic

### Decision 3: ExcelJS for Template Generation

**Choice**: Use ExcelJS library instead of xlsx library

**Rationale**:
- ExcelJS provides better styling control (colors, borders, fonts)
- Supports cell merging needed for title row
- Can freeze panes for header row
- Better page setup control for printing
- Already installed in project dependencies

### Decision 4: Empty Fields by Design

**Choice**: Leave Date of Joining, VC Done, Booking Done, Token Done, Remark fields blank

**Rationale**:
- CSV doesn't contain these fields
- Client template shows these columns but data comes from other systems
- Requirements specify "Leave blank per requirements"
- Maintains template structure for manual data entry if needed

### Decision 5: Landscape Orientation

**Choice**: Set page orientation to landscape by default

**Rationale**:
- 11 columns fit better horizontally
- Matches professional MIS report standards
- Easier to read on desktop monitors
- Better for printing on A4/Letter paper

## Performance Considerations

### Memory Management

```typescript
// For large CSV files (10,000+ rows), use streaming
async function streamCSVProcessing(filePath: string): Promise<AgentRecord[]> {
  const agentMap = new Map<string, CSVRow[]>();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const userName = row.USER_NAME?.trim();
        if (!userName) return;
        
        if (!agentMap.has(userName)) {
          agentMap.set(userName, []);
        }
        agentMap.get(userName)!.push(row);
      })
      .on('end', () => {
        const aggregated = Array.from(agentMap.entries()).map(
          ([userName, rows]) => aggregateRows(userName, rows)
        );
        resolve(aggregated);
      })
      .on('error', reject);
  });
}
```

### Optimization for Large Datasets

- Use Map for O(1) agent lookup during aggregation
- Process CSV in chunks for files > 50MB
- Generate Excel incrementally instead of building in memory
- Limit TOTAL calculation to single pass over aggregated data

## Testing Strategy

### Unit Tests

```typescript
describe('Client Report Generator', () => {
  describe('aggregateAgentData', () => {
    it('should group multiple rows by USER_NAME', () => {
      const input = [
        { USER_NAME: 'John Doe', CALLS: 50, CP: 30, CMDIS: 20, CALLBK: 10, VC: 5 },
        { USER_NAME: 'John Doe', CALLS: 30, CP: 20, CMDIS: 15, CALLBK: 5, VC: 3 },
        { USER_NAME: 'Jane Smith', CALLS: 40, CP: 25, CMDIS: 18, CALLBK: 8, VC: 4 }
      ];
      
      const result = aggregateAgentData(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].callerName).toBe('John Doe');
      expect(result[0].totalDialed).toBe(80);
      expect(result[0].connectedCalls).toBe(88); // 50+35+25+8
    });
    
    it('should skip rows with empty USER_NAME', () => {
      const input = [
        { USER_NAME: '', CALLS: 50 },
        { USER_NAME: 'John Doe', CALLS: 30 }
      ];
      
      const result = aggregateAgentData(input);
      
      expect(result).toHaveLength(1);
    });
  });
  
  describe('generateClientReport', () => {
    it('should create single worksheet named "Till Time"', async () => {
      const agentRecords = [
        { callerName: 'John Doe', totalDialed: 80, connectedCalls: 50, qualified: 35, inProcess: 25, vcScheduled: 8 }
      ];
      
      const filePath = await generateClientReport(agentRecords, '2024-01-01', '2024-01-31');
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      expect(workbook.worksheets).toHaveLength(1);
      expect(workbook.worksheets[0].name).toBe('Till Time');
    });
    
    it('should create TOTAL row with correct sums', async () => {
      const agentRecords = [
        { callerName: 'John', totalDialed: 80, connectedCalls: 50, qualified: 35, inProcess: 25, vcScheduled: 8 },
        { callerName: 'Jane', totalDialed: 60, connectedCalls: 40, qualified: 28, inProcess: 18, vcScheduled: 6 }
      ];
      
      const filePath = await generateClientReport(agentRecords, '2024-01-01', '2024-01-31');
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      const totalRow = worksheet.getRow(5); // Row 1: title, Row 2: header, Row 3-4: data, Row 5: TOTAL
      expect(totalRow.getCell(1).value).toBe('TOTAL');
      expect(totalRow.getCell(3).value).toBe(140); // 80 + 60
    });
  });
});
```

### Integration Tests

- Test full flow from CSV upload to Excel download
- Verify Excel file structure matches client template
- Test with various CSV formats and edge cases
- Validate formatting applied correctly

