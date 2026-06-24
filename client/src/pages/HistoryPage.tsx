import React, { useEffect, useState } from 'react';
import { ReportTable } from '@/components/ReportTable';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchReports();
  }, [pagination.page, search]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search,
        },
      });

      const data = response.data || {};
      console.log('Fetched reports response:', data);
      
      // Backend returns data.data, not data.reports
      const reportsArray = Array.isArray(data.data) ? data.data : [];
      console.log('Reports array:', reportsArray);
      console.log('First report structure:', reportsArray[0]);
      
      setReports(reportsArray);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
      });
    } catch (error) {
      console.error('Failed to fetch reports', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: number) => {
    try {
      console.log('Download clicked for report ID:', reportId);
      const reportResponse = await api.get(`/reports/${reportId}`);
      console.log('Report details:', reportResponse.data);
      
      if (reportResponse.data.processedReport) {
        const processedReportId = reportResponse.data.processedReport.id;
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
      } else {
        console.error('No processed report found for report ID:', reportId);
        alert('This report has not been processed yet. Please process it first.');
      }
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download report');
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      console.log('Deleting report ID:', reportId);
      await api.delete(`/reports/${reportId}`);
      console.log('Delete successful');
      fetchReports();
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete report');
    }
  };

  const handleView = (reportId: number) => {
    console.log('View clicked for report ID:', reportId);
    navigate(`/report/${reportId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchReports();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report History</h1>
        <p className="text-muted-foreground mt-1">View and manage all uploaded reports</p>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <>
            <ReportTable
              reports={reports}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDelete}
              isAdmin={user.role === 'admin'}
            />

            {pagination.pages > 1 && (
              <div className="p-6 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {reports.length} of {pagination.total} reports
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page === pagination.pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
