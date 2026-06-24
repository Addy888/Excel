import { PrismaClient, Backup } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import logger from '../config/logger';

const execAsync = promisify(exec);

export class BackupService {
  private prisma: PrismaClient;
  private backupDir: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.backupDir = process.env.BACKUP_PATH || './backups';
  }

  /**
   * Create a manual backup
   */
  async createManualBackup(userId: number, includeFiles: boolean = true): Promise<Backup> {
    const name = `manual_backup_${Date.now()}`;
    return this.createBackup(name, 'manual', userId, includeFiles);
  }

  /**
   * Create a scheduled backup
   */
  async createScheduledBackup(includeFiles: boolean = true): Promise<Backup> {
    const name = `scheduled_backup_${Date.now()}`;
    return this.createBackup(name, 'scheduled', null, includeFiles);
  }

  /**
   * Create a backup
   */
  private async createBackup(
    name: string,
    type: string,
    userId: number | null,
    includeFiles: boolean
  ): Promise<Backup> {
    // Create backup record
    const backup = await this.prisma.backup.create({
      data: {
        name,
        type,
        status: 'pending',
        includeFiles,
        compression: true,
        createdById: userId || undefined,
      },
    });

    try {
      // Update status to in progress
      await this.prisma.backup.update({
        where: { id: backup.id },
        data: { status: 'inProgress' },
      });

      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Create database backup
      const dbBackupPath = await this.backupDatabase(name);

      let fileBackupPath: string | null = null;
      let totalSize = 0;

      // Get database backup size
      const dbStats = await fs.stat(dbBackupPath);
      totalSize += dbStats.size;

      // Create files backup if requested
      if (includeFiles) {
        fileBackupPath = await this.backupFiles(name);
        if (fileBackupPath) {
          const fileStats = await fs.stat(fileBackupPath);
          totalSize += fileStats.size;
        }
      }

      // Update backup record with completion
      return await this.prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'completed',
          filePath: dbBackupPath,
          fileSize: totalSize,
          completedAt: new Date(),
          metadata: {
            dbBackupPath,
            fileBackupPath,
          },
        },
      });
    } catch (error) {
      logger.error('Backup failed:', error);

      // Update backup record with error
      await this.prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Backup database using mysqldump
   */
  private async backupDatabase(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, username, password, host, port, database] = match;

    const command = `mysqldump -h ${host} -P ${port} -u ${username} -p${password} ${database} > "${filepath}"`;

    try {
      await execAsync(command);
      logger.info(`Database backup created: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw new Error(`Database backup failed: ${(error as Error).message}`);
    }
  }

  /**
   * Backup uploaded files
   */
  private async backupFiles(name: string): Promise<string | null> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_files_${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, filename);

    const uploadDir = process.env.UPLOAD_PATH || './uploads';

    try {
      // Check if upload directory exists
      await fs.access(uploadDir);

      // Create tar archive (requires tar to be installed)
      const command = `tar -czf "${filepath}" -C "${uploadDir}" .`;
      await execAsync(command);

      logger.info(`Files backup created: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.warn('Files backup skipped or failed:', error);
      return null;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupId: number): Promise<void> {
    const backup = await this.prisma.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup || backup.status !== 'completed') {
      throw new Error('Backup not found or not completed');
    }

    if (!backup.filePath) {
      throw new Error('Backup file path not found');
    }

    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, username, password, host, port, database] = match;

    const command = `mysql -h ${host} -P ${port} -u ${username} -p${password} ${database} < "${backup.filePath}"`;

    try {
      await execAsync(command);
      logger.info(`Database restored from backup: ${backup.filePath}`);
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw new Error(`Database restore failed: ${(error as Error).message}`);
    }
  }

  /**
   * List all backups
   */
  async listBackups(limit: number = 50): Promise<Backup[]> {
    return this.prisma.backup.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Delete old backups
   */
  async deleteOldBackups(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldBackups = await this.prisma.backup.findMany({
      where: {
        startedAt: {
          lt: cutoffDate,
        },
      },
    });

    // Delete backup files
    for (const backup of oldBackups) {
      if (backup.filePath) {
        try {
          await fs.unlink(backup.filePath);
          logger.info(`Deleted backup file: ${backup.filePath}`);
        } catch (error) {
          logger.warn(`Failed to delete backup file: ${backup.filePath}`, error);
        }
      }

      // Delete associated files backup if exists
      if (backup.metadata && typeof backup.metadata === 'object') {
        const metadata = backup.metadata as { fileBackupPath?: string };
        if (metadata.fileBackupPath) {
          try {
            await fs.unlink(metadata.fileBackupPath);
          } catch (error) {
            logger.warn(`Failed to delete files backup: ${metadata.fileBackupPath}`, error);
          }
        }
      }
    }

    // Delete backup records
    const result = await this.prisma.backup.deleteMany({
      where: {
        startedAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} old backups`);
    return result.count;
  }

  /**
   * Get backup by ID
   */
  async getBackup(id: number): Promise<Backup | null> {
    return this.prisma.backup.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
