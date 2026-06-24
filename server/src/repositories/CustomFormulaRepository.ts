import { PrismaClient, CustomFormula } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export class CustomFormulaRepository extends BaseRepository<CustomFormula> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'customFormula');
  }

  async findActive(): Promise<CustomFormula[]> {
    return this.prisma.customFormula.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByCategory(category: string): Promise<CustomFormula[]> {
    return this.prisma.customFormula.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByCreator(createdById: number): Promise<CustomFormula[]> {
    return this.prisma.customFormula.findMany({
      where: { createdById },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByName(name: string): Promise<CustomFormula | null> {
    return this.prisma.customFormula.findFirst({
      where: { name },
    });
  }

  async toggleActive(id: number, isActive: boolean): Promise<CustomFormula> {
    return this.prisma.customFormula.update({
      where: { id },
      data: { isActive },
    });
  }
}
