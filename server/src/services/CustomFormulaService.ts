import { PrismaClient, CustomFormula } from '@prisma/client';
import { CustomFormulaRepository } from '../repositories/CustomFormulaRepository';

export class CustomFormulaService {
  private repository: CustomFormulaRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new CustomFormulaRepository(prisma);
  }

  async createFormula(data: {
    name: string;
    description?: string;
    formula: string;
    variables: string[];
    returnType: string;
    category?: string;
    createdById: number;
  }): Promise<CustomFormula> {
    // Validate formula syntax
    this.validateFormula(data.formula, data.variables);

    return this.repository.create({
      name: data.name,
      description: data.description,
      formula: data.formula,
      variables: data.variables,
      returnType: data.returnType,
      category: data.category,
      createdById: data.createdById,
      isActive: true,
    });
  }

  async updateFormula(
    id: number,
    data: {
      name?: string;
      description?: string;
      formula?: string;
      variables?: string[];
      returnType?: string;
      category?: string;
    }
  ): Promise<CustomFormula> {
    if (data.formula && data.variables) {
      this.validateFormula(data.formula, data.variables);
    }

    return this.repository.update(id, data);
  }

  async deleteFormula(id: number): Promise<CustomFormula> {
    // Soft delete by marking as inactive
    return this.repository.toggleActive(id, false);
  }

  async getAllFormulas(): Promise<CustomFormula[]> {
    return this.repository.findActive();
  }

  async getFormulasByCategory(category: string): Promise<CustomFormula[]> {
    return this.repository.findByCategory(category);
  }

  async getFormulaById(id: number): Promise<CustomFormula | null> {
    return this.repository.findById(id);
  }

  async evaluateFormula(formulaId: number, variables: Record<string, number>): Promise<number> {
    const formula = await this.repository.findById(formulaId);
    if (!formula) {
      throw new Error('Formula not found');
    }

    return this.executeFormula(formula.formula, variables);
  }

  private validateFormula(formula: string, variables: string[]): void {
    // Basic validation: check if all variables are used in formula
    for (const variable of variables) {
      if (!formula.includes(variable)) {
        throw new Error(`Variable ${variable} not found in formula`);
      }
    }

    // Check for potentially dangerous operations
    const dangerousPatterns = ['eval', 'Function', 'require', 'import', 'exec'];
    for (const pattern of dangerousPatterns) {
      if (formula.includes(pattern)) {
        throw new Error(`Formula contains dangerous operation: ${pattern}`);
      }
    }
  }

  private executeFormula(formula: string, variables: Record<string, number>): number {
    try {
      // Replace variables in formula with their values
      let processedFormula = formula;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(key, 'g');
        processedFormula = processedFormula.replace(regex, String(value));
      }

      // Safely evaluate the formula
      // In production, consider using a proper math expression parser
      // like mathjs or expr-eval for better security
      const result = Function(`"use strict"; return (${processedFormula})`)();

      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Formula evaluation did not return a valid number');
      }

      return result;
    } catch (error) {
      throw new Error(`Formula execution error: ${(error as Error).message}`);
    }
  }

  // Predefined formula examples
  async createPredefinedFormulas(userId: number): Promise<void> {
    const predefined = [
      {
        name: 'Conversion Rate',
        description: 'Calculate conversion rate from qualified leads to connected calls',
        formula: '(qualifiedLeads / connectedCalls) * 100',
        variables: ['qualifiedLeads', 'connectedCalls'],
        returnType: 'percentage',
        category: 'conversion',
        createdById: userId,
      },
      {
        name: 'Connection Rate',
        description: 'Calculate connection rate from total dialed calls',
        formula: '(connectedCalls / totalDialed) * 100',
        variables: ['connectedCalls', 'totalDialed'],
        returnType: 'percentage',
        category: 'performance',
        createdById: userId,
      },
      {
        name: 'Qualification Rate',
        description: 'Calculate qualification rate from connected calls',
        formula: '(qualifiedLeads / connectedCalls) * 100',
        variables: ['qualifiedLeads', 'connectedCalls'],
        returnType: 'percentage',
        category: 'quality',
        createdById: userId,
      },
      {
        name: 'Success Rate',
        description: 'Calculate overall success rate',
        formula: '(convertedLeads / totalDialed) * 100',
        variables: ['convertedLeads', 'totalDialed'],
        returnType: 'percentage',
        category: 'conversion',
        createdById: userId,
      },
    ];

    for (const formula of predefined) {
      const existing = await this.repository.findByName(formula.name);
      if (!existing) {
        await this.repository.create(formula);
      }
    }
  }
}
