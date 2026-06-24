import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Create a custom formula
 */
export const createFormula = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      expression,
      variables,
      category,
      isActive
    } = req.body;

    // Validate formula expression
    const validation = validateFormula(expression, variables);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid formula',
        errors: validation.errors
      });
    }

    const formula = await prisma.processingRule.create({
      data: {
        name,
        description,
        condition: {
          type: 'formula',
          expression,
          variables,
          category: category || 'custom'
        },
        action: {
          type: 'calculate'
        },
        isActive: isActive !== undefined ? isActive : true,
        order: 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Formula created successfully',
      data: formula
    });
  } catch (error: any) {
    console.error('Error creating formula:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create formula',
      error: error.message
    });
  }
};

/**
 * Get all formulas
 */
export const getFormulas = async (req: Request, res: Response) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      condition: {
        path: ['type'],
        equals: 'formula'
      }
    };

    if (category) {
      where.condition = {
        ...where.condition,
        path: ['category'],
        equals: category
      };
    }

    const [formulas, total] = await Promise.all([
      prisma.processingRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.processingRule.count({ where })
    ]);

    res.json({
      success: true,
      data: formulas,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching formulas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch formulas',
      error: error.message
    });
  }
};

/**
 * Get formula by ID
 */
export const getFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const formula = await prisma.processingRule.findUnique({
      where: { id: Number(id) }
    });

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    res.json({
      success: true,
      data: formula
    });
  } catch (error: any) {
    console.error('Error fetching formula:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch formula',
      error: error.message
    });
  }
};

/**
 * Update formula
 */
export const updateFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      expression,
      variables,
      category,
      isActive
    } = req.body;

    // Validate formula if expression is being updated
    if (expression) {
      const validation = validateFormula(expression, variables);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid formula',
          errors: validation.errors
        });
      }
    }

    const existingFormula = await prisma.processingRule.findUnique({
      where: { id: Number(id) }
    });

    if (!existingFormula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    const updatedCondition = {
      ...(existingFormula.condition as any),
      expression: expression || (existingFormula.condition as any).expression,
      variables: variables || (existingFormula.condition as any).variables,
      category: category || (existingFormula.condition as any).category
    };

    const formula = await prisma.processingRule.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        condition: updatedCondition,
        isActive
      }
    });

    res.json({
      success: true,
      message: 'Formula updated successfully',
      data: formula
    });
  } catch (error: any) {
    console.error('Error updating formula:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update formula',
      error: error.message
    });
  }
};

/**
 * Delete formula
 */
export const deleteFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.processingRule.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Formula deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting formula:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete formula',
      error: error.message
    });
  }
};

/**
 * Test formula with sample data
 */
export const testFormula = async (req: Request, res: Response) => {
  try {
    const { expression, variables, sampleData } = req.body;

    // Validate formula
    const validation = validateFormula(expression, variables);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid formula',
        errors: validation.errors
      });
    }

    // Test with sample data
    const result = evaluateFormula(expression, sampleData || {
      totalDialed: 100,
      connectedCalls: 80,
      qualifiedLeads: 40,
      convertedLeads: 20
    });

    res.json({
      success: true,
      data: {
        expression,
        result,
        sampleData: sampleData || {
          totalDialed: 100,
          connectedCalls: 80,
          qualifiedLeads: 40,
          convertedLeads: 20
        }
      }
    });
  } catch (error: any) {
    console.error('Error testing formula:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test formula',
      error: error.message
    });
  }
};

/**
 * Get built-in formulas
 */
export const getBuiltInFormulas = async (req: Request, res: Response) => {
  try {
    const builtInFormulas = [
      {
        name: 'Conversion Rate',
        description: 'Percentage of converted leads from total dialed',
        expression: '(convertedLeads / totalDialed) * 100',
        variables: ['convertedLeads', 'totalDialed'],
        category: 'conversion'
      },
      {
        name: 'Connection Rate',
        description: 'Percentage of connected calls from total dialed',
        expression: '(connectedCalls / totalDialed) * 100',
        variables: ['connectedCalls', 'totalDialed'],
        category: 'connection'
      },
      {
        name: 'Qualification Rate',
        description: 'Percentage of qualified leads from connected calls',
        expression: '(qualifiedLeads / connectedCalls) * 100',
        variables: ['qualifiedLeads', 'connectedCalls'],
        category: 'qualification'
      },
      {
        name: 'Productivity Score',
        description: 'Weighted score based on performance metrics',
        expression: '(qualifiedLeads * 2) + connectedCalls',
        variables: ['qualifiedLeads', 'connectedCalls'],
        category: 'productivity'
      },
      {
        name: 'Success Rate',
        description: 'Combined success metric',
        expression: '((convertedLeads + qualifiedLeads) / totalDialed) * 100',
        variables: ['convertedLeads', 'qualifiedLeads', 'totalDialed'],
        category: 'success'
      },
      {
        name: 'Efficiency Score',
        description: 'Efficiency based on conversion and connection',
        expression: '((connectedCalls * 0.3) + (convertedLeads * 0.7)) / totalDialed * 100',
        variables: ['connectedCalls', 'convertedLeads', 'totalDialed'],
        category: 'efficiency'
      }
    ];

    res.json({
      success: true,
      data: builtInFormulas
    });
  } catch (error: any) {
    console.error('Error fetching built-in formulas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch built-in formulas',
      error: error.message
    });
  }
};

/**
 * Validate formula expression
 */
function validateFormula(expression: string, variables: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!expression || expression.trim() === '') {
    errors.push('Expression cannot be empty');
    return { isValid: false, errors };
  }

  // Check for dangerous characters/functions
  const dangerousPatterns = [
    /require\(/,
    /import\s/,
    /eval\(/,
    /Function\(/,
    /__proto__/,
    /constructor/,
    /process\./,
    /global\./
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(expression)) {
      errors.push('Expression contains dangerous code');
      return { isValid: false, errors };
    }
  }

  // Check if all variables are used in expression
  if (variables && Array.isArray(variables)) {
    for (const variable of variables) {
      if (!expression.includes(variable)) {
        errors.push(`Variable '${variable}' not found in expression`);
      }
    }
  }

  // Try to validate syntax
  try {
    const testData: any = {};
    variables?.forEach(v => {
      testData[v] = 1;
    });
    evaluateFormula(expression, testData);
  } catch (error) {
    errors.push('Invalid expression syntax');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Evaluate formula with data
 */
function evaluateFormula(expression: string, data: any): number {
  try {
    // Replace variables with values
    let evalExpression = expression;
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(key, 'g');
      evalExpression = evalExpression.replace(regex, String(data[key]));
    });

    // Evaluate safely
    const result = Function(`'use strict'; return (${evalExpression})`)();
    return Number(result.toFixed(2));
  } catch (error) {
    throw new Error('Formula evaluation failed');
  }
}
