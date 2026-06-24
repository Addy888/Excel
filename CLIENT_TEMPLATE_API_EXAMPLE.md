# Client Template API - Frontend Integration Examples

## Complete Integration Example

### 1. Update API Service (client/src/services/api.ts)

Add the client template generation method to your existing API service:

```typescript
// Add to existing api.ts file

export interface ClientTemplateColumnMapping {
  userName: string;
  userId?: string;
  dateOfJoining?: string;
  calls: string;
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

export interface GenerateClientTemplateRequest {
  reportId: number;
  columnMapping: ClientTemplateColumnMapping;
  customTitle?: string;
}

export interface GenerateClientTemplateResponse {
  success: boolean;
  message: string;
  processedReport: {
    id: number;
    filePath: string;
    fileName: string;
    agentCount: number;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    summary: {
      totalDialed: number;
      connectedCalls: number;
      qualified: number;
      inProcess: number;
      vcScheduled: number;
      vcDone: number;
      bookingDone: number;
      tokenDone: number;
    };
  };
}

// Generate Client Template Report
export const generateClientTemplate = async (
  data: GenerateClientTemplateRequest
): Promise<GenerateClientTemplateResponse> => {
  const response = await apiClient.post('/reports/generate-client-template', data);
  return response.data;
};

// Download Generated Report
export const downloadClientReport = async (processedReportId: number): Promise<void> => {
  const response = await apiClient.get(`/reports/download/${processedReportId}`, {
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Team_Performance_Report_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
```

---

## 2. Create Client Template Component

### ClientTemplateGenerator.tsx

```typescript
import React, { useState } from 'react';
import { 
  generateClientTemplate, 
  downloadClientReport,
  ClientTemplateColumnMapping 
} from '../services/api';

interface ClientTemplateGeneratorProps {
  reportId: number;
  csvHeaders: string[]; // Headers from uploaded CSV
  onSuccess?: () => void;
}

const ClientTemplateGenerator: React.FC<ClientTemplateGeneratorProps> = ({
  reportId,
  csvHeaders,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ClientTemplateColumnMapping>({
    userName: '',
    calls: '',
  });
  const [customTitle, setCustomTitle] = useState('');

  const handleMappingChange = (field: keyof ClientTemplateColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!columnMapping.userName || !columnMapping.calls) {
        throw new Error('User Name and Calls columns are required');
      }

      // Generate report
      const result = await generateClientTemplate({
        reportId,
        columnMapping,
        customTitle: customTitle || undefined,
      });

      setSuccess(true);

      // Auto-download after 1 second
      setTimeout(async () => {
        await downloadClientReport(result.processedReport.id);
        onSuccess?.();
      }, 1000);

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-template-generator">
      <h2>Generate Client Template Report</h2>
      <p className="description">
        This will generate a Team Performance Report matching the exact client template format.
      </p>

      <div className="mapping-section">
        <h3>Column Mapping</h3>
        
        {/* Required Fields */}
        <div className="mapping-group required">
          <h4>Required Fields</h4>
          
          <div className="form-field">
            <label>User Name Column *</label>
            <select
              value={columnMapping.userName}
              onChange={(e) => handleMappingChange('userName', e.target.value)}
              required
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Total Calls Column *</label>
            <select
              value={columnMapping.calls}
              onChange={(e) => handleMappingChange('calls', e.target.value)}
              required
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="mapping-group optional">
          <h4>Optional Fields</h4>
          
          <div className="form-field">
            <label>User ID Column</label>
            <select
              value={columnMapping.userId || ''}
              onChange={(e) => handleMappingChange('userId', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Date of Joining Column</label>
            <select
              value={columnMapping.dateOfJoining || ''}
              onChange={(e) => handleMappingChange('dateOfJoining', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>CP Column</label>
            <select
              value={columnMapping.cp || ''}
              onChange={(e) => handleMappingChange('cp', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>CMDIS Column (Qualified)</label>
            <select
              value={columnMapping.cmdis || ''}
              onChange={(e) => handleMappingChange('cmdis', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>CALLBK Column (In Process)</label>
            <select
              value={columnMapping.callbk || ''}
              onChange={(e) => handleMappingChange('callbk', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>VC Column (VC Scheduled)</label>
            <select
              value={columnMapping.vc || ''}
              onChange={(e) => handleMappingChange('vc', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>VC Done Column</label>
            <select
              value={columnMapping.vcDone || ''}
              onChange={(e) => handleMappingChange('vcDone', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Booking Done Column</label>
            <select
              value={columnMapping.bookingDone || ''}
              onChange={(e) => handleMappingChange('bookingDone', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Token Done Column</label>
            <select
              value={columnMapping.tokenDone || ''}
              onChange={(e) => handleMappingChange('tokenDone', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Remark Column</label>
            <select
              value={columnMapping.remark || ''}
              onChange={(e) => handleMappingChange('remark', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Date Column (for date range calculation)</label>
            <select
              value={columnMapping.date || ''}
              onChange={(e) => handleMappingChange('date', e.target.value)}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Title */}
        <div className="form-field">
          <label>Custom Report Title (Optional)</label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Leave blank for auto-generated title"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-message">
          <strong>Success!</strong> Report generated successfully. Downloading...
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !columnMapping.userName || !columnMapping.calls}
        className="btn-generate"
      >
        {loading ? 'Generating...' : 'Generate Client Template Report'}
      </button>

      {/* Info Box */}
      <div className="info-box">
        <h4>ℹ️ Important</h4>
        <ul>
          <li>Only the final client report will be generated</li>
          <li>Sheet name: "Till Time"</li>
          <li>Format matches exact client template</li>
          <li>No dashboards or analytics sheets</li>
          <li>Management-ready, print-ready output</li>
        </ul>
      </div>
    </div>
  );
};

export default ClientTemplateGenerator;
```

---

## 3. Integrate into Upload Page

### UploadPage.tsx Integration

```typescript
import React, { useState } from 'react';
import { uploadReport } from '../services/api';
import ClientTemplateGenerator from '../components/ClientTemplateGenerator';

const UploadPage: React.FC = () => {
  const [uploadedReportId, setUploadedReportId] = useState<number | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadReport(formData);
    
    setUploadedReportId(result.report.id);
    setCsvHeaders(result.headers);
    setShowGenerator(true);
  };

  return (
    <div className="upload-page">
      <h1>Upload Agent Performance Data</h1>

      {/* File upload section */}
      {!uploadedReportId && (
        <FileUploader onUpload={handleUpload} />
      )}

      {/* Client template generator */}
      {showGenerator && uploadedReportId && (
        <ClientTemplateGenerator
          reportId={uploadedReportId}
          csvHeaders={csvHeaders}
          onSuccess={() => {
            // Reset or redirect after success
            setShowGenerator(false);
            setUploadedReportId(null);
          }}
        />
      )}
    </div>
  );
};

export default UploadPage;
```

---

## 4. Quick Usage Example

### Simple API Call

```typescript
import { generateClientTemplate, downloadClientReport } from './services/api';

async function generateReport() {
  try {
    // Generate report
    const result = await generateClientTemplate({
      reportId: 123,
      columnMapping: {
        userName: 'USER NAME',
        calls: 'CALLS',
        cp: 'CP',
        cmdis: 'CMDIS',
        callbk: 'CALLBK',
        vc: 'VC',
      },
    });

    console.log('Report generated:', result.processedReport.fileName);
    console.log('Agent count:', result.processedReport.agentCount);
    console.log('Date range:', result.processedReport.dateRange);

    // Download immediately
    await downloadClientReport(result.processedReport.id);

  } catch (error) {
    console.error('Generation failed:', error);
  }
}
```

---

## 5. React Hook for Client Template

### useClientTemplate.ts

```typescript
import { useState } from 'react';
import { 
  generateClientTemplate, 
  downloadClientReport,
  ClientTemplateColumnMapping 
} from '../services/api';

export const useClientTemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const generate = async (
    reportId: number,
    columnMapping: ClientTemplateColumnMapping,
    customTitle?: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateClientTemplate({
        reportId,
        columnMapping,
        customTitle,
      });

      setResult(response.processedReport);
      return response.processedReport;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const download = async (processedReportId: number) => {
    try {
      await downloadClientReport(processedReportId);
    } catch (err: any) {
      setError('Failed to download report');
      throw err;
    }
  };

  return {
    loading,
    error,
    result,
    generate,
    download,
  };
};
```

**Usage:**

```typescript
const MyComponent = () => {
  const { loading, error, result, generate, download } = useClientTemplate();

  const handleGenerate = async () => {
    try {
      const report = await generate(123, {
        userName: 'USER NAME',
        calls: 'CALLS',
      });

      await download(report.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Report'}
      </button>
      {error && <p className="error">{error}</p>}
      {result && <p>Report: {result.fileName}</p>}
    </div>
  );
};
```

---

## 6. Column Mapping Presets

Save common mappings for quick reuse:

```typescript
export const COLUMN_MAPPING_PRESETS = {
  standard: {
    userName: 'USER NAME',
    userId: 'ID',
    calls: 'CALLS',
    cp: 'CP',
    cmdis: 'CMDIS',
    callbk: 'CALLBK',
    vc: 'VC',
  },
  extended: {
    userName: 'USER NAME',
    userId: 'ID',
    dateOfJoining: 'DATE OF JOINING',
    calls: 'CALLS',
    cp: 'CP',
    cmdis: 'CMDIS',
    callbk: 'CALLBK',
    vc: 'VC',
    vcDone: 'VC_DONE',
    bookingDone: 'BOOKING',
    tokenDone: 'TOKEN',
    remark: 'REMARKS',
    date: 'DATE',
  },
};
```

---

## Summary

The Client Template API integration is straightforward:

1. **Upload CSV** → Get reportId and headers
2. **Map Columns** → Match CSV headers to template fields
3. **Generate Report** → Call API with mapping
4. **Download** → Auto-download Excel file

The generated Excel file will match the exact client template format with professional styling and management-ready output.
