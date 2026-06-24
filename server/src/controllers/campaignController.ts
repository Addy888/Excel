import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Get all campaigns
 */
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          agents: true,
          _count: {
            select: { agents: true }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.campaign.count({ where })
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
};

/**
 * Get campaign analytics
 */
export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      campaignId: Number(id)
    };

    if (startDate && endDate) {
      where.reportDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const campaignReports = await prisma.campaignReport.findMany({
      where,
      include: {
        campaign: true
      },
      orderBy: { reportDate: 'desc' }
    });

    // Calculate aggregates
    const totalDialed = campaignReports.reduce((sum, r) => sum + r.totalDialed, 0);
    const totalConnected = campaignReports.reduce((sum, r) => sum + r.connected, 0);
    const totalQualified = campaignReports.reduce((sum, r) => sum + r.qualified, 0);
    const totalConverted = campaignReports.reduce((sum, r) => sum + r.converted, 0);
    const avgConversionRate = campaignReports.length > 0
      ? campaignReports.reduce((sum, r) => sum + r.conversionRate, 0) / campaignReports.length
      : 0;

    res.json({
      success: true,
      data: {
        reports: campaignReports,
        summary: {
          totalDialed,
          totalConnected,
          totalQualified,
          totalConverted,
          avgConversionRate: Number(avgConversionRate.toFixed(2)),
          connectionRate: totalDialed > 0 ? Number(((totalConnected / totalDialed) * 100).toFixed(2)) : 0,
          qualificationRate: totalConnected > 0 ? Number(((totalQualified / totalConnected) * 100).toFixed(2)) : 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign analytics',
      error: error.message
    });
  }
};

/**
 * Get all campaign reports with stats
 */
export const getAllCampaignReports = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (startDate && endDate) {
      where.reportDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [reports, total] = await Promise.all([
      prisma.campaignReport.findMany({
        where,
        include: {
          campaign: true
        },
        orderBy: [
          { reportDate: 'desc' },
          { campaign: { name: 'asc' } }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.campaignReport.count({ where })
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching campaign reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign reports',
      error: error.message
    });
  }
};

/**
 * Create or update campaign report
 */
export const createCampaignReport = async (req: Request, res: Response) => {
  try {
    const {
      campaignId,
      reportDate,
      totalDialed,
      connected,
      qualified,
      converted,
      agentCount,
      metrics
    } = req.body;

    const conversionRate = totalDialed > 0 ? (converted / totalDialed) * 100 : 0;

    const report = await prisma.campaignReport.upsert({
      where: {
        campaignId_reportDate: {
          campaignId,
          reportDate: new Date(reportDate)
        }
      },
      update: {
        totalDialed,
        connected,
        qualified,
        converted,
        conversionRate,
        agentCount,
        metrics
      },
      create: {
        campaignId,
        reportDate: new Date(reportDate),
        totalDialed,
        connected,
        qualified,
        converted,
        conversionRate,
        agentCount,
        metrics
      },
      include: {
        campaign: true
      }
    });

    res.json({
      success: true,
      message: 'Campaign report created/updated successfully',
      data: report
    });
  } catch (error: any) {
    console.error('Error creating campaign report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign report',
      error: error.message
    });
  }
};

/**
 * Create campaign
 */
export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
};

/**
 * Get agents by campaign
 */
export const getCampaignAgents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agents = await prisma.agent.findMany({
      where: {
        campaignId: Number(id)
      },
      include: {
        team: true,
        campaign: true
      }
    });

    res.json({
      success: true,
      data: agents
    });
  } catch (error: any) {
    console.error('Error fetching campaign agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign agents',
      error: error.message
    });
  }
};
