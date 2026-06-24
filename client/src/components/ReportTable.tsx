import React from 'react';
import { formatDate, formatBytes } from '@/lib/utils';
import { Download, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/Button';

interface Report {
  id: number;
  originalName: string;
  recordsCount: number;
  uploadDate: string;
  status: string;
  fileSize: number;
  uploadedBy?: {
    name: string;
    email: string;
  };
}

interface ReportTableProps {
  reports: Report[];
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports = [],
  onView,
  onDownload,
  onDelete,
  isAdmin,
}) => {
  // Ensure reports is always an array
  const safeReports = Array.isArray(reports) ? reports : [];

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      uploaded: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-4 text-left font-medium">File Name</th>
            <th className="p-4 text-left font-medium">Records</th>
            <th className="p-4 text-left font-medium">Size</th>
            <th className="p-4 text-left font-medium">Upload Date</th>
            <th className="p-4 text-left font-medium">Status</th>
            <th className="p-4 text-left font-medium">Uploaded By</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {safeReports.map((report) => (
            <tr key={report.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-4">{report.originalName || 'N/A'}</td>
              <td className="p-4">{(report.recordsCount || 0).toLocaleString()}</td>
              <td className="p-4">{formatBytes(report.fileSize || 0)}</td>
              <td className="p-4">{formatDate(report.uploadDate)}</td>
              <td className="p-4">{getStatusBadge(report.status || 'unknown')}</td>
              <td className="p-4">{report.uploadedBy?.name || 'N/A'}</td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onView(report.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {report.status === 'processed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(report.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {safeReports.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">No reports found</div>
      )}
    </div>
  );
};
