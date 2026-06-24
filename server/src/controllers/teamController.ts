import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Create a team
 */
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error: any) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team',
      error: error.message
    });
  }
};

/**
 * Get all teams
 */
export const getTeams = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          agents: {
            include: {
              campaign: true
            }
          },
          _count: {
            select: { agents: true }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.team.count({ where })
    ]);

    res.json({
      success: true,
      data: teams,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
};

/**
 * Get team by ID
 */
export const getTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: Number(id) },
      include: {
        agents: {
          include: {
            campaign: true,
            agentPerformance: {
              orderBy: { reportDate: 'desc' },
              take: 30
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Calculate team statistics
    const teamStats = calculateTeamStats(team);

    res.json({
      success: true,
      data: {
        ...team,
        statistics: teamStats
      }
    });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team',
      error: error.message
    });
  }
};

/**
 * Update team
 */
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const team = await prisma.team.update({
      where: { id: Number(id) },
      data: {
        name,
        description
      }
    });

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error: any) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team',
      error: error.message
    });
  }
};

/**
 * Delete team
 */
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if team has agents
    const agentCount = await prisma.agent.count({
      where: { teamId: Number(id) }
    });

    if (agentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team with assigned agents'
      });
    }

    await prisma.team.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team',
      error: error.message
    });
  }
};

/**
 * Get team performance
 */
export const getTeamPerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const team = await prisma.team.findUnique({
      where: { id: Number(id) },
      include: {
        agents: true
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const agentIds = team.agents.map(a => a.id);

    const where: any = {
      agentId: { in: agentIds }
    };

    if (startDate && endDate) {
      where.reportDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const performances = await prisma.agentPerformance.findMany({
      where,
      include: {
        agent: true
      },
      orderBy: { reportDate: 'desc' }
    });

    // Aggregate performance
    const aggregated = performances.reduce((acc, perf) => {
      acc.totalCalls += perf.totalCalls;
      acc.connectedCalls += perf.connectedCalls;
      acc.qualifiedLeads += perf.qualifiedLeads;
      acc.convertedLeads += perf.convertedLeads;
      return acc;
    }, {
      totalCalls: 0,
      connectedCalls: 0,
      qualifiedLeads: 0,
      convertedLeads: 0
    });

    const avgConversionRate = aggregated.totalCalls > 0
      ? (aggregated.convertedLeads / aggregated.totalCalls) * 100
      : 0;

    const avgConnectionRate = aggregated.totalCalls > 0
      ? (aggregated.connectedCalls / aggregated.totalCalls) * 100
      : 0;

    res.json({
      success: true,
      data: {
        team,
        performance: {
          ...aggregated,
          conversionRate: Number(avgConversionRate.toFixed(2)),
          connectionRate: Number(avgConnectionRate.toFixed(2)),
          agentCount: team.agents.length
        },
        agentPerformances: performances
      }
    });
  } catch (error: any) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team performance',
      error: error.message
    });
  }
};

/**
 * Assign agent to team
 */
export const assignAgentToTeam = async (req: Request, res: Response) => {
  try {
    const { teamId, agentId } = req.body;

    const agent = await prisma.agent.update({
      where: { id: Number(agentId) },
      data: {
        teamId: Number(teamId)
      },
      include: {
        team: true,
        campaign: true
      }
    });

    res.json({
      success: true,
      message: 'Agent assigned to team successfully',
      data: agent
    });
  } catch (error: any) {
    console.error('Error assigning agent to team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign agent to team',
      error: error.message
    });
  }
};

/**
 * Remove agent from team
 */
export const removeAgentFromTeam = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.update({
      where: { id: Number(agentId) },
      data: {
        teamId: null
      },
      include: {
        campaign: true
      }
    });

    res.json({
      success: true,
      message: 'Agent removed from team successfully',
      data: agent
    });
  } catch (error: any) {
    console.error('Error removing agent from team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove agent from team',
      error: error.message
    });
  }
};

/**
 * Calculate team statistics
 */
function calculateTeamStats(team: any): any {
  const agents = team.agents || [];
  
  const stats = {
    totalAgents: agents.length,
    totalCalls: 0,
    totalConnected: 0,
    totalQualified: 0,
    totalConverted: 0,
    avgProductivityScore: 0
  };

  let productivityScoreSum = 0;
  let productivityScoreCount = 0;

  agents.forEach((agent: any) => {
    if (agent.agentPerformance && agent.agentPerformance.length > 0) {
      agent.agentPerformance.forEach((perf: any) => {
        stats.totalCalls += perf.totalCalls;
        stats.totalConnected += perf.connectedCalls;
        stats.totalQualified += perf.qualifiedLeads;
        stats.totalConverted += perf.convertedLeads;
        productivityScoreSum += perf.productivityScore;
        productivityScoreCount++;
      });
    }
  });

  if (productivityScoreCount > 0) {
    stats.avgProductivityScore = Number((productivityScoreSum / productivityScoreCount).toFixed(2));
  }

  return stats;
}
