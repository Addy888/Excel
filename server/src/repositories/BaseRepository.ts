import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  async findById(id: number): Promise<T | null> {
    return (this.prisma as any)[this.modelName].findUnique({
      where: { id },
    });
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<T[]> {
    return (this.prisma as any)[this.modelName].findMany(options);
  }

  async count(where?: any): Promise<number> {
    return (this.prisma as any)[this.modelName].count({ where });
  }

  async create(data: any): Promise<T> {
    return (this.prisma as any)[this.modelName].create({ data });
  }

  async update(id: number, data: any): Promise<T> {
    return (this.prisma as any)[this.modelName].update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<T> {
    return (this.prisma as any)[this.modelName].delete({
      where: { id },
    });
  }

  async exists(where: any): Promise<boolean> {
    const count = await (this.prisma as any)[this.modelName].count({ where });
    return count > 0;
  }

  async findOne(where: any): Promise<T | null> {
    return (this.prisma as any)[this.modelName].findFirst({ where });
  }

  async upsert(where: any, create: any, update: any): Promise<T> {
    return (this.prisma as any)[this.modelName].upsert({
      where,
      create,
      update,
    });
  }
}
