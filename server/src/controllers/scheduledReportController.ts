import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Create a scheduled report
 */
export const createScheduledReport = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      frequency,
      schedule,
      templateId,
      recipients,
      subject,
      emailBody
    } = req.body;
    
    const userId = (req as any).user.id;

    // Calculate next run date based on frequency
    const nextRunAt = calculateNextRunDate(frequency);

    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        name,
        description,
        frequency,
        schedule: schedule || frequency,
        templateId: templateId ? Number(templateId) : null,
        recipients,
        subject,
        emailBody,
        nextRunAt,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Scheduled report created successfully',
      data: scheduledReport
    });
  } catch (error: any) {
    console.error('Error creating scheduled report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheduled report',
      error: error.message
    });
  }
};

/**
 * Get all scheduled reports
 */
export const getScheduledReports = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [reports, total] = await Promise.all([
      prisma.scheduledReport.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reportRuns: {
            orderBy: { startedAt: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.scheduledReport.count({ where })
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled reports',
      error: error.message
    });
  }
};

/**
 * Get a scheduled report by ID
 */
export const getScheduledReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await prisma.scheduledReport.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reportRuns: {
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Error fetching scheduled report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled report',
      error: error.message
    });
  }
};

/**
 * Update a scheduled report
 */
export const updateScheduledReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      frequency,
      schedule,
      templateId,
      recipients,
      subject,
      emailBody,
      isActive
    } = req.body;

    const updateData: any = {
      name,
      description,
      frequency,
      schedule,
      recipients,
      subject,
      emailBody,
      isActive
    };

    if (templateId !== undefined) {
      updateData.templateId = templateId ? Number(templateId) : null;
    }

    // Recalculate next run if frequency changed
    if (frequency) {
      updateData.nextRunAt = calculateNextRunDate(frequency);
    }

    const report = await prisma.scheduledReport.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Scheduled report updated successfully',
      data: report
    });
  } catch (error: any) {
    console.error('Error updating scheduled report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled report',
      error: error.message
    });
  }
};

/**
 * Delete a scheduled report
 */
export const deleteScheduledReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.scheduledReport.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting scheduled report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled report',
      error: error.message
    });
  }
};

/**
 * Manually trigger a scheduled report
 */
export const triggerScheduledReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id: Number(id) }
    });

    if (!scheduledReport) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    // Create a report run
    const reportRun = await prisma.scheduledReportRun.create({
      data: {
        scheduledReportId: Number(id),
        status: 'pending'
      }
    });

    // TODO: Implement actual report generation and email sending in background job
    // For now, just mark as completed
    await prisma.scheduledReportRun.update({
      where: { id: reportRun.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Update last run date
    await prisma.scheduledReport.update({
      where: { id: Number(id) },
      data: {
        lastRunAt: new Date(),
        nextRunAt: calculateNextRunDate(scheduledReport.frequency)
      }
    });

    res.json({
      success: true,
      message: 'Scheduled report triggered successfully',
      data: reportRun
    });
  } catch (error: any) {
    console.error('Error triggering scheduled report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger scheduled report',
      error: error.message
    });
  }
};

/**
 * Get report runs for a scheduled report
 */
export const getReportRuns = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [runs, total] = await Promise.all([
      prisma.scheduledReportRun.findMany({
        where: { scheduledReportId: Number(id) },
        orderBy: { startedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.scheduledReportRun.count({
        where: { scheduledReportId: Number(id) }
      })
    ]);

    res.json({
      success: true,
      data: runs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching report runs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report runs',
      error: error.message
    });
  }
};

/**
 * Calculate next run date based on frequency
 */
function calculateNextRunDate(frequency: string): Date {
  const now = new Date();
  
  switch (frequency.toLowerCase()) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      now.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  
  return now;
}
