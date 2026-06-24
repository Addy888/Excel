import React, { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [processedReport, setProcessedReport] = useState<any>(null);

  const handleUploadSuccess = (data: any) => {
    // With the new auto-process workflow, the upload endpoint returns the processed report
    if (data.processedReport) {
      setProcessedReport(data.processedReport);
    }
  };

  if (processedReport) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <CardTitle>Report Generated Successfully!</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Your MIS report has been automatically processed and is ready to download.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dialed</p>
                  <p className="text-2xl font-bold">
                    {processedReport.summary?.totalDialed || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {processedReport.summary?.connectedCalls || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualified Leads</p>
                  <p className="text-2xl font-bold">
                    {processedReport.summary?.qualified || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Converted Leads</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {processedReport.summary?.bookingDone || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  window.open(`/api/reports/download/${processedReport.id}`, '_blank');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Download Report
              </button>
              <button
                onClick={() => navigate('/history')}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                View History
              </button>
              <button
                onClick={() => setProcessedReport(null)}
                className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-accent"
              >
                Upload Another
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Report</h1>
        <p className="text-muted-foreground mt-1">
          Upload your dialer report in Excel or CSV format. The system will automatically detect the format and generate the MIS report.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};
