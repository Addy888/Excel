import React, { useEffect, useState } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { ReportTable } from '@/components/ReportTable';
import { FileSpreadsheet, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUploaded: 0,
    totalProcessed: 0,
    lastProcessed: null as any,
    recentActivity: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard/stats');
      const result = response.data || {};
      const data = result.data || result; // Handle both formats
      
      console.log('Dashboard stats response:', data);
      console.log('Recent activity sample:', data.recentActivity?.[0]);
      
      setStats({
        totalUploaded: data.totalUploaded || 0,
        totalProcessed: data.totalProcessed || 0,
        lastProcessed: data.lastProcessed || null,
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      // Set empty state on error
      setStats({
        totalUploaded: 0,
        totalProcessed: 0,
        lastProcessed: null,
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: number) => {
    try {
      console.log('Dashboard download for report ID:', reportId);
      // Find the processed report ID
      const reportResponse = await api.get(`/reports/${reportId}`);
      console.log('Report response:', reportResponse.data);
      
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
        console.log('Dashboard download completed');
      } else {
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
      console.log('Dashboard delete for report ID:', reportId);
      await api.delete(`/reports/${reportId}`);
      fetchDashboardStats();
      console.log('Delete successful');
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete report');
    }
  };

  const handleView = (reportId: number) => {
    console.log('Dashboard view for report ID:', reportId);
    navigate(`/report/${reportId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name}! Here's your MIS report overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Uploaded"
          value={stats.totalUploaded}
          icon={FileSpreadsheet}
          description="Total reports uploaded"
        />
        <StatsCard
          title="Total Processed"
          value={stats.totalProcessed}
          icon={CheckCircle}
          description="Successfully processed"
        />
        <StatsCard
          title="Processing Rate"
          value={
            stats.totalUploaded > 0
              ? `${Math.round((stats.totalProcessed / stats.totalUploaded) * 100)}%`
              : '0%'
          }
          icon={TrendingUp}
          description="Success rate"
        />
        <StatsCard
          title="Last Processed"
          value={
            stats.lastProcessed
              ? new Date(stats.lastProcessed.processedDate).toLocaleDateString()
              : 'N/A'
          }
          icon={Clock}
          description={stats.lastProcessed?.uploadedReportId?.originalName || 'No reports yet'}
        />
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground mt-1">Your latest uploaded reports</p>
        </div>
        <ReportTable
          reports={stats.recentActivity}
          onView={handleView}
          onDownload={handleDownload}
          onDelete={handleDelete}
          isAdmin={user.role === 'admin'}
        />
      </div>
    </div>
  );
};
