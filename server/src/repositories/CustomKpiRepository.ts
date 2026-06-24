import { PrismaClient, CustomKpi } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export class CustomKpiRepository extends BaseRepository<CustomKpi> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'customKpi');
  }

  async findActive(): Promise<CustomKpi[]> {
    return this.prisma.customKpi.findMany({
      where: { isActive: true },
      include: {
        formula: true,
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

  async findByCreator(createdById: number): Promise<CustomKpi[]> {
    return this.prisma.customKpi.findMany({
      where: { createdById },
      include: {
        formula: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithFormula(id: number): Promise<CustomKpi | null> {
    return this.prisma.customKpi.findUnique({
      where: { id },
      include: {
        formula: true,
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

  async toggleActive(id: number, isActive: boolean): Promise<CustomKpi> {
    return this.prisma.customKpi.update({
      where: { id },
      data: { isActive },
    });
  }
}
