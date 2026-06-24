import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * Get storage statistics
 */
export const getStorageStats = async (req: Request, res: Response) => {
  try {
    const uploadsPath = path.join(__dirname, '../../uploads');

    // Get total file count and size
    const files = await fs.readdir(uploadsPath);
    let totalSize = 0;

    for (const file of files) {
      try {
        const filePath = path.join(uploadsPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    }

    // Get database statistics
    const [totalReports, processedReports, totalUsers] = await Promise.all([
      prisma.uploadedReport.count(),
      prisma.processedReport.count(),
      prisma.user.count(),
    ]);

    // Get old reports (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldReportsCount = await prisma.uploadedReport.count({
      where: {
        uploadDate: {
          lt: ninetyDaysAgo,
        },
      },
    });

    res.json({
      status: 'success',
      data: {
        storage: {
          totalFiles: files.length,
          totalSize,
          totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
        },
        database: {
          totalReports,
          processedReports,
          totalUsers,
          oldReportsCount,
        },
        cleanup: {
          oldReportsThreshold: 90,
          oldReportsCount,
        },
      },
    });
  } catch (error) {
    logger.error('Get storage stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve storage statistics',
    });
  }
};

/**
 * Cleanup old reports
 */
export const cleanupOldReports = async (req: Request, res: Response) => {
  try {
    const { daysOld = 90, dryRun = false } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Find old reports
    const oldReports = await prisma.uploadedReport.findMany({
      where: {
        uploadDate: {
          lt: cutoffDate,
        },
        status: {
          in: ['processed', 'failed'],
        },
      },
      select: {
        id: true,
        filePath: true,
        fileName: true,
        uploadDate: true,
      },
    });

    if (dryRun) {
      return res.json({
        status: 'success',
        message: 'Dry run completed',
        data: {
          reportCount: oldReports.length,
          reports: oldReports.map(r => ({
            id: r.id,
            fileName: r.fileName,
            uploadDate: r.uploadDate,
          })),
        },
      });
    }

    // Delete files and database records
    let deletedFiles = 0;
    let deletedRecords = 0;

    for (const report of oldReports) {
      try {
        // Delete physical file
        if (report.filePath) {
          await fs.unlink(report.filePath);
          deletedFiles++;
        }

        // Delete database record
        await prisma.uploadedReport.delete({
          where: { id: report.id },
        });
        deletedRecords++;
      } catch (error) {
        logger.warn(`Failed to delete report ${report.id}:`, error);
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'CLEANUP_OLD_REPORTS',
        resource: 'Storage',
        details: {
          daysOld,
          deletedFiles,
          deletedRecords,
        },
        ipAddress: req.ip,
      },
    });

    logger.info(`Cleanup completed: ${deletedFiles} files, ${deletedRecords} records deleted`);

    res.json({
      status: 'success',
      message: 'Cleanup completed successfully',
      data: {
        deletedFiles,
        deletedRecords,
      },
    });
  } catch (error) {
    logger.error('Cleanup old reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cleanup old reports',
    });
  }
};

/**
 * Delete specific report files
 */
export const deleteReportFiles = async (req: Request, res: Response) => {
  try {
    const { reportIds } = req.body;

    if (!reportIds || !Array.isArray(reportIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid report IDs',
      });
    }

    const reports = await prisma.uploadedReport.findMany({
      where: {
        id: {
          in: reportIds,
        },
      },
      select: {
        id: true,
        filePath: true,
      },
    });

    let deletedCount = 0;

    for (const report of reports) {
      try {
        if (report.filePath) {
          await fs.unlink(report.filePath);
          deletedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to delete file for report ${report.id}:`, error);
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'DELETE_REPORT_FILES',
        resource: 'Storage',
        details: {
          reportIds,
          deletedCount,
        },
        ipAddress: req.ip,
      },
    });

    res.json({
      status: 'success',
      message: `${deletedCount} file(s) deleted successfully`,
      data: { deletedCount },
    });
  } catch (error) {
    logger.error('Delete report files error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete files',
    });
  }
};
