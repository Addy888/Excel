import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Create a custom report design
 */
export const createReportDesign = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      columns,
      metrics,
      summaries,
      layout,
      filters
    } = req.body;
    const userId = (req as any).user.id;

    const design = await prisma.reportTemplate.create({
      data: {
        name,
        description,
        columns: columns || [],
        formulas: metrics || [],
        aggregations: summaries || [],
        createdById: userId,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Report design created successfully',
      data: design
    });
  } catch (error: any) {
    console.error('Error creating report design:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report design',
      error: error.message
    });
  }
};

/**
 * Get all report designs
 */
export const getReportDesigns = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.roleName;
    const { search, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      isActive: true
    };

    // Non-admin users can only see their own designs
    if (userRole !== 'admin') {
      where.createdById = userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    const [designs, total] = await Promise.all([
      prisma.reportTemplate.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.reportTemplate.count({ where })
    ]);

    res.json({
      success: true,
      data: designs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching report designs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report designs',
      error: error.message
    });
  }
};

/**
 * Get report design by ID
 */
export const getReportDesign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const design = await prisma.reportTemplate.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Report design not found'
      });
    }

    res.json({
      success: true,
      data: design
    });
  } catch (error: any) {
    console.error('Error fetching report design:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report design',
      error: error.message
    });
  }
};

/**
 * Update report design
 */
export const updateReportDesign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      columns,
      metrics,
      summaries,
      layout,
      isActive
    } = req.body;

    const design = await prisma.reportTemplate.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        columns: columns || undefined,
        formulas: metrics || undefined,
        aggregations: summaries || undefined,
        isActive
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Report design updated successfully',
      data: design
    });
  } catch (error: any) {
    console.error('Error updating report design:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report design',
      error: error.message
    });
  }
};

/**
 * Delete report design
 */
export const deleteReportDesign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.reportTemplate.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Report design deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting report design:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report design',
      error: error.message
    });
  }
};

/**
 * Apply report design to data
 */
export const applyReportDesign = async (req: Request, res: Response) => {
  try {
    const { designId, reportId } = req.body;

    const [design, report] = await Promise.all([
      prisma.reportTemplate.findUnique({
        where: { id: Number(designId) }
      }),
      prisma.processedReport.findUnique({
        where: { id: Number(reportId) },
        include: {
          uploadedReport: true
        }
      })
    ]);

    if (!design || !report) {
      return res.status(404).json({
        success: false,
        message: 'Design or report not found'
      });
    }

    // Apply design transformations
    const transformedData = applyDesignTransformations(report, design);

    res.json({
      success: true,
      data: transformedData
    });
  } catch (error: any) {
    console.error('Error applying report design:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply report design',
      error: error.message
    });
  }
};

/**
 * Apply design transformations to report data
 */
function applyDesignTransformations(report: any, design: any): any {
  const result: any = {
    reportId: report.id,
    designName: design.name,
    data: {}
  };

  // Apply column selections
  if (design.columns && Array.isArray(design.columns)) {
    result.selectedColumns = design.columns;
  }

  // Apply formulas/metrics
  if (design.formulas && Array.isArray(design.formulas)) {
    result.calculatedMetrics = design.formulas.map((formula: any) => {
      return {
        name: formula.name,
        value: evaluateFormula(formula, report)
      };
    });
  }

  // Apply aggregations/summaries
  if (design.aggregations && Array.isArray(design.aggregations)) {
    result.summaries = design.aggregations.map((agg: any) => {
      return {
        name: agg.name,
        value: evaluateAggregation(agg, report)
      };
    });
  }

  result.data = {
    summary: report,
    agentWiseSummary: report.agentWiseSummary,
    dateWiseSummary: report.dateWiseSummary,
    statusWiseSummary: report.statusWiseSummary
  };

  return result;
}

/**
 * Evaluate formula
 */
function evaluateFormula(formula: any, report: any): number {
  try {
    // Simple formula evaluation
    let expression = formula.expression || formula.formula;
    
    // Replace variables with actual values
    expression = expression.replace(/totalDialed/g, report.totalDialed);
    expression = expression.replace(/connectedCalls/g, report.connectedCalls);
    expression = expression.replace(/qualifiedLeads/g, report.qualifiedLeads);
    expression = expression.replace(/convertedLeads/g, report.convertedLeads);

    // Evaluate (use Function constructor for simple expressions only)
    const result = Function(`'use strict'; return (${expression})`)();
    return Number(result.toFixed(2));
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return 0;
  }
}

/**
 * Evaluate aggregation
 */
function evaluateAggregation(agg: any, report: any): any {
  try {
    switch (agg.type) {
      case 'sum':
        return report[agg.field] || 0;
      case 'average':
        return report[agg.field] || 0;
      case 'count':
        return report.agentWiseSummary?.length || 0;
      default:
        return 0;
    }
  } catch (error) {
    console.error('Aggregation evaluation error:', error);
    return 0;
  }
}
