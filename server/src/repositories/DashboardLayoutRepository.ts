import { PrismaClient, DashboardLayout } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export class DashboardLayoutRepository extends BaseRepository<DashboardLayout> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'dashboardLayout');
  }

  async findByUser(userId: number): Promise<DashboardLayout[]> {
    return this.prisma.dashboardLayout.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findDefault(userId: number): Promise<DashboardLayout | null> {
    return this.prisma.dashboardLayout.findFirst({
      where: {
        userId,
        isDefault: true,
        isActive: true,
      },
    });
  }

  async setDefault(userId: number, layoutId: number): Promise<DashboardLayout> {
    // First, remove default from all user layouts
    await this.prisma.dashboardLayout.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Then set the new default
    return this.prisma.dashboardLayout.update({
      where: { id: layoutId },
      data: { isDefault: true },
    });
  }

  async createDefault(userId: number, layout: any, widgets: any): Promise<DashboardLayout> {
    return this.prisma.dashboardLayout.create({
      data: {
        name: 'Default Dashboard',
        userId,
        layout,
        widgets,
        isDefault: true,
        isActive: true,
      },
    });
  }
}
