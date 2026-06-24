import { PrismaClient } from '@prisma/client';

export class AggregationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate daily summary from processed reports
   */
  async generateDailySummary(date: Date, campaignId?: number, teamId?: number, agentId?: number) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all processed reports for the day
    const reports = await this.prisma.processedReport.findMany({
      where: {
        processedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Aggregate metrics
    const metrics = reports.reduce(
      (acc, report) => {
        acc.totalDialed += report.totalDialed;
        acc.connectedCalls += report.connectedCalls;
        acc.qualifiedLeads += report.qualifiedLeads;
        acc.convertedLeads += report.convertedLeads;
        acc.rejectedLeads += report.rejectedLeads;
        acc.uniqueNumbers += report.uniqueNumbers;
        acc.duplicateNumbers += report.duplicateNumbers;
        return acc;
      },
      {
        totalDialed: 0,
        connectedCalls: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
        rejectedLeads: 0,
        uniqueNumbers: 0,
        duplicateNumbers: 0,
      }
    );

    // Calculate rates
    const connectionRate =
      metrics.totalDialed > 0 ? (metrics.connectedCalls / metrics.totalDialed) * 100 : 0;
    const conversionRate =
      metrics.qualifiedLeads > 0 ? (metrics.convertedLeads / metrics.qualifiedLeads) * 100 : 0;
    const qualificationRate =
      metrics.connectedCalls > 0 ? (metrics.qualifiedLeads / metrics.connectedCalls) * 100 : 0;

    // Build the unique key parts
    const uniqueKey: any = { reportDate: startOfDay };
    if (campaignId !== null && campaignId !== undefined) uniqueKey.campaignId = campaignId;
    if (teamId !== null && teamId !== undefined) uniqueKey.teamId = teamId;
    if (agentId !== null && agentId !== undefined) uniqueKey.agentId = agentId;

    // Build the create/update data
    const dataFields: any = {
      ...metrics,
      connectionRate,
      conversionRate,
      qualificationRate,
      avgCallDuration: 0,
    };

    // Upsert daily summary
    return this.prisma.dailySummary.upsert({
      where: {
        reportDate_campaignId_teamId_agentId: uniqueKey,
      },
      update: dataFields,
      create: {
        reportDate: startOfDay,
        ...dataFields,
        ...(campaignId !== null && campaignId !== undefined && { campaignId }),
        ...(teamId !== null && teamId !== undefined && { teamId }),
        ...(agentId !== null && agentId !== undefined && { agentId }),
      },
    });
  }

  /**
   * Generate weekly summary
   */
  async generateWeeklySummary(
    weekStart: Date,
    weekEnd: Date,
    campaignId?: number,
    teamId?: number
  ) {
    const year = weekStart.getFullYear();
    const weekNumber = this.getWeekNumber(weekStart);

    // Get daily summaries for the week
    const dailySummaries = await this.prisma.dailySummary.findMany({
      where: {
        reportDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        campaignId: campaignId || null,
        teamId: teamId || null,
      },
    });

    // Aggregate metrics
    const metrics = dailySummaries.reduce(
      (acc, summary) => {
        acc.totalDialed += summary.totalDialed;
        acc.connectedCalls += summary.connectedCalls;
        acc.qualifiedLeads += summary.qualifiedLeads;
        acc.convertedLeads += summary.convertedLeads;
        return acc;
      },
      {
        totalDialed: 0,
        connectedCalls: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
      }
    );

    const connectionRate =
      metrics.totalDialed > 0 ? (metrics.connectedCalls / metrics.totalDialed) * 100 : 0;
    const conversionRate =
      metrics.qualifiedLeads > 0 ? (metrics.convertedLeads / metrics.qualifiedLeads) * 100 : 0;

    const avgDailyDialed = dailySummaries.length > 0 ? metrics.totalDialed / dailySummaries.length : 0;
    const peakDayDialed = Math.max(...dailySummaries.map(s => s.totalDialed), 0);

    const uniqueKey: any = { year, weekNumber };
    if (campaignId !== null && campaignId !== undefined) uniqueKey.campaignId = campaignId;
    if (teamId !== null && teamId !== undefined) uniqueKey.teamId = teamId;

    const dataFields: any = {
      ...metrics,
      connectionRate,
      conversionRate,
      avgDailyDialed,
      peakDayDialed,
    };

    return this.prisma.weeklySummary.upsert({
      where: {
        year_weekNumber_campaignId_teamId: uniqueKey,
      },
      update: dataFields,
      create: {
        year,
        weekNumber,
        weekStart,
        weekEnd,
        ...dataFields,
        ...(campaignId !== null && campaignId !== undefined && { campaignId }),
        ...(teamId !== null && teamId !== undefined && { teamId }),
      },
    });
  }

  /**
   * Generate monthly summary
   */
  async generateMonthlySummary(
    year: number,
    month: number,
    campaignId?: number,
    teamId?: number
  ) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Get daily summaries for the month
    const dailySummaries = await this.prisma.dailySummary.findMany({
      where: {
        reportDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        campaignId: campaignId || null,
        teamId: teamId || null,
      },
    });

    // Aggregate metrics
    const metrics = dailySummaries.reduce(
      (acc, summary) => {
        acc.totalDialed += summary.totalDialed;
        acc.connectedCalls += summary.connectedCalls;
        acc.qualifiedLeads += summary.qualifiedLeads;
        acc.convertedLeads += summary.convertedLeads;
        return acc;
      },
      {
        totalDialed: 0,
        connectedCalls: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
      }
    );

    const connectionRate =
      metrics.totalDialed > 0 ? (metrics.connectedCalls / metrics.totalDialed) * 100 : 0;
    const conversionRate =
      metrics.qualifiedLeads > 0 ? (metrics.convertedLeads / metrics.qualifiedLeads) * 100 : 0;

    const avgDailyDialed = dailySummaries.length > 0 ? metrics.totalDialed / dailySummaries.length : 0;
    const peakDayDialed = Math.max(...dailySummaries.map(s => s.totalDialed), 0);
    const totalWorkingDays = dailySummaries.length;

    const uniqueKey: any = { year, month };
    if (campaignId !== null && campaignId !== undefined) uniqueKey.campaignId = campaignId;
    if (teamId !== null && teamId !== undefined) uniqueKey.teamId = teamId;

    const dataFields: any = {
      ...metrics,
      connectionRate,
      conversionRate,
      avgDailyDialed,
      peakDayDialed,
      totalWorkingDays,
    };

    return this.prisma.monthlySummary.upsert({
      where: {
        year_month_campaignId_teamId: uniqueKey,
      },
      update: dataFields,
      create: {
        year,
        month,
        monthStart,
        monthEnd,
        ...dataFields,
        ...(campaignId !== null && campaignId !== undefined && { campaignId }),
        ...(teamId !== null && teamId !== undefined && { teamId }),
      },
    });
  }

  /**
   * Get week number from date
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Regenerate all summaries for a date range
   */
  async regenerateSummaries(startDate: Date, endDate: Date) {
    const dates = this.getDatesBetween(startDate, endDate);

    for (const date of dates) {
      await this.generateDailySummary(date);
    }

    // Generate weekly summaries
    const weeks = this.getWeeksBetween(startDate, endDate);
    for (const week of weeks) {
      await this.generateWeeklySummary(week.start, week.end);
    }

    // Generate monthly summaries
    const months = this.getMonthsBetween(startDate, endDate);
    for (const month of months) {
      await this.generateMonthlySummary(month.year, month.month);
    }
  }

  private getDatesBetween(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private getWeeksBetween(start: Date, end: Date): Array<{ start: Date; end: Date }> {
    const weeks: Array<{ start: Date; end: Date }> = [];
    const current = new Date(start);

    // Move to start of week (Monday)
    current.setDate(current.getDate() - current.getDay() + 1);

    while (current <= end) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      weeks.push({ start: weekStart, end: weekEnd });
      current.setDate(current.getDate() + 7);
    }

    return weeks;
  }

  private getMonthsBetween(start: Date, end: Date): Array<{ year: number; month: number }> {
    const months: Array<{ year: number; month: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }
}
