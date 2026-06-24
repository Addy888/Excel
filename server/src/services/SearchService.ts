import { PrismaClient } from '@prisma/client';

export class SearchService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Advanced search across multiple entities
   */
  async globalSearch(query: string, userId: number, filters?: {
    entityTypes?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }) {
    const limit = filters?.limit || 20;
    const entityTypes = filters?.entityTypes || ['reports', 'users', 'campaigns', 'agents', 'templates'];

    const results: any = {
      reports: [],
      users: [],
      campaigns: [],
      agents: [],
      templates: [],
      total: 0,
    };

    // Search reports
    if (entityTypes.includes('reports')) {
      results.reports = await this.searchReports(query, filters, limit);
      results.total += results.reports.length;
    }

    // Search users
    if (entityTypes.includes('users')) {
      results.users = await this.searchUsers(query, limit);
      results.total += results.users.length;
    }

    // Search campaigns
    if (entityTypes.includes('campaigns')) {
      results.campaigns = await this.searchCampaigns(query, limit);
      results.total += results.campaigns.length;
    }

    // Search agents
    if (entityTypes.includes('agents')) {
      results.agents = await this.searchAgents(query, limit);
      results.total += results.agents.length;
    }

    // Search templates
    if (entityTypes.includes('templates')) {
      results.templates = await this.searchTemplates(query, limit);
      results.total += results.templates.length;
    }

    // Save search history
    await this.saveSearchHistory(userId, query, filters?.entityTypes?.join(',') || 'all', results.total);

    return results;
  }

  /**
   * Search reports
   */
  private async searchReports(query: string, filters?: any, limit: number = 20) {
    const where: any = {
      OR: [
        { fileName: { contains: query } },
        { originalName: { contains: query } },
      ],
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.uploadDate = {};
      if (filters.dateFrom) where.uploadDate.gte = filters.dateFrom;
      if (filters.dateTo) where.uploadDate.lte = filters.dateTo;
    }

    return this.prisma.uploadedReport.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        uploadDate: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Search users
   */
  private async searchUsers(query: string, limit: number = 20) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleName: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Search campaigns
   */
  private async searchCampaigns(query: string, limit: number = 20) {
    return this.prisma.campaign.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
        isActive: true,
      },
      include: {
        _count: {
          select: {
            agents: true,
            campaignReports: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Search agents
   */
  private async searchAgents(query: string, limit: number = 20) {
    return this.prisma.agent.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
        isActive: true,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Search templates
   */
  private async searchTemplates(query: string, limit: number = 20) {
    return this.prisma.reportTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
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
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Save search history
   */
  private async saveSearchHistory(userId: number, query: string, entityType: string, resultCount: number) {
    try {
      await this.prisma.searchHistory.create({
        data: {
          userId,
          query,
          entityType,
          resultCount,
        },
      });
    } catch (error) {
      // Silently fail - search history is not critical
    }
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(userId: number, limit: number = 10) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit: number = 10) {
    // This would require aggregation - simplified version
    const searches = await this.prisma.searchHistory.findMany({
      select: {
        query: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Count occurrences
    const counts: Record<string, number> = {};
    searches.forEach(s => {
      counts[s.query] = (counts[s.query] || 0) + 1;
    });

    // Sort by count and return top results
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  /**
   * Advanced report search with filters
   */
  async searchReportsAdvanced(filters: {
    query?: string;
    status?: string[];
    uploadedBy?: number;
    dateFrom?: Date;
    dateTo?: Date;
    minRecords?: number;
    maxRecords?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      status,
      uploadedBy,
      dateFrom,
      dateTo,
      minRecords,
      maxRecords,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    if (query) {
      where.OR = [
        { fileName: { contains: query } },
        { originalName: { contains: query } },
      ];
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (uploadedBy) {
      where.uploadedById = uploadedBy;
    }

    if (dateFrom || dateTo) {
      where.uploadDate = {};
      if (dateFrom) where.uploadDate.gte = dateFrom;
      if (dateTo) where.uploadDate.lte = dateTo;
    }

    if (minRecords || maxRecords) {
      where.recordsCount = {};
      if (minRecords) where.recordsCount.gte = minRecords;
      if (maxRecords) where.recordsCount.lte = maxRecords;
    }

    const [reports, total] = await Promise.all([
      this.prisma.uploadedReport.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          processedReports: {
            select: {
              id: true,
              processedDate: true,
            },
            take: 1,
            orderBy: {
              processedDate: 'desc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.uploadedReport.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
