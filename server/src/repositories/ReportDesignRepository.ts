import { PrismaClient, ReportDesign } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export class ReportDesignRepository extends BaseRepository<ReportDesign> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'reportDesign');
  }

  async findPublic(): Promise<ReportDesign[]> {
    return this.prisma.reportDesign.findMany({
      where: {
        isPublic: true,
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByUser(userId: number): Promise<ReportDesign[]> {
    return this.prisma.reportDesign.findMany({
      where: {
        OR: [{ createdById: userId }, { isPublic: true }],
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findActive(): Promise<ReportDesign[]> {
    return this.prisma.reportDesign.findMany({
      where: { isActive: true },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
