import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Create a dynamic KPI
 */
export const createKPI = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      formula,
      category,
      displayFormat,
      thresholds,
      isActive
    } = req.body;

    const kpi = await prisma.processingRule.create({
      data: {
        name,
        description,
        condition: {
          type: 'kpi',
          formula,
          category: category || 'general',
          displayFormat: displayFormat || 'number',
          thresholds: thresholds || {}
        },
        action: {
          type: 'display'
        },
        isActive: isActive !== undefined ? isActive : true,
        order: 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'KPI created successfully',
      data: kpi
    });
  } catch (error: any) {
    console.error('Error creating KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create KPI',
      error: error.message
    });
  }
};

/**
 * Get all KPIs
 */
export const getKPIs = async (req: Request, res: Response) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      condition: {
        path: ['type'],
        equals: 'kpi'
      },
      isActive: true
    };

    const [kpis, total] = await Promise.all([
      prisma.processingRule.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: Number(limit)
      }),
      prisma.processingRule.count({ where })
    ]);

    res.json({
      success: true,
      data: kpis,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPIs',
      error: error.message
    });
  }
};

/**
 * Calculate KPI values for dashboard
 */
export const calculateKPIValues = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.processedDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      dateFilter.processedDate = {
        gte: today,
        lt: tomorrow
      };
    }

    // Get all active KPIs
    const kpis = await prisma.customKpi.findMany({
      where: {
        isActive: true
      },
      include: {
        formula: true
      }
    });

    // Get processed reports for the date range
    const reports = await prisma.processedReport.findMany({
      where: dateFilter
    });

    // Calculate aggregate data
    const aggregateData = reports.reduce((acc, report) => {
      acc.totalDialed += report.totalDialed;
      acc.connectedCalls += report.connectedCalls;
      acc.qualifiedLeads += report.qualifiedLeads;
      acc.convertedLeads += report.convertedLeads;
      acc.uniqueNumbers += report.uniqueNumbers;
      return acc;
    }, {
      totalDialed: 0,
      connectedCalls: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      uniqueNumbers: 0
    });

    // Calculate KPI values
    const kpiValues = kpis.map(kpi => {
      const value = kpi.calculation ? evaluateKPIFormula(kpi.calculation, aggregateData) : 0;
      const status = getKPIStatus(value, kpi.targetValue || 0, kpi.comparison);

      return {
        id: kpi.id,
        name: kpi.name,
        description: kpi.description,
        value,
        displayFormat: kpi.displayFormat || 'number',
        status,
        targetValue: kpi.targetValue,
        comparison: kpi.comparison
      };
    });

    res.json({
      success: true,
      data: kpiValues,
      aggregateData,
      dateRange: {
        start: startDate || new Date().toISOString().split('T')[0],
        end: endDate || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    console.error('Error calculating KPI values:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate KPI values',
      error: error.message
    });
  }
};

/**
 * Update KPI
 */
export const updateKPI = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      formula,
      category,
      displayFormat,
      thresholds,
      isActive,
      order
    } = req.body;

    const existingKPI = await prisma.processingRule.findUnique({
      where: { id: Number(id) }
    });

    if (!existingKPI) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found'
      });
    }

    const updatedCondition = {
      ...(existingKPI.condition as any),
      formula: formula || (existingKPI.condition as any).formula,
      category: category || (existingKPI.condition as any).category,
      displayFormat: displayFormat || (existingKPI.condition as any).displayFormat,
      thresholds: thresholds || (existingKPI.condition as any).thresholds
    };

    const kpi = await prisma.processingRule.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        condition: updatedCondition,
        isActive,
        order: order !== undefined ? order : existingKPI.order
      }
    });

    res.json({
      success: true,
      message: 'KPI updated successfully',
      data: kpi
    });
  } catch (error: any) {
    console.error('Error updating KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update KPI',
      error: error.message
    });
  }
};

/**
 * Delete KPI
 */
export const deleteKPI = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.processingRule.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'KPI deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete KPI',
      error: error.message
    });
  }
};

/**
 * Get built-in KPIs
 */
export const getBuiltInKPIs = async (req: Request, res: Response) => {
  try {
    const builtInKPIs = [
      {
        name: "Today's Conversion Rate",
        description: 'Percentage of converted leads today',
        formula: '(convertedLeads / totalDialed) * 100',
        category: 'conversion',
        displayFormat: 'percentage',
        thresholds: {
          excellent: 15,
          good: 10,
          average: 5,
          poor: 0
        }
      },
      {
        name: "Today's Connection Rate",
        description: 'Percentage of connected calls today',
        formula: '(connectedCalls / totalDialed) * 100',
        category: 'connection',
        displayFormat: 'percentage',
        thresholds: {
          excellent: 70,
          good: 50,
          average: 30,
          poor: 0
        }
      },
      {
        name: "Today's Total Calls",
        description: 'Total number of calls dialed today',
        formula: 'totalDialed',
        category: 'volume',
        displayFormat: 'number',
        thresholds: {
          excellent: 1000,
          good: 500,
          average: 100,
          poor: 0
        }
      },
      {
        name: "Today's Qualified Leads",
        description: 'Number of qualified leads generated today',
        formula: 'qualifiedLeads',
        category: 'leads',
        displayFormat: 'number',
        thresholds: {
          excellent: 100,
          good: 50,
          average: 20,
          poor: 0
        }
      },
      {
        name: 'Qualification Rate',
        description: 'Percentage of qualified leads from connected calls',
        formula: '(qualifiedLeads / connectedCalls) * 100',
        category: 'qualification',
        displayFormat: 'percentage',
        thresholds: {
          excellent: 50,
          good: 30,
          average: 15,
          poor: 0
        }
      }
    ];

    res.json({
      success: true,
      data: builtInKPIs
    });
  } catch (error: any) {
    console.error('Error fetching built-in KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch built-in KPIs',
      error: error.message
    });
  }
};

/**
 * Evaluate KPI formula
 */
function evaluateKPIFormula(formula: string, data: any): number {
  try {
    let expression = formula;
    
    // Replace variables
    Object.keys(data).forEach(key => {
      const regex = new RegExp(key, 'g');
      expression = expression.replace(regex, String(data[key]));
    });

    const result = Function(`'use strict'; return (${expression})`)();
    return Number(result.toFixed(2));
  } catch (error) {
    console.error('KPI formula evaluation error:', error);
    return 0;
  }
}

/**
 * Get KPI status based on comparison
 */
function getKPIStatus(value: number, targetValue: number, comparison: string): string {
  if (targetValue === null || targetValue === undefined) return 'unknown';
  
  switch (comparison) {
    case '>=':
      return value >= targetValue ? 'achieved' : 'not_achieved';
    case '<=':
      return value <= targetValue ? 'achieved' : 'not_achieved';
    case '=':
      return value === targetValue ? 'achieved' : 'not_achieved';
    case '!=':
      return value !== targetValue ? 'achieved' : 'not_achieved';
    default:
      return 'unknown';
  }
}
