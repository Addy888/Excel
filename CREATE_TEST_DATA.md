# Create Test Data for MIS Report Extractor

## Method 1: Create Excel File Manually

Create an Excel file with the following structure:

### Required Columns:
| Agent Name | Call Status | Phone Number | Call Date | Remarks |
|------------|-------------|--------------|-----------|---------|
| John Doe | Connected | 9876543210 | 2024-01-15 | Interested in product |
| Jane Smith | Not Connected | 9876543211 | 2024-01-15 | No answer |
| John Doe | Connected | 9876543212 | 2024-01-15 | Qualified lead |
| Bob Wilson | Connected | 9876543213 | 2024-01-16 | Follow up needed |
| Jane Smith | Connected | 9876543214 | 2024-01-16 | Converted |
| John Doe | Not Connected | 9876543215 | 2024-01-16 | Busy |
| Bob Wilson | Connected | 9876543216 | 2024-01-17 | In process |
| Jane Smith | Connected | 9876543217 | 2024-01-17 | Rejected |
| John Doe | Connected | 9876543210 | 2024-01-17 | Duplicate number |
| Bob Wilson | Not Connected | 9876543218 | 2024-01-18 | No answer |

### Sample Status Values:
- Connected
- Not Connected
- Answered
- Busy
- No Answer
- Qualified
- Interested
- Not Interested
- Converted
- Success
- In Process
- Follow Up
- Rejected

## Method 2: Use Google Sheets

1. Go to Google Sheets
2. Create a new spreadsheet
3. Add the columns and data from above
4. File → Download → Microsoft Excel (.xlsx)

## Method 3: Generate Programmatically

Save this as a separate script if you want to generate test data:

```javascript
const ExcelJS = require('exceljs');

async function generateTestData() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dialer Report');

  // Add headers
  worksheet.columns = [
    { header: 'Agent Name', key: 'agent', width: 20 },
    { header: 'Call Status', key: 'status', width: 20 },
    { header: 'Phone Number', key: 'phone', width: 15 },
    { header: 'Call Date', key: 'date', width: 15 },
    { header: 'Remarks', key: 'remarks', width: 30 },
  ];

  const agents = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson'];
  const statuses = [
    'Connected', 'Not Connected', 'Qualified', 'Interested',
    'Not Interested', 'Converted', 'In Process', 'Rejected'
  ];

  // Generate 100 sample rows
  for (let i = 0; i < 100; i++) {
    worksheet.addRow({
      agent: agents[Math.floor(Math.random() * agents.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      phone: '98765432' + String(i).padStart(2, '0'),
      date: new Date(2024, 0, Math.floor(Math.random() * 30) + 1),
      remarks: 'Sample remark ' + i,
    });
  }

  await workbook.xlsx.writeFile('sample_dialer_report.xlsx');
  console.log('Test data generated: sample_dialer_report.xlsx');
}

generateTestData();
```

## Testing Different Scenarios

### Scenario 1: Basic Report
- 10-20 records
- 2-3 agents
- Mix of statuses
- Same date

### Scenario 2: Multi-Date Report
- 50-100 records
- 4-5 agents
- Multiple dates (1 week)
- Various statuses

### Scenario 3: Large Report
- 500-1000 records
- 10 agents
- Multiple dates (1 month)
- Include duplicates

### Scenario 4: Duplicate Detection
- Same phone numbers repeated
- Different agents calling same number
- Different dates

## Expected Results

After processing, you should see:

### Summary Statistics:
- **Total Dialed**: Count of all rows
- **Connected Calls**: Rows with "Connected" or "Answered"
- **Not Connected**: Rows with "Not Connected", "Busy", "No Answer"
- **Qualified Leads**: Rows with "Qualified" or "Interested"
- **Converted Leads**: Rows with "Converted" or "Success"
- **In Process Leads**: Rows with "In Process" or "Follow"
- **Rejected Leads**: Rows with "Rejected" or "Not Interested"
- **Unique Numbers**: Count of distinct phone numbers
- **Duplicates**: Count of repeated phone numbers

### Generated Sheets:
1. Summary - Overall statistics
2. Agent Summary - Performance by agent
3. Date Summary - Calls by date
4. Status Summary - Distribution by status

## Tips for Testing

1. **Start Small**: Begin with 10-20 records to verify the system works
2. **Test Mappings**: Use different column names to test the mapping feature
3. **Test Duplicates**: Add same phone numbers multiple times
4. **Test Dates**: Use various date formats (Excel date, text date, etc.)
5. **Test Empty Values**: Include some empty cells to test validation

## Sample CSV Format

If you prefer CSV, create a file with this content:

```csv
Agent Name,Call Status,Phone Number,Call Date,Remarks
John Doe,Connected,9876543210,2024-01-15,Interested
Jane Smith,Not Connected,9876543211,2024-01-15,No answer
Bob Wilson,Connected,9876543212,2024-01-16,Qualified
John Doe,Converted,9876543213,2024-01-16,Success
```

Save with UTF-8 encoding as `.csv` file.
