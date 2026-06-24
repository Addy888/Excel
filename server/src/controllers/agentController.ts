import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Get all agents
 */
export const getAgents = async (req: Request, res: Response) => {
  try {
    const { search, campaignId, teamId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }
    
    if (campaignId) {
      where.campaignId = Number(campaignId);
    }
    
    if (teamId) {
      where.teamId = Number(teamId);
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          campaign: true,
          team: true
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.agent.count({ where })
    ]);

    res.json({
      success: true,
      data: agents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error.message
    });
  }
};

/**
 * Get agent performance dashboard
 */
export const getAgentPerformanceDashboard = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, campaignId, teamId } = req.query;

    const where: any = {};
    
    if (startDate && endDate) {
      where.reportDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Get agent performance data
    const performances = await prisma.agentPerformance.findMany({
      where,
      include: {
        agent: {
          include: {
            campaign: true,
            team: true
          }
        }
      },
      orderBy: { productivityScore: 'desc' }
    });

    // Filter by campaign or team if specified
    let filteredPerformances = performances;
    if (campaignId) {
      filteredPerformances = performances.filter(p => p.agent.campaignId === Number(campaignId));
    }
    if (teamId) {
      filteredPerformances = performances.filter(p => p.agent.teamId === Number(teamId));
    }

    // Aggregate by agent
    const agentMap = new Map();
    filteredPerformances.forEach(perf => {
      const agentId = perf.agentId;
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agent: perf.agent,
          totalCalls: 0,
          connectedCalls: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          avgConversionRate: 0,
          avgProductivityScore: 0,
          performances: []
        });
      }
      
      const agentData = agentMap.get(agentId);
      agentData.totalCalls += perf.totalCalls;
      agentData.connectedCalls += perf.connectedCalls;
      agentData.qualifiedLeads += perf.qualifiedLeads;
      agentData.convertedLeads += perf.convertedLeads;
      agentData.performances.push(perf);
    });

    // Calculate averages and rankings
    const agentStats = Array.from(agentMap.values()).map(data => {
      const perfCount = data.performances.length;
      const avgConversionRate = perfCount > 0
        ? data.performances.reduce((sum: number, p: any) => sum + p.conversionRate, 0) / perfCount
        : 0;
      const avgProductivityScore = perfCount > 0
        ? data.performances.reduce((sum: number, p: any) => sum + p.productivityScore, 0) / perfCount
        : 0;

      return {
        agent: data.agent,
        totalCalls: data.totalCalls,
        connectedCalls: data.connectedCalls,
        qualifiedLeads: data.qualifiedLeads,
        convertedLeads: data.convertedLeads,
        conversionRate: data.totalCalls > 0 
          ? Number(((data.convertedLeads / data.totalCalls) * 100).toFixed(2))
          : 0,
        avgConversionRate: Number(avgConversionRate.toFixed(2)),
        avgProductivityScore: Number(avgProductivityScore.toFixed(2))
      };
    });

    // Sort by productivity score
    agentStats.sort((a, b) => b.avgProductivityScore - a.avgProductivityScore);

    // Add ranks
    const rankedStats = agentStats.map((stat, index) => ({
      ...stat,
      rank: index + 1
    }));

    res.json({
      success: true,
      data: {
        topPerformers: rankedStats.slice(0, 10),
        allAgents: rankedStats,
        summary: {
          totalAgents: rankedStats.length,
          avgCalls: rankedStats.length > 0 
            ? Math.round(rankedStats.reduce((sum, s) => sum + s.totalCalls, 0) / rankedStats.length)
            : 0,
          avgConversionRate: rankedStats.length > 0
            ? Number((rankedStats.reduce((sum, s) => sum + s.avgConversionRate, 0) / rankedStats.length).toFixed(2))
            : 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching agent performance dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent performance dashboard',
      error: error.message
    });
  }
};

/**
 * Get individual agent performance
 */
export const getAgentPerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      agentId: Number(id)
    };

    if (startDate && endDate) {
      where.reportDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [agent, performances] = await Promise.all([
      prisma.agent.findUnique({
        where: { id: Number(id) },
        include: {
          campaign: true,
          team: true
        }
      }),
      prisma.agentPerformance.findMany({
        where,
        orderBy: { reportDate: 'desc' }
      })
    ]);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Calculate totals
    const totalCalls = performances.reduce((sum, p) => sum + p.totalCalls, 0);
    const connectedCalls = performances.reduce((sum, p) => sum + p.connectedCalls, 0);
    const qualifiedLeads = performances.reduce((sum, p) => sum + p.qualifiedLeads, 0);
    const convertedLeads = performances.reduce((sum, p) => sum + p.convertedLeads, 0);
    const avgConversionRate = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.conversionRate, 0) / performances.length
      : 0;
    const avgProductivityScore = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.productivityScore, 0) / performances.length
      : 0;

    res.json({
      success: true,
      data: {
        agent,
        performances,
        summary: {
          totalCalls,
          connectedCalls,
          qualifiedLeads,
          convertedLeads,
          conversionRate: totalCalls > 0 ? Number(((convertedLeads / totalCalls) * 100).toFixed(2)) : 0,
          avgConversionRate: Number(avgConversionRate.toFixed(2)),
          avgProductivityScore: Number(avgProductivityScore.toFixed(2)),
          connectionRate: totalCalls > 0 ? Number(((connectedCalls / totalCalls) * 100).toFixed(2)) : 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent performance',
      error: error.message
    });
  }
};

/**
 * Create or update agent performance
 */
export const createAgentPerformance = async (req: Request, res: Response) => {
  try {
    const {
      agentId,
      reportDate,
      totalCalls,
      connectedCalls,
      qualifiedLeads,
      convertedLeads
    } = req.body;

    const conversionRate = totalCalls > 0 ? (convertedLeads / totalCalls) * 100 : 0;
    const productivityScore = calculateProductivityScore({
      totalCalls,
      connectedCalls,
      qualifiedLeads,
      convertedLeads
    });

    const performance = await prisma.agentPerformance.upsert({
      where: {
        agentId_reportDate: {
          agentId,
          reportDate: new Date(reportDate)
        }
      },
      update: {
        totalCalls,
        connectedCalls,
        qualifiedLeads,
        convertedLeads,
        conversionRate,
        productivityScore
      },
      create: {
        agentId,
        reportDate: new Date(reportDate),
        totalCalls,
        connectedCalls,
        qualifiedLeads,
        convertedLeads,
        conversionRate,
        productivityScore
      },
      include: {
        agent: true
      }
    });

    res.json({
      success: true,
      message: 'Agent performance created/updated successfully',
      data: performance
    });
  } catch (error: any) {
    console.error('Error creating agent performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agent performance',
      error: error.message
    });
  }
};

/**
 * Create agent
 */
export const createAgent = async (req: Request, res: Response) => {
  try {
    const { name, email, campaignId, teamId } = req.body;

    const agent = await prisma.agent.create({
      data: {
        name,
        email,
        campaignId: campaignId ? Number(campaignId) : null,
        teamId: teamId ? Number(teamId) : null
      },
      include: {
        campaign: true,
        team: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: agent
    });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agent',
      error: error.message
    });
  }
};

/**
 * Calculate productivity score based on various metrics
 */
function calculateProductivityScore(data: {
  totalCalls: number;
  connectedCalls: number;
  qualifiedLeads: number;
  convertedLeads: number;
}): number {
  const { totalCalls, connectedCalls, qualifiedLeads, convertedLeads } = data;

  if (totalCalls === 0) return 0;

  // Weighted scoring formula
  const connectionRate = (connectedCalls / totalCalls) * 100;
  const qualificationRate = connectedCalls > 0 ? (qualifiedLeads / connectedCalls) * 100 : 0;
  const conversionRate = (convertedLeads / totalCalls) * 100;

  // Weight factors
  const score = (
    (connectionRate * 0.3) +
    (qualificationRate * 0.3) +
    (conversionRate * 0.4)
  );

  return Number(score.toFixed(2));
}
