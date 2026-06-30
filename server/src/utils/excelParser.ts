import xlsx from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: any[];
  rowCount: number;
}

/**
 * FULLY DYNAMIC EXCEL PARSER
 * NO hardcoded column validation
 * NO required column checks
 * Works with ANY Excel structure
 */

/**
 * Normalize string for comparison
 */
const normalizeString = (str: string): string => {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, ' ')
    .replace(/[^\w\s]/g, '');
};

/**
 * Detect if a row is a header row
 * Headers typically have more text than numbers
 */
const isLikelyHeaderRow = (row: any[]): boolean => {
  if (!row || row.length === 0) return false;
  
  let textCount = 0;
  let numericCount = 0;
  let emptyCount = 0;
  
  for (const cell of row) {
    const cellStr = String(cell).trim();
    
    if (cellStr === '') {
      emptyCount++;
      continue;
    }
    
    // Check if it's a number
    if (!isNaN(Number(cellStr)) && cellStr !== '') {
      numericCount++;
    } else {
      textCount++;
    }
  }
  
  // Header rows have more text than numbers
  // and less than 80% empty cells
  const nonEmptyCount = row.length - emptyCount;
  return textCount > numericCount && nonEmptyCount > 2 && (emptyCount / row.length) < 0.8;
};

/**
 * Detect if a row is a summary/total row
 */
const isSummaryRow = (row: any[]): boolean => {
  if (!row || row.length === 0) return false;
  
  // Check first few cells for summary keywords
  const firstCells = row.slice(0, 3);
  for (const cell of firstCells) {
    const cellStr = normalizeString(String(cell));
    if (
      cellStr.includes('total') ||
      cellStr.includes('grand total') ||
      cellStr.includes('sum') ||
      cellStr.includes('summary') ||
      cellStr.includes('average') ||
      cellStr.includes('subtotal')
    ) {
      return true;
    }
  }
  
  return false;
};

/**
 * Parse file content with ZERO hardcoded validation
 */
export const parseFileContent = (filePath: string): ParsedData => {
  try {
    console.log('\n=== DYNAMIC EXCEL PARSER - STARTING ===');
    console.log(`File: ${filePath}`);
    
    const workbook = xlsx.readFile(filePath);
    console.log(`Sheets found: ${workbook.SheetNames.join(', ')}`);
    
    let allDataRows: any[] = [];
    let globalHeaders: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      console.log(`\n--- Processing Sheet: ${sheetName} ---`);
      
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = xlsx.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        raw: false // Get formatted values
      });

      if (rawRows.length === 0) {
        console.log(`Sheet ${sheetName}: Empty, skipping`);
        continue;
      }

      console.log(`Sheet ${sheetName}: ${rawRows.length} rows found`);

      // Find header row by scanning first 20 rows
      let headerRowIndex = -1;
      const scanLimit = Math.min(20, rawRows.length);
      
      for (let i = 0; i < scanLimit; i++) {
        const row = rawRows[i];
        if (isLikelyHeaderRow(row)) {
          headerRowIndex = i;
          console.log(`Header row detected at index ${i}`);
          break;
        }
      }

      // If no header detected, assume first non-empty row is header
      if (headerRowIndex === -1) {
        for (let i = 0; i < scanLimit; i++) {
          const row = rawRows[i];
          if (row && row.some(cell => String(cell).trim() !== '')) {
            headerRowIndex = i;
            console.log(`Using row ${i} as header (first non-empty row)`);
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        console.log(`Sheet ${sheetName}: No valid header row found, skipping`);
        continue;
      }

      // Extract headers
      const headersRow = rawRows[headerRowIndex];
      const headers = headersRow.map(cell => String(cell).trim()).filter(Boolean);
      
      console.log(`\nDetected ${headers.length} columns:`);
      headers.forEach((header, idx) => {
        console.log(`  Column ${idx + 1}: "${header}"`);
      });

      // Set global headers from first sheet
      if (globalHeaders.length === 0) {
        globalHeaders = headers;
      }

      // Extract data rows (everything after header)
      let dataRowsAdded = 0;
      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const rowArray = rawRows[i];
        
        // Skip empty rows
        if (!rowArray || rowArray.every(cell => String(cell).trim() === '')) {
          continue;
        }

        // Skip summary rows
        if (isSummaryRow(rowArray)) {
          console.log(`  Row ${i + 1}: Skipping (summary row)`);
          continue;
        }

        // Build row object
        const rowObj: any = {};
        let hasData = false;
        
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = rowArray[j] !== undefined ? rowArray[j] : '';
          
          if (header) {
            rowObj[header] = value;
            if (String(value).trim() !== '') {
              hasData = true;
            }
          }
        }

        // Only add rows with at least some data
        if (hasData) {
          allDataRows.push(rowObj);
          dataRowsAdded++;
        }
      }

      console.log(`Sheet ${sheetName}: Added ${dataRowsAdded} data rows`);
    }

    console.log(`\n=== PARSING COMPLETE ===`);
    console.log(`Total data rows: ${allDataRows.length}`);
    console.log(`Total headers: ${globalHeaders.length}`);
    
    if (globalHeaders.length > 0) {
      console.log(`\nFinal Headers:`);
      globalHeaders.forEach((header, idx) => {
        console.log(`  ${idx + 1}. "${header}"`);
      });
    }

    // Return data even if no rows found (let intelligent detector handle it)
    return {
      headers: globalHeaders,
      rows: allDataRows,
      rowCount: allDataRows.length,
    };
  } catch (error: any) {
    console.error('Parser error:', error.message);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
};

export const parseExcelFile = parseFileContent;
export const parseCSVFile = parseFileContent;

export const parseFile = (filePath: string): ParsedData => {
  return parseFileContent(filePath);
};

