/**
 * Advanced Filtering Service for MIS Reports
 */

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  agent?: string;
  agents?: string[];
  status?: string;
  statuses?: string[];
  campaign?: string;
  campaigns?: string[];
  team?: string;
  teams?: string[];
  supervisor?: string;
  minCalls?: number;
  maxCalls?: number;
  minConversionRate?: number;
  maxConversionRate?: number;
}

export class FilterService {
  /**
   * Build Prisma where clause from filter options
   */
  static buildWhereClause(filters: FilterOptions): any {
    const where: any = {};

    // Date range filter
    if (filters.dateRange) {
      where.processedDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    // Call count filters
    if (filters.minCalls !== undefined) {
      where.totalDialed = { ...where.totalDialed, gte: filters.minCalls };
    }
    if (filters.maxCalls !== undefined) {
      where.totalDialed = { ...where.totalDialed, lte: filters.maxCalls };
    }

    return where;
  }

  /**
   * Filter report data based on criteria
   */
  static filterReportData(
    data: any[],
    filters: FilterOptions
  ): any[] {
    let filteredData = [...data];

    // Filter by agent
    if (filters.agent) {
      filteredData = filteredData.filter(row => 
        row.Agent && row.Agent.toLowerCase().includes(filters.agent!.toLowerCase())
      );
    }

    if (filters.agents && filters.agents.length > 0) {
      filteredData = filteredData.filter(row =>
        row.Agent && filters.agents!.some(agent =>
          row.Agent.toLowerCase().includes(agent.toLowerCase())
        )
      );
    }

    // Filter by status
    if (filters.status) {
      filteredData = filteredData.filter(row =>
        row.Status && row.Status.toLowerCase().includes(filters.status!.toLowerCase())
      );
    }

    if (filters.statuses && filters.statuses.length > 0) {
      filteredData = filteredData.filter(row =>
        row.Status && filters.statuses!.some(status =>
          row.Status.toLowerCase().includes(status.toLowerCase())
        )
      );
    }

    // Filter by campaign
    if (filters.campaign) {
      filteredData = filteredData.filter(row =>
        row.Campaign && row.Campaign.toLowerCase().includes(filters.campaign!.toLowerCase())
      );
    }

    if (filters.campaigns && filters.campaigns.length > 0) {
      filteredData = filteredData.filter(row =>
        row.Campaign && filters.campaigns!.some(campaign =>
          row.Campaign.toLowerCase().includes(campaign.toLowerCase())
        )
      );
    }

    // Filter by team
    if (filters.team) {
      filteredData = filteredData.filter(row =>
        row.Team && row.Team.toLowerCase().includes(filters.team!.toLowerCase())
      );
    }

    if (filters.teams && filters.teams.length > 0) {
      filteredData = filteredData.filter(row =>
        row.Team && filters.teams!.some(team =>
          row.Team.toLowerCase().includes(team.toLowerCase())
        )
      );
    }

    // Filter by supervisor
    if (filters.supervisor) {
      filteredData = filteredData.filter(row =>
        row.Supervisor && row.Supervisor.toLowerCase().includes(filters.supervisor!.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      filteredData = filteredData.filter(row => {
        if (!row.Date) return false;
        
        const rowDate = new Date(row.Date);
        return rowDate >= filters.dateRange!.start && rowDate <= filters.dateRange!.end;
      });
    }

    return filteredData;
  }

  /**
   * Get unique values for filter dropdowns
   */
  static extractFilterOptions(data: any[]): {
    agents: string[];
    statuses: string[];
    campaigns: string[];
    teams: string[];
    supervisors: string[];
  } {
    const agents = new Set<string>();
    const statuses = new Set<string>();
    const campaigns = new Set<string>();
    const teams = new Set<string>();
    const supervisors = new Set<string>();

    data.forEach(row => {
      if (row.Agent) agents.add(row.Agent);
      if (row.Status) statuses.add(row.Status);
      if (row.Campaign) campaigns.add(row.Campaign);
      if (row.Team) teams.add(row.Team);
      if (row.Supervisor) supervisors.add(row.Supervisor);
    });

    return {
      agents: Array.from(agents).sort(),
      statuses: Array.from(statuses).sort(),
      campaigns: Array.from(campaigns).sort(),
      teams: Array.from(teams).sort(),
      supervisors: Array.from(supervisors).sort()
    };
  }

  /**
   * Apply filters and return filtered processed report data
   */
  static applyFilters(
    reportData: any,
    filters: FilterOptions
  ): any {
    // Filter agent-wise summary
    let agentWiseSummary = reportData.agentWiseSummary || [];
    if (filters.agents && filters.agents.length > 0) {
      agentWiseSummary = agentWiseSummary.filter((agent: any) =>
        filters.agents!.includes(agent.agent)
      );
    }

    // Filter date-wise summary
    let dateWiseSummary = reportData.dateWiseSummary || [];
    if (filters.dateRange) {
      dateWiseSummary = dateWiseSummary.filter((day: any) => {
        const date = new Date(day.date);
        return date >= filters.dateRange!.start && date <= filters.dateRange!.end;
      });
    }

    // Filter status-wise summary
    let statusWiseSummary = reportData.statusWiseSummary || [];
    if (filters.statuses && filters.statuses.length > 0) {
      statusWiseSummary = statusWiseSummary.filter((status: any) =>
        filters.statuses!.includes(status.status)
      );
    }

    // Recalculate totals
    const totals = this.calculateTotals(agentWiseSummary);

    return {
      ...reportData,
      ...totals,
      agentWiseSummary,
      dateWiseSummary,
      statusWiseSummary,
      appliedFilters: filters
    };
  }

  /**
   * Calculate totals from filtered data
   */
  private static calculateTotals(agentWiseSummary: any[]): any {
    const totals = {
      totalDialed: 0,
      connectedCalls: 0,
      notConnectedCalls: 0,
      qualifiedLeads: 0,
      inProcessLeads: 0,
      convertedLeads: 0,
      rejectedLeads: 0,
      duplicateNumbers: 0,
      uniqueNumbers: 0
    };

    agentWiseSummary.forEach(agent => {
      totals.totalDialed += agent.totalDialed || 0;
      totals.connectedCalls += agent.connected || 0;
      totals.notConnectedCalls += agent.notConnected || 0;
      totals.qualifiedLeads += agent.qualified || 0;
      totals.convertedLeads += agent.converted || 0;
    });

    return totals;
  }
}

export default FilterService;
