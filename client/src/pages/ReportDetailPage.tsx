import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download } from 'lucide-react';
import api from '@/services/api';
import { formatDate, formatBytes } from '@/lib/utils';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportDetail();
  }, [id]);

  const fetchReportDetail = async () => {
    try {
      console.log('Fetching report detail for ID:', id);
      const response = await api.get(`/reports/${id}`);
      console.log('Report detail response:', response.data);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report detail', error);
      alert('Failed to load report details');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!report?.processedReport) {
      alert('This report has not been processed yet.');
      return;
    }

    try {
      const processedReportId = report.processedReport.id;
      console.log('Downloading processed report ID:', processedReportId);
      
      const response = await api.get(`/reports/download/${processedReportId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MIS_Report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return <div>Report not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/history')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
        {report.processedReport && (
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold">{report.uploadedReport.originalName}</h1>
        <p className="text-muted-foreground mt-1">Detailed report information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">File Name</p>
              <p className="font-medium">{report.uploadedReport.originalName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File Size</p>
              <p className="font-medium">{formatBytes(report.uploadedReport.fileSize)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Records Count</p>
              <p className="font-medium">{report.uploadedReport.recordsCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upload Date</p>
              <p className="font-medium">{formatDate(report.uploadedReport.uploadDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uploaded By</p>
              <p className="font-medium">{report.uploadedReport.uploadedBy?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  report.uploadedReport.status === 'processed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {report.uploadedReport.status.charAt(0).toUpperCase() +
                  report.uploadedReport.status.slice(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        {report.processedReport && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Processed Date</p>
                <p className="font-medium">{formatDate(report.processedReport.processedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processed By</p>
                <p className="font-medium">{report.processedReport.processedBy?.name || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {report.processedReport && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dialed</p>
                  <p className="text-3xl font-bold">
                    {report.processedReport.totalDialed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="text-3xl font-bold text-green-600">
                    {report.processedReport.connectedCalls}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Not Connected</p>
                  <p className="text-3xl font-bold text-red-600">
                    {report.processedReport.notConnectedCalls}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualified</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {report.processedReport.qualifiedLeads}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Converted</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {report.processedReport.convertedLeads}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Process</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {report.processedReport.inProcessLeads}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {report.processedReport.rejectedLeads}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique Numbers</p>
                  <p className="text-3xl font-bold">
                    {report.processedReport.uniqueNumbers}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duplicates</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {report.processedReport.duplicateNumbers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {report.processedReport.agentWiseSummary?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Agent-Wise Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left">Agent</th>
                        <th className="p-3 text-right">Total Calls</th>
                        <th className="p-3 text-right">Connected</th>
                        <th className="p-3 text-right">Not Connected</th>
                        <th className="p-3 text-right">Qualified</th>
                        <th className="p-3 text-right">Converted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.processedReport.agentWiseSummary.map((agent: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-3">{agent.agent}</td>
                          <td className="p-3 text-right">{agent.totalCalls}</td>
                          <td className="p-3 text-right text-green-600">{agent.connected}</td>
                          <td className="p-3 text-right text-red-600">{agent.notConnected}</td>
                          <td className="p-3 text-right">{agent.qualified}</td>
                          <td className="p-3 text-right">{agent.converted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {report.processedReport.statusWiseSummary?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status-Wise Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.processedReport.statusWiseSummary.map(
                        (status: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{status.status}</td>
                            <td className="p-3 text-right font-medium">{status.count}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
