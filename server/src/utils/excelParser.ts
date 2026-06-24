import xlsx from 'xlsx';
import path from 'path';

export interface ParsedData {
  headers: string[];
  rows: any[];
  rowCount: number;
}

const normalize = (str: string) => String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');

const isUserName = (val: string) => {
  const norm = normalize(val);
  return ['USERNAME', 'AGENTNAME', 'CALLERNAME', 'EXECUTIVENAME', 'EMPLOYEENAME', 'NAME', 'AGENT'].includes(norm);
};

const isCalls = (val: string) => {
  const norm = normalize(val);
  return ['CALLS', 'DIALED', 'CALLSMADE', 'TOTALCALLS', 'TOTALDIALED'].includes(norm);
};

export const parseFileContent = (filePath: string): ParsedData => {
  try {
    const workbook = xlsx.readFile(filePath);
    
    let allDataRows: any[] = [];
    let globalHeaders: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawRows.length === 0) continue;

      // 1. Scan first 30 rows for headers
      const scanLimit = Math.min(30, rawRows.length);
      let bestRowIndex = -1;
      let maxMatches = -1;

      for (let i = 0; i < scanLimit; i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        
        let hasUser = false;
        let hasCalls = false;
        let matches = 0;

        row.forEach(cell => {
          if (isUserName(String(cell))) { hasUser = true; matches++; }
          else if (isCalls(String(cell))) { hasCalls = true; matches++; }
          else if (String(cell).trim() !== '') matches += 0.1; // Small weight for other columns
        });

        if (hasUser && hasCalls && matches > maxMatches) {
          maxMatches = matches;
          bestRowIndex = i;
        }
      }

      if (bestRowIndex === -1) {
        console.log(`Skipping sheet ${sheetName}: Could not find required columns (User Name and Calls)`);
        continue; // Skip sheet if headers not found
      }

      const headersRow = rawRows[bestRowIndex] || [];
      const headers = headersRow.map(cell => String(cell).trim());
      
      if (globalHeaders.length === 0) {
        globalHeaders = headers.filter(Boolean);
      }

      for (let i = bestRowIndex + 1; i < rawRows.length; i++) {
        const rowArray = rawRows[i];
        
        if (!rowArray || rowArray.every(cell => String(cell).trim() === '')) continue;
        
        // Check for summary rows in the first few columns
        let isSummaryRow = false;
        for (let j = 0; j < Math.min(4, rowArray.length); j++) {
          const cellValue = normalize(rowArray[j]);
          if (cellValue.includes('TOTAL') || cellValue.includes('AGENTS')) {
            isSummaryRow = true;
            break;
          }
        }

        if (isSummaryRow) continue;

        const rowObj: any = {};
        let hasData = false;
        for (let j = 0; j < headers.length; j++) {
           const header = headers[j];
           if (header) {
             rowObj[header] = rowArray[j] !== undefined ? rowArray[j] : '';
             if (rowObj[header] !== '') hasData = true;
           }
        }
        
        if (hasData) {
          allDataRows.push(rowObj);
        }
      }
    }

    if (allDataRows.length === 0) {
      throw new Error('No valid agent data found across any sheets. Ensure the file contains Agent Names and Call metrics.');
    }

    return {
      headers: globalHeaders,
      rows: allDataRows,
      rowCount: allDataRows.length,
    };
  } catch (error: any) {
    throw new Error(`Failed to parse file: ${error.message}`);
  }
};

export const parseExcelFile = parseFileContent;
export const parseCSVFile = parseFileContent;

export const parseFile = (filePath: string): ParsedData => {
  return parseFileContent(filePath);
};

