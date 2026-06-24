import React, { useEffect, useState } from 'react';
import { StatsCard } from '@/components/StatsCard';
// import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { LineChart } from '@/components/charts/LineChart';
import { Users, FileText, CheckCircle, Settings, TrendingUp } from 'lucide-react';
import api from '@/services/api';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics'),
      ]);

      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.stats?.totalUsers || 0}
          icon={Users}
          description="Registered users"
        />
        <StatsCard
          title="Total Reports"
          value={stats?.stats?.totalReports || 0}
          icon={FileText}
          description="Uploaded reports"
        />
        <StatsCard
          title="Processed"
          value={stats?.stats?.totalProcessed || 0}
          icon={CheckCircle}
          description="Completed processing"
        />
        <StatsCard
          title="Rules"
          value={stats?.stats?.totalRules || 0}
          icon={Settings}
          description="Active rules"
        />
        <StatsCard
          title="Templates"
          value={stats?.stats?.totalTemplates || 0}
          icon={TrendingUp}
          description="Report templates"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Uploads Trend */}
        <div className="bg-card rounded-lg border p-6">
          <LineChart
            data={stats?.dailyStats || []}
            xKey="_id"
            yKey="count"
            title="Upload Trends (Last 30 Days)"
            color="#4472C4"
          />
        </div>

        {/* Status Distribution */}
        <div className="bg-card rounded-lg border p-6">
          <PieChart
            data={analytics?.statusDistribution || []}
            nameKey="_id"
            valueKey="count"
            title="Report Status Distribution"
          />
        </div>

        {/* Top Uploaders */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Uploaders</h3>
          <div className="space-y-3">
            {stats?.topUploaders?.map((uploader: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{uploader.name}</p>
                  <p className="text-sm text-muted-foreground">{uploader.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{uploader.count}</p>
                  <p className="text-xs text-muted-foreground">reports</p>
                </div>
              </div>
            ))}
            {(!stats?.topUploaders || stats.topUploaders.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Processing Performance</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <p className="text-sm opacity-90">Avg Processing Time</p>
              <p className="text-2xl font-bold">
                {analytics?.processingStats?.avgProcessingTime
                  ? `${Math.round(analytics.processingStats.avgProcessingTime / 1000)}s`
                  : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg">
              <p className="text-sm opacity-90">Total Records Processed</p>
              <p className="text-2xl font-bold">
                {analytics?.processingStats?.totalRecordsProcessed?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg">
              <p className="text-sm opacity-90">Recent Activity (7 days)</p>
              <p className="text-2xl font-bold">{stats?.stats?.recentUploads || 0}</p>
              <p className="text-sm opacity-90">uploads</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
