import { PrismaClient } from '@prisma/client';
import os from 'os';
import logger from '../config/logger';

export class MonitoringService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    const cpuUsage = this.getCpuUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();

    // Get database stats
    const dbStats = await this.getDatabaseStats();

    // Get queue status
    const queueStatus = await this.getQueueStatus();

    // Determine overall health status
    const status = this.determineHealthStatus(cpuUsage, memoryUsage, diskUsage);

    // Save health check
    await this.prisma.systemHealth.create({
      data: {
        cpuUsage,
        memoryUsage,
        diskUsage,
        activeConnections: dbStats.activeConnections,
        queueSize: queueStatus.pending,
        errorCount: queueStatus.failed,
        status,
        metadata: {
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          uptime: os.uptime(),
          platform: os.platform(),
          dbStats,
          queueStatus,
        },
      },
    });

    return {
      status,
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
      },
      memory: {
        usage: memoryUsage,
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      disk: {
        usage: diskUsage,
      },
      database: dbStats,
      queue: queueStatus,
      uptime: os.uptime(),
      timestamp: new Date(),
    };
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle) / total;

    return Math.round(usage * 100) / 100;
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usage = (usedMem / totalMem) * 100;

    return Math.round(usage * 100) / 100;
  }

  /**
   * Get disk usage (simplified - in production use a proper library)
   */
  private async getDiskUsage(): Promise<number> {
    // This is a placeholder. In production, use a library like 'diskusage'
    // or 'check-disk-space' for accurate disk usage
    return 50; // Default 50%
  }

  /**
   * Get database statistics
   */
  private async getDatabaseStats() {
    try {
      const [
        totalUsers,
        totalReports,
        processingReports,
        totalCampaigns,
        totalAgents,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.uploadedReport.count(),
        this.prisma.uploadedReport.count({ where: { status: 'processing' } }),
        this.prisma.campaign.count(),
        this.prisma.agent.count(),
      ]);

      return {
        totalUsers,
        totalReports,
        processingReports,
        totalCampaigns,
        totalAgents,
        activeConnections: 1, // Placeholder - get from database pool
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return {
        totalUsers: 0,
        totalReports: 0,
        processingReports: 0,
        totalCampaigns: 0,
        totalAgents: 0,
        activeConnections: 0,
      };
    }
  }

  /**
   * Get processing queue status
   */
  private async getQueueStatus() {
    const [uploaded, processing, processed, failed] = await Promise.all([
      this.prisma.uploadedReport.count({ where: { status: 'uploaded' } }),
      this.prisma.uploadedReport.count({ where: { status: 'processing' } }),
      this.prisma.uploadedReport.count({ where: { status: 'processed' } }),
      this.prisma.uploadedReport.count({ where: { status: 'failed' } }),
    ]);

    return {
      pending: uploaded,
      processing,
      completed: processed,
      failed,
      total: uploaded + processing + processed + failed,
    };
  }

  /**
   * Determine overall health status
   */
  private determineHealthStatus(cpu: number, memory: number, disk: number): string {
    if (cpu > 90 || memory > 90 || disk > 90) {
      return 'critical';
    }
    if (cpu > 70 || memory > 70 || disk > 70) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Get health history
   */
  async getHealthHistory(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.prisma.systemHealth.findMany({
      where: {
        checkedAt: {
          gte: since,
        },
      },
      orderBy: {
        checkedAt: 'asc',
      },
    });
  }

  /**
   * Get processing monitor data
   */
  async getProcessingMonitor() {
    const recentReports = await this.prisma.uploadedReport.findMany({
      where: {
        status: {
          in: ['processing', 'uploaded'],
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        processingLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        uploadDate: 'desc',
      },
      take: 20,
    });

    const errorReports = await this.prisma.uploadedReport.findMany({
      where: {
        status: 'failed',
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        errorReports: true,
      },
      orderBy: {
        uploadDate: 'desc',
      },
      take: 10,
    });

    return {
      processing: recentReports.filter(r => r.status === 'processing'),
      queued: recentReports.filter(r => r.status === 'uploaded'),
      failed: errorReports,
      stats: {
        processingCount: recentReports.filter(r => r.status === 'processing').length,
        queuedCount: recentReports.filter(r => r.status === 'uploaded').length,
        failedCount: errorReports.length,
      },
    };
  }
}
