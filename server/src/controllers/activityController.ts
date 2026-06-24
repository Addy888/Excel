import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Get user activity logs
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = parseInt(userId as string);
    }

    if (action) {
      where.action = action as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              roleName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: activities,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user activity',
    });
  }
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get activity counts by action
    const activityCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    });

    // Get most active users
    const mostActiveUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get user details
    const userIds = mostActiveUsers.map(u => u.userId).filter(id => id !== null) as number[];
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleName: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const mostActiveUsersWithDetails = mostActiveUsers
      .filter(u => u.userId)
      .map(u => ({
        user: userMap.get(u.userId!),
        activityCount: u._count,
      }));

    // Get recent activity timeline
    const recentActivity = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    res.json({
      status: 'success',
      data: {
        activityCounts,
        mostActiveUsers: mostActiveUsersWithDetails,
        recentActivity,
        totalActivities: activityCounts.reduce((sum, a) => sum + a._count, 0),
      },
    });
  } catch (error) {
    logger.error('Get activity stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve activity statistics',
    });
  }
};

/**
 * Export activity log
 */
export const exportActivityLog = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const activities = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roleName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Timestamp,User,Email,Role,Action,Resource,IP Address\n';
      const csvRows = activities.map(a =>
        [
          new Date(a.createdAt).toISOString(),
          a.user?.name || 'N/A',
          a.user?.email || 'N/A',
          a.user?.roleName || 'N/A',
          a.action,
          a.resource,
          a.ipAddress || 'N/A',
        ].join(',')
      );

      const csv = csvHeader + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-log.csv');
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        status: 'success',
        data: activities,
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'EXPORT_ACTIVITY_LOG',
        resource: 'AuditLog',
        details: { format, startDate, endDate },
        ipAddress: req.ip,
      },
    });
  } catch (error) {
    logger.error('Export activity log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export activity log',
    });
  }
};
