import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { getAuditLogs } from '../services/auditService';

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalReports = await prisma.uploadedReport.count();
    const totalProcessed = await prisma.processedReport.count();
    const totalRules = await prisma.processingRule.count({ where: { isActive: true } });
    const totalTemplates = await prisma.reportTemplate.count({ where: { isActive: true } });

    // Recent activity from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = await prisma.uploadedReport.count({
      where: { uploadDate: { gte: sevenDaysAgo } },
    });

    const recentProcessed = await prisma.processedReport.count({
      where: { processedDate: { gte: sevenDaysAgo } },
    });

    // Analytics by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reports = await prisma.uploadedReport.findMany({
      where: { uploadDate: { gte: thirtyDaysAgo } },
      select: { uploadDate: true, recordsCount: true }
    });

    const dailyStatsMap: Record<string, { count: number; totalRecords: number }> = {};
    reports.forEach(report => {
      const dateStr = report.uploadDate.toISOString().split('T')[0];
      if (!dailyStatsMap[dateStr]) {
        dailyStatsMap[dateStr] = { count: 0, totalRecords: 0 };
      }
      dailyStatsMap[dateStr].count += 1;
      dailyStatsMap[dateStr].totalRecords += report.recordsCount;
    });

    const dailyStats = Object.keys(dailyStatsMap)
      .sort()
      .map(date => ({
        _id: date,
        count: dailyStatsMap[date].count,
        totalRecords: dailyStatsMap[date].totalRecords
      }));

    // Top uploaders
    const topUploadersData = await prisma.uploadedReport.groupBy({
      by: ['uploadedById'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const topUploaders = await Promise.all(topUploadersData.map(async u => {
      const user = await prisma.user.findUnique({
        where: { id: u.uploadedById },
        select: { name: true, email: true }
      });
      return {
        _id: u.uploadedById,
        count: u._count.id,
        name: user?.name,
        email: user?.email
      };
    }));

    res.json({
      stats: {
        totalUsers,
        totalReports,
        totalProcessed,
        totalRules,
        totalTemplates,
        recentUploads,
        recentProcessed,
      },
      dailyStats,
      topUploaders,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch admin dashboard', error: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        roleName: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { name, email, roleName: role },
      select: {
        id: true,
        name: true,
        email: true,
        roleName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === String(req.user!.id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id, 10) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

export const getAuditLogsController = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, userId, action, resourceType, startDate, endDate } = req.query;

    const result = await getAuditLogs(
      {
        userId: userId as string,
        action: action as string,
        resourceType: resourceType as string,
        startDate: startDate as string,
        endDate: endDate as string,
      },
      Number(page) || 1,
      Number(limit) || 50
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Upload trends
    const uploadTrendsData = await prisma.uploadedReport.findMany({
      where: { uploadDate: { gte: start, lte: end } },
      select: { uploadDate: true, recordsCount: true }
    });
    const trendsMap: Record<string, { count: number; totalRecords: number }> = {};
    uploadTrendsData.forEach(item => {
      const dateStr = item.uploadDate.toISOString().split('T')[0];
      if (!trendsMap[dateStr]) trendsMap[dateStr] = { count: 0, totalRecords: 0 };
      trendsMap[dateStr].count += 1;
      trendsMap[dateStr].totalRecords += item.recordsCount;
    });
    const uploadTrends = Object.keys(trendsMap).sort().map(d => ({
      _id: d,
      uploads: trendsMap[d].count,
      totalRecords: trendsMap[d].totalRecords
    }));

    // Status distribution
    const statusData = await prisma.uploadedReport.groupBy({
      by: ['status'],
      where: { uploadDate: { gte: start, lte: end } },
      _count: { status: true }
    });
    const statusDistribution = statusData.map(s => ({
      _id: s.status,
      count: s._count.status
    }));

    // Processing time analytics
    const processedReports = await prisma.processedReport.findMany({
      where: { processedDate: { gte: start, lte: end } },
      include: { uploadedReport: true }
    });
    let totalProcessingTime = 0;
    let totalRecordsProcessed = 0;
    
    processedReports.forEach(pr => {
      if (pr.uploadedReport && pr.processedDate) {
        totalProcessingTime += pr.processedDate.getTime() - pr.uploadedReport.uploadDate.getTime();
        totalRecordsProcessed += pr.uploadedReport.recordsCount;
      }
    });

    const avgProcessingTime = processedReports.length > 0 ? totalProcessingTime / processedReports.length : 0;

    res.json({
      uploadTrends,
      statusDistribution,
      processingStats: {
        avgProcessingTime,
        totalRecordsProcessed,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};
