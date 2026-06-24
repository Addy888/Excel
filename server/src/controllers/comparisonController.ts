import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Compare two processed reports
 */
export const compareReports = async (req: Request, res: Response) => {
  try {
    const { report1Id, report2Id, name } = req.body;
    const userId = (req as any).user.id;

    // Fetch both reports
    const [report1, report2] = await Promise.all([
      prisma.processedReport.findUnique({
        where: { id: Number(report1Id) },
        include: {
          uploadedReport: true
        }
      }),
      prisma.processedReport.findUnique({
        where: { id: Number(report2Id) },
        include: {
          uploadedReport: true
        }
      })
    ]);

    if (!report1 || !report2) {
      return res.status(404).json({
        success: false,
        message: 'One or both reports not found'
      });
    }

    // Calculate differences
    const comparison = {
      summary: {
        totalDialed: {
          report1: report1.totalDialed,
          report2: report2.totalDialed,
          difference: report2.totalDialed - report1.totalDialed,
          percentChange: report1.totalDialed > 0 
            ? Number((((report2.totalDialed - report1.totalDialed) / report1.totalDialed) * 100).toFixed(2))
            : 0
        },
        connectedCalls: {
          report1: report1.connectedCalls,
          report2: report2.connectedCalls,
          difference: report2.connectedCalls - report1.connectedCalls,
          percentChange: report1.connectedCalls > 0 
            ? Number((((report2.connectedCalls - report1.connectedCalls) / report1.connectedCalls) * 100).toFixed(2))
            : 0
        },
        qualifiedLeads: {
          report1: report1.qualifiedLeads,
          report2: report2.qualifiedLeads,
          difference: report2.qualifiedLeads - report1.qualifiedLeads,
          percentChange: report1.qualifiedLeads > 0 
            ? Number((((report2.qualifiedLeads - report1.qualifiedLeads) / report1.qualifiedLeads) * 100).toFixed(2))
            : 0
        },
        convertedLeads: {
          report1: report1.convertedLeads,
          report2: report2.convertedLeads,
          difference: report2.convertedLeads - report1.convertedLeads,
          percentChange: report1.convertedLeads > 0 
            ? Number((((report2.convertedLeads - report1.convertedLeads) / report1.convertedLeads) * 100).toFixed(2))
            : 0
        },
        uniqueNumbers: {
          report1: report1.uniqueNumbers,
          report2: report2.uniqueNumbers,
          difference: report2.uniqueNumbers - report1.uniqueNumbers,
          percentChange: report1.uniqueNumbers > 0 
            ? Number((((report2.uniqueNumbers - report1.uniqueNumbers) / report1.uniqueNumbers) * 100).toFixed(2))
            : 0
        }
      },
      report1Details: {
        id: report1.id,
        fileName: report1.uploadedReport.originalName,
        processedDate: report1.processedDate
      },
      report2Details: {
        id: report2.id,
        fileName: report2.uploadedReport.originalName,
        processedDate: report2.processedDate
      },
      insights: generateInsights(report1, report2)
    };

    // Save comparison
    const savedComparison = await prisma.reportComparison.create({
      data: {
        name: name || `Comparison: ${report1.uploadedReport.originalName} vs ${report2.uploadedReport.originalName}`,
        report1Id: Number(report1Id),
        report2Id: Number(report2Id),
        comparisonData: comparison,
        createdById: userId
      }
    });

    res.json({
      success: true,
      data: {
        ...savedComparison,
        comparison
      }
    });
  } catch (error: any) {
    console.error('Error comparing reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare reports',
      error: error.message
    });
  }
};

/**
 * Get all saved comparisons
 */
export const getComparisons = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [comparisons, total] = await Promise.all([
      prisma.reportComparison.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.reportComparison.count()
    ]);

    res.json({
      success: true,
      data: comparisons,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching comparisons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparisons',
      error: error.message
    });
  }
};

/**
 * Get a specific comparison
 */
export const getComparison = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comparison = await prisma.reportComparison.findUnique({
      where: { id: Number(id) }
    });

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Comparison not found'
      });
    }

    // Fetch the actual reports for reference
    const [report1, report2] = await Promise.all([
      prisma.processedReport.findUnique({
        where: { id: comparison.report1Id },
        include: { uploadedReport: true }
      }),
      prisma.processedReport.findUnique({
        where: { id: comparison.report2Id },
        include: { uploadedReport: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        ...comparison,
        report1,
        report2
      }
    });
  } catch (error: any) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison',
      error: error.message
    });
  }
};

/**
 * Delete a comparison
 */
export const deleteComparison = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.reportComparison.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Comparison deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comparison',
      error: error.message
    });
  }
};

/**
 * Generate insights from comparison
 */
function generateInsights(report1: any, report2: any): string[] {
  const insights: string[] = [];

  // Total Dialed insights
  const dialedDiff = report2.totalDialed - report1.totalDialed;
  const dialedPercent = report1.totalDialed > 0 
    ? ((dialedDiff / report1.totalDialed) * 100).toFixed(1)
    : '0';
  if (Math.abs(Number(dialedPercent)) > 5) {
    insights.push(
      dialedDiff > 0
        ? `Total dialed calls increased by ${Math.abs(Number(dialedPercent))}% (${dialedDiff} more calls)`
        : `Total dialed calls decreased by ${Math.abs(Number(dialedPercent))}% (${Math.abs(dialedDiff)} fewer calls)`
    );
  }

  // Connection Rate insights
  const connRate1 = report1.totalDialed > 0 ? (report1.connectedCalls / report1.totalDialed) * 100 : 0;
  const connRate2 = report2.totalDialed > 0 ? (report2.connectedCalls / report2.totalDialed) * 100 : 0;
  const connRateDiff = connRate2 - connRate1;
  if (Math.abs(connRateDiff) > 2) {
    insights.push(
      connRateDiff > 0
        ? `Connection rate improved by ${connRateDiff.toFixed(1)}%`
        : `Connection rate decreased by ${Math.abs(connRateDiff).toFixed(1)}%`
    );
  }

  // Qualified Leads insights
  const qualDiff = report2.qualifiedLeads - report1.qualifiedLeads;
  const qualPercent = report1.qualifiedLeads > 0 
    ? ((qualDiff / report1.qualifiedLeads) * 100).toFixed(1)
    : '0';
  if (Math.abs(Number(qualPercent)) > 5) {
    insights.push(
      qualDiff > 0
        ? `Qualified leads increased by ${Math.abs(Number(qualPercent))}% (${qualDiff} more leads)`
        : `Qualified leads decreased by ${Math.abs(Number(qualPercent))}% (${Math.abs(qualDiff)} fewer leads)`
    );
  }

  // Conversion insights
  const convRate1 = report1.totalDialed > 0 ? (report1.convertedLeads / report1.totalDialed) * 100 : 0;
  const convRate2 = report2.totalDialed > 0 ? (report2.convertedLeads / report2.totalDialed) * 100 : 0;
  const convRateDiff = convRate2 - convRate1;
  if (Math.abs(convRateDiff) > 1) {
    insights.push(
      convRateDiff > 0
        ? `Conversion rate improved by ${convRateDiff.toFixed(1)}%`
        : `Conversion rate dropped by ${Math.abs(convRateDiff).toFixed(1)}%`
    );
  }

  // Overall performance
  if (report2.convertedLeads > report1.convertedLeads && connRate2 > connRate1) {
    insights.push('Overall performance is trending positively');
  } else if (report2.convertedLeads < report1.convertedLeads && connRate2 < connRate1) {
    insights.push('Overall performance needs attention');
  }

  return insights;
}
