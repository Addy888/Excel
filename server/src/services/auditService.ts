import prisma from '../config/prisma';

export const createAuditLog = async (data: any) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId ? parseInt(data.userId, 10) : undefined,
        action: data.action,
        resource: data.resourceType || 'UNKNOWN',
        details: data.details,
        ipAddress: data.ipAddress,
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const getAuditLogs = async (filters: any = {}, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (filters.userId) whereClause.userId = parseInt(filters.userId, 10);
  if (filters.action) whereClause.action = filters.action;
  if (filters.resourceType) whereClause.resource = filters.resourceType;
  if (filters.startDate && filters.endDate) {
    whereClause.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });

  const total = await prisma.auditLog.count({ where: whereClause });

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
