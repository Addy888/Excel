export interface ColumnMapping {
  [key: string]: string;
}

export interface ProcessedData {
  summary: {
    totalDialed: number;
    connectedCalls: number;
    notConnectedCalls: number;
    qualifiedLeads: number;
    inProcessLeads: number;
    convertedLeads: number;
    rejectedLeads: number;
    duplicateNumbers: number;
    uniqueNumbers: number;
  };
  agentWiseSummary: any[];
  dateWiseSummary: any[];
  statusWiseSummary: any[];
}

export const processReportData = (rawData: any[], columnMapping?: ColumnMapping): ProcessedData => {
  // Apply column mapping if provided
  const mappedData = columnMapping
    ? rawData.map((row) => {
        const mappedRow: any = {};
        Object.keys(columnMapping).forEach((systemColumn) => {
          const uploadedColumn = columnMapping[systemColumn];
          mappedRow[systemColumn] = row[uploadedColumn] || '';
        });
        return mappedRow;
      })
    : rawData;

  // Calculate summary
  const totalDialed = mappedData.length;
  
  // Track unique phone numbers
  const phoneNumbers = new Set<string>();
  const duplicateSet = new Set<string>();
  
  mappedData.forEach((row) => {
    const phone = String(row.Mobile || row.Phone || row.PhoneNumber || '').trim();
    if (phone) {
      if (phoneNumbers.has(phone)) {
        duplicateSet.add(phone);
      }
      phoneNumbers.add(phone);
    }
  });

  const uniqueNumbers = phoneNumbers.size;
  const duplicateNumbers = duplicateSet.size;

  // Count by status
  let connectedCalls = 0;
  let notConnectedCalls = 0;
  let qualifiedLeads = 0;
  let inProcessLeads = 0;
  let convertedLeads = 0;
  let rejectedLeads = 0;

  mappedData.forEach((row) => {
    const status = String(row.Status || row.CallStatus || '').toLowerCase().trim();

    if (status.includes('connected') || status.includes('answered')) {
      connectedCalls++;
    } else if (status.includes('not connected') || status.includes('no answer') || status.includes('busy')) {
      notConnectedCalls++;
    }

    if (status.includes('qualified') || status.includes('interested')) {
      qualifiedLeads++;
    } else if (status.includes('process') || status.includes('follow')) {
      inProcessLeads++;
    } else if (status.includes('converted') || status.includes('success')) {
      convertedLeads++;
    } else if (status.includes('rejected') || status.includes('not interested')) {
      rejectedLeads++;
    }
  });

  // Agent-wise summary
  const agentMap = new Map<string, any>();
  mappedData.forEach((row) => {
    const agent = String(row.Agent || row.AgentName || 'Unknown').trim();
    
    if (!agentMap.has(agent)) {
      agentMap.set(agent, {
        agent,
        totalCalls: 0,
        connected: 0,
        notConnected: 0,
        qualified: 0,
        converted: 0,
      });
    }

    const agentData = agentMap.get(agent)!;
    agentData.totalCalls++;

    const status = String(row.Status || row.CallStatus || '').toLowerCase().trim();
    if (status.includes('connected') || status.includes('answered')) {
      agentData.connected++;
    } else {
      agentData.notConnected++;
    }

    if (status.includes('qualified') || status.includes('interested')) {
      agentData.qualified++;
    }

    if (status.includes('converted') || status.includes('success')) {
      agentData.converted++;
    }
  });

  const agentWiseSummary = Array.from(agentMap.values());

  // Date-wise summary
  const dateMap = new Map<string, any>();
  mappedData.forEach((row) => {
    let dateStr = 'Unknown';
    const dateField = row.Date || row.CallDate || row.CreatedDate;
    
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

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, {
        date: dateStr,
        totalCalls: 0,
        connected: 0,
        notConnected: 0,
      });
    }

    const dateData = dateMap.get(dateStr)!;
    dateData.totalCalls++;

    const status = String(row.Status || row.CallStatus || '').toLowerCase().trim();
    if (status.includes('connected') || status.includes('answered')) {
      dateData.connected++;
    } else {
      dateData.notConnected++;
    }
  });

  const dateWiseSummary = Array.from(dateMap.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  // Status-wise summary
  const statusMap = new Map<string, number>();
  mappedData.forEach((row) => {
    const status = String(row.Status || row.CallStatus || 'Unknown').trim();
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const statusWiseSummary = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  return {
    summary: {
      totalDialed,
      connectedCalls,
      notConnectedCalls,
      qualifiedLeads,
      inProcessLeads,
      convertedLeads,
      rejectedLeads,
      duplicateNumbers,
      uniqueNumbers,
    },
    agentWiseSummary,
    dateWiseSummary,
    statusWiseSummary,
  };
};
