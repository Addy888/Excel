import prisma from '../config/prisma';

// Define internal interface since IRule from Mongoose is gone
export interface IRule {
  id: number;
  name: string;
  condition: any;
  action: any;
  order: number;
  isActive: boolean;
}

export class RuleEngine {
  private rules: IRule[] = [];

  async loadRules() {
    const dbRules = await prisma.processingRule.findMany({ 
      where: { isActive: true },
      orderBy: { order: 'asc' } 
    });
    
    // Map to internal format
    this.rules = dbRules.map(r => ({
      id: r.id,
      name: r.name,
      condition: r.condition,
      action: r.action,
      order: r.order,
      isActive: r.isActive
    }));
  }

  evaluateConditions(row: any, conditions: any): boolean {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;

    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = row[condition.field];
      let conditionMet = false;

      switch (condition.operator) {
        case 'equals':
          conditionMet = String(fieldValue).toLowerCase() === String(condition.value).toLowerCase();
          break;
        case 'contains':
          conditionMet = String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
          break;
        case 'startsWith':
          conditionMet = String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase());
          break;
        case 'endsWith':
          conditionMet = String(fieldValue).toLowerCase().endsWith(String(condition.value).toLowerCase());
          break;
        case 'greaterThan':
          conditionMet = Number(fieldValue) > Number(condition.value);
          break;
        case 'lessThan':
          conditionMet = Number(fieldValue) < Number(condition.value);
          break;
      }

      if (currentLogic === 'AND') {
        result = result && conditionMet;
      } else {
        result = result || conditionMet;
      }

      currentLogic = condition.logicalOperator || 'AND';
    }

    return result;
  }

  executeActions(row: any, actions: any, counters: Map<string, number>) {
    if (!actions || !Array.isArray(actions)) return;

    for (const action of actions) {
      switch (action.type) {
        case 'increment':
          const current = counters.get(action.target) || 0;
          counters.set(action.target, current + 1);
          break;
        case 'set':
          counters.set(action.target, action.value);
          break;
        case 'calculate':
          if (action.expression) {
            try {
              const value = this.evaluateExpression(action.expression, row, counters);
              counters.set(action.target, value);
            } catch (error) {
              console.error('Error evaluating expression:', error);
            }
          }
          break;
      }
    }
  }

  evaluateExpression(expression: string, row: any, counters: Map<string, number>): number {
    let expr = expression;
    
    counters.forEach((value, key) => {
      expr = expr.replace(new RegExp(key, 'g'), String(value));
    });

    Object.keys(row).forEach(key => {
      expr = expr.replace(new RegExp(`\\$${key}`, 'g'), String(row[key]));
    });

    try {
      return eval(expr);
    } catch {
      return 0;
    }
  }

  async processData(data: any[]): Promise<any> {
    await this.loadRules();

    const counters = new Map<string, number>();
    const agentStats = new Map<string, any>();
    const dateStats = new Map<string, any>();
    const statusStats = new Map<string, number>();

    counters.set('totalDialed', 0);
    counters.set('connectedCalls', 0);
    counters.set('notConnectedCalls', 0);
    counters.set('qualifiedLeads', 0);
    counters.set('inProcessLeads', 0);
    counters.set('convertedLeads', 0);
    counters.set('rejectedLeads', 0);

    for (const row of data) {
      counters.set('totalDialed', (counters.get('totalDialed') || 0) + 1);

      for (const rule of this.rules) {
        if (this.evaluateConditions(row, rule.condition)) {
          this.executeActions(row, rule.action, counters);
        }
      }

      const agent = String(row.Agent || row.AgentName || 'Unknown').trim();
      if (!agentStats.has(agent)) {
        agentStats.set(agent, {
          agent,
          totalCalls: 0,
          connected: 0,
          notConnected: 0,
          qualified: 0,
          converted: 0,
        });
      }
      const agentData = agentStats.get(agent)!;
      agentData.totalCalls++;

      const status = String(row.Status || row.CallStatus || '').toLowerCase();
      if (status.includes('connected') || status.includes('answered')) {
        agentData.connected++;
      } else {
        agentData.notConnected++;
      }
      if (status.includes('qualified')) agentData.qualified++;
      if (status.includes('converted')) agentData.converted++;

      const dateField = row.Date || row.CallDate || row.CreatedDate;
      let dateStr = 'Unknown';
      if (dateField) {
        try {
          const date = new Date(dateField);
          if (!isNaN(date.getTime())) {
            dateStr = date.toISOString().split('T')[0];
          }
        } catch (e) {
          // Keep as Unknown
        }
      }

      if (!dateStats.has(dateStr)) {
        dateStats.set(dateStr, {
          date: dateStr,
          totalCalls: 0,
          connected: 0,
          notConnected: 0,
        });
      }
      const dateData = dateStats.get(dateStr)!;
      dateData.totalCalls++;
      if (status.includes('connected')) dateData.connected++;
      else dateData.notConnected++;

      const statusKey = String(row.Status || row.CallStatus || 'Unknown').trim();
      statusStats.set(statusKey, (statusStats.get(statusKey) || 0) + 1);
    }

    const phoneNumbers = new Set<string>();
    const duplicateSet = new Set<string>();
    data.forEach(row => {
      const phone = String(row.Mobile || row.Phone || row.PhoneNumber || '').trim();
      if (phone) {
        if (phoneNumbers.has(phone)) {
          duplicateSet.add(phone);
        }
        phoneNumbers.add(phone);
      }
    });

    counters.set('uniqueNumbers', phoneNumbers.size);
    counters.set('duplicateNumbers', duplicateSet.size);

    return {
      summary: Object.fromEntries(counters),
      agentWiseSummary: Array.from(agentStats.values()),
      dateWiseSummary: Array.from(dateStats.values()).sort((a, b) => a.date.localeCompare(b.date)),
      statusWiseSummary: Array.from(statusStats.entries()).map(([status, count]) => ({
        status,
        count,
      })),
    };
  }
}
