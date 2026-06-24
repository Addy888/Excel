# Client Template - Quick Reference Card

## 🎯 Purpose
Generate **ONLY** the final client report matching exact template format.
- ✅ One Excel file
- ✅ One sheet: "Till Time"
- ✅ Management-ready
- ❌ No dashboards
- ❌ No analytics

---

## 🚀 Quick Start

### 1. Upload CSV
```bash
POST /api/reports/upload
Content-Type: multipart/form-data

file: [CSV file]
```

### 2. Generate Report
```bash
POST /api/reports/generate-client-template
Content-Type: application/json

{
  "reportId": 123,
  "columnMapping": {
    "userName": "USER NAME",
    "calls": "CALLS",
    "cp": "CP",
    "cmdis": "CMDIS",
    "callbk": "CALLBK",
    "vc": "VC"
  }
}
```

### 3. Download
```bash
GET /api/reports/download/:processedReportId
```

---

## 📊 Column Mappings

### Required
| Field | Description | Example CSV Column |
|-------|-------------|-------------------|
| `userName` | Agent name | `USER NAME` |
| `calls` | Total calls | `CALLS` |

### Optional
| Field | Description | Formula |
|-------|-------------|---------|
| `userId` | Agent ID | - |
| `dateOfJoining` | Join date | - |
| `cp` | Connected - Personal | Part of Connected |
| `cmdis` | Qualified leads | = Qualified |
| `callbk` | Callbacks | = In Process |
| `vc` | VC scheduled | = VC Scheduled |
| `vcDone` | VC completed | Custom |
| `bookingDone` | Bookings | Custom |
| `tokenDone` | Tokens | Custom |
| `remark` | Notes | - |
| `date` | Date column | For range calc |

---

## 🧮 Formulas

```
Total Dialed = CALLS

Connected Calls = CP + CMDIS + CALLBK + VC

Qualified = CMDIS

In Process = CALLBK

VC Scheduled = VC
```

---

## 📋 Output Format

```
Row 1: Title (merged)
Row 2: Blank (5px)
Row 3: Headers
Row 4+: Data rows (one per agent)
Last Row: TOTAL (bold, colored)
```

### Columns (11 total)
1. Caller's Name
2. Date of Joining
3. Total Dialed
4. Connected Calls
5. Qualified
6. In Process
7. VC Scheduled
8. VC Done
9. Booking Done
10. Token Done
11. Remark

---

## 🎨 Styling

| Element | Style |
|---------|-------|
| Title | Blue #366092, White text, Bold 14pt |
| Headers | Blue #4472C4, White text, Bold 11pt |
| Data | Calibri 10pt, Alternating gray rows |
| Total | Blue #366092, White text, Bold 11pt |
| Borders | All cells |
| Page | A4 Landscape |

---

## ⚠️ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 400: Missing fields | No reportId/mapping | Add both |
| 400: No valid data | Wrong column names | Check CSV headers |
| 404: Not found | Invalid reportId | Upload first |

---

## 💡 Tips

1. **Case-Sensitive:** Column names must match exactly
2. **Aggregation:** Multiple rows per agent = summed
3. **Date Range:** Auto-calculated from date column
4. **Custom Title:** Optional, auto-generated if blank
5. **Download:** Immediate after generation

---

## 📝 Example Request

```json
{
  "reportId": 456,
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
  },
  "customTitle": "FCS TEAM PERFORMANCE - JUNE 2024"
}
```

---

## 📈 Example Response

```json
{
  "success": true,
  "message": "Client template report generated successfully",
  "processedReport": {
    "id": 789,
    "fileName": "Team_Performance_Report_1719187200000.xlsx",
    "agentCount": 25,
    "dateRange": {
      "startDate": "01-06-2024",
      "endDate": "30-06-2024"
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

---

## 🔗 Related Files

- **Generator:** `server/src/utils/clientTemplateGenerator.ts`
- **Controller:** `server/src/controllers/reportController.ts`
- **Routes:** `server/src/routes/reportRoutes.ts`
- **Full Guide:** `CLIENT_TEMPLATE_GUIDE.md`
- **API Examples:** `CLIENT_TEMPLATE_API_EXAMPLE.md`
- **Testing:** `CLIENT_TEMPLATE_TEST_GUIDE.md`

---

## 🛠️ TypeScript Types

```typescript
interface ClientTemplateColumnMapping {
  userName: string;          // Required
  calls: string;             // Required
  userId?: string;
  dateOfJoining?: string;
  cp?: string;
  cmdis?: string;
  callbk?: string;
  vc?: string;
  vcDone?: string;
  bookingDone?: string;
  tokenDone?: string;
  remark?: string;
  date?: string;
}

interface AgentData {
  userName: string;
  userId: string;
  dateOfJoining?: string;
  totalDialed: number;
  connectedCalls: number;
  qualified: number;
  inProcess: number;
  vcScheduled: number;
  vcDone: number;
  bookingDone: number;
  tokenDone: number;
  remark?: string;
}
```

---

## 🧪 Test It

```bash
# Upload
curl -X POST http://localhost:3000/api/reports/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@data.csv"

# Generate
curl -X POST http://localhost:3000/api/reports/generate-client-template \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 1,
    "columnMapping": {
      "userName": "USER NAME",
      "calls": "CALLS"
    }
  }'

# Download
curl -O http://localhost:3000/api/reports/download/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Validation Checklist

Before generating:
- [ ] CSV uploaded
- [ ] Column names verified
- [ ] userName column has data
- [ ] calls column has numbers
- [ ] Token is valid

After generating:
- [ ] Response has processedReport.id
- [ ] agentCount > 0
- [ ] dateRange present
- [ ] Download works
- [ ] Excel opens correctly

---

## 📞 Support

**Issue?** Check:
1. Error message in response
2. Column mapping matches CSV
3. ReportId is valid
4. Token not expired
5. Network connection

**Still stuck?** Review full documentation in `CLIENT_TEMPLATE_GUIDE.md`

---

**Quick Ref v1.0** | Last Updated: June 2026
