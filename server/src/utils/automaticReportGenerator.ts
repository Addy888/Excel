/**
 * Automatic Report Generator
 * Generates MIS reports in EXACT client template format
 * NO dashboards, NO charts, NO raw data sheets
 * ONLY the final formatted report
 */

import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { DetectedColumns } from './intelligentColumnDetector';

export interface AgentPerformance {
  agentName: string;
  agentId?: string;
  dateOfJoining?: string;
  totalDialed: number;
  connectedCalls: number;
  qualified: number;
  inProcess: number;
  vcScheduled: number;
  vcDone: number;
  bookingDone: number;
  tokenDone: number;
  remark?: string;
}

export interface ReportData {
  agents: AgentPerformance[];
  startDate: string;
  endDate: string;
  campaignName?: string;
}

/**
 * Process raw CSV data into agent performance records
 */
export function processDataAutomatically(
  rawData: any[],
  detectedColumns: DetectedColumns
): ReportData {
  const agentMap = new Map<string, AgentPerformance>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  // Process each row
  rawData.forEach((row) => {
    // Get agent name
    const agentName = detectedColumns.userName
      ? row[detectedColumns.userName]?.toString().trim()
      : '';

    if (!agentName || agentName === '' || agentName.toLowerCase() === 'unknown') {
      return; // Skip invalid agents
    }

    // Initialize agent if not exists
    if (!agentMap.has(agentName)) {
      agentMap.set(agentName, {
        agentName,
        agentId: detectedColumns.userId
          ? row[detectedColumns.userId]?.toString().trim()
          : undefined,
        dateOfJoining: detectedColumns.dateOfJoining
          ? row[detectedColumns.dateOfJoining]?.toString().trim()
          : undefined,
        totalDialed: 0,
        connectedCalls: 0,
        qualified: 0,
        inProcess: 0,
        vcScheduled: 0,
        vcDone: 0,
        bookingDone: 0,
        tokenDone: 0,
        remark: '',
      });
    }

    const agent = agentMap.get(agentName)!;

    // Aggregate metrics
    // Total Dialed
    if (detectedColumns.calls || detectedColumns.totalDialed) {
      const callsColumn = detectedColumns.calls || detectedColumns.totalDialed!;
      const calls = parseInt(row[callsColumn]) || 0;
      agent.totalDialed += calls;
    }

    // Connected Calls - try direct column or calculate from components
    if (detectedColumns.connectedCalls) {
      agent.connectedCalls += parseInt(row[detectedColumns.connectedCalls]) || 0;
    } else {
      // Calculate: CP + CMDIS + CALLBK + VC
      const cp = detectedColumns.cp ? (parseInt(row[detectedColumns.cp]) || 0) : 0;
      const cmdis = detectedColumns.cmdis ? (parseInt(row[detectedColumns.cmdis]) || 0) : 0;
      const callbk = detectedColumns.callbk ? (parseInt(row[detectedColumns.callbk]) || 0) : 0;
      const vc = detectedColumns.vc ? (parseInt(row[detectedColumns.vc]) || 0) : 0;
      agent.connectedCalls += (cp + cmdis + callbk + vc);
    }

    // Qualified
    if (detectedColumns.qualified) {
      agent.qualified += parseInt(row[detectedColumns.qualified]) || 0;
    } else if (detectedColumns.cmdis) {
      agent.qualified += parseInt(row[detectedColumns.cmdis]) || 0;
    }

    // In Process
    if (detectedColumns.inProcess) {
      agent.inProcess += parseInt(row[detectedColumns.inProcess]) || 0;
    } else if (detectedColumns.callbk) {
      agent.inProcess += parseInt(row[detectedColumns.callbk]) || 0;
    }

    // VC Scheduled
    if (detectedColumns.vcScheduled) {
      agent.vcScheduled += parseInt(row[detectedColumns.vcScheduled]) || 0;
    } else if (detectedColumns.vc) {
      agent.vcScheduled += parseInt(row[detectedColumns.vc]) || 0;
    }

    // VC Done
    if (detectedColumns.vcDone) {
      agent.vcDone += parseInt(row[detectedColumns.vcDone]) || 0;
    }

    // Booking Done
    if (detectedColumns.bookingDone) {
      agent.bookingDone += parseInt(row[detectedColumns.bookingDone]) || 0;
    }

    // Token Done
    if (detectedColumns.tokenDone) {
      agent.tokenDone += parseInt(row[detectedColumns.tokenDone]) || 0;
    }

    // Remark - keep last non-empty
    if (detectedColumns.remark) {
      const remark = row[detectedColumns.remark]?.toString().trim();
      if (remark && remark !== '') {
        agent.remark = remark;
      }
    }

    // Track date range
    if (detectedColumns.date) {
      const dateStr = row[detectedColumns.date];
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    }
  });

  // Format dates
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const today = new Date();
  const startDate = minDate ? formatDate(minDate) : formatDate(today);
  const endDate = maxDate ? formatDate(maxDate) : formatDate(today);

  // Convert to array and sort
  const agents = Array.from(agentMap.values()).sort((a, b) =>
    a.agentName.localeCompare(b.agentName)
  );

  return {
    agents,
    startDate,
    endDate,
  };
}

/**
 * Generate MIS Report in EXACT client template format
 * Sheet: "Till Time"
 * Format: Exact match to client's template
 */
export async function generateMISReportAutomatic(
  reportData: ReportData,
  outputFileName: string = `Team_Performance_Report_${Date.now()}.xlsx`
): Promise<string> {
  const workbook = new ExcelJS.Workbook();

  const reportsDir = path.join(__dirname, '../../uploads/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const outputPath = path.join(reportsDir, outputFileName);

  // ============================================
  // SHEET: Till Time - CLIENT TEMPLATE FORMAT
  // ============================================
  const sheet = workbook.addWorksheet('Till Time', {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // Column setup
  sheet.columns = [
    { key: 'callerName', width: 25 },
    { key: 'dateOfJoining', width: 15 },
    { key: 'totalDialed', width: 12 },
    { key: 'connectedCalls', width: 15 },
    { key: 'qualified', width: 12 },
    { key: 'inProcess', width: 12 },
    { key: 'vcScheduled', width: 13 },
    { key: 'vcDone', width: 10 },
    { key: 'bookingDone', width: 13 },
    { key: 'tokenDone', width: 12 },
    { key: 'remark', width: 30 },
  ];

  // ============================================
  // ROW 1: TITLE (Merged)
  // ============================================
  const titleText = `FCS TEAM PERFORMANCE - FROM ${reportData.startDate} TILL ${reportData.endDate}`;

  sheet.mergeCells('A1:K1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = titleText;
  titleCell.font = {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' },
  };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  titleCell.border = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    left: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } },
    right: { style: 'medium', color: { argb: 'FF000000' } },
  };
  sheet.getRow(1).height = 25;

  // ============================================
  // ROW 2: BLANK (Spacing)
  // ============================================
  sheet.getRow(2).height = 5;

  // ============================================
  // ROW 3: HEADERS
  // ============================================
  const headers = [
    "Caller's Name",
    'Date of Joining',
    'Total Dialed',
    'Connected Calls',
    'Qualified',
    'In Process',
    'VC Scheduled',
    'VC Done',
    'Booking Done',
    'Token Done',
    'Remark',
  ];

  sheet.getRow(3).values = headers;

  const headerRow = sheet.getRow(3);
  headerRow.font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };
  headerRow.height = 30;

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  // ============================================
  // DATA ROWS: Agent Performance
  // ============================================
  let currentRow = 4;
  const totals = {
    totalDialed: 0,
    connectedCalls: 0,
    qualified: 0,
    inProcess: 0,
    vcScheduled: 0,
    vcDone: 0,
    bookingDone: 0,
    tokenDone: 0,
  };

  reportData.agents.forEach((agent) => {
    const row = sheet.getRow(currentRow);

    row.values = [
      agent.agentName,
      agent.dateOfJoining || '',
      agent.totalDialed,
      agent.connectedCalls,
      agent.qualified,
      agent.inProcess,
      agent.vcScheduled,
      agent.vcDone,
      agent.bookingDone,
      agent.tokenDone,
      agent.remark || '',
    ];

    row.font = { name: 'Calibri', size: 10 };

    // Alternate row colors
    if (currentRow % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }

    row.eachCell((cell, colNumber) => {
      if (colNumber === 1 || colNumber === 11) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      if (colNumber >= 3 && colNumber <= 10) {
        cell.numFmt = '0';
      }
    });

    row.height = 20;

    // Accumulate totals
    totals.totalDialed += agent.totalDialed;
    totals.connectedCalls += agent.connectedCalls;
    totals.qualified += agent.qualified;
    totals.inProcess += agent.inProcess;
    totals.vcScheduled += agent.vcScheduled;
    totals.vcDone += agent.vcDone;
    totals.bookingDone += agent.bookingDone;
    totals.tokenDone += agent.tokenDone;

    currentRow++;
  });

  // ============================================
  // TOTAL ROW
  // ============================================
  const totalRow = sheet.getRow(currentRow);

  totalRow.values = [
    'TOTAL',
    '',
    totals.totalDialed,
    totals.connectedCalls,
    totals.qualified,
    totals.inProcess,
    totals.vcScheduled,
    totals.vcDone,
    totals.bookingDone,
    totals.tokenDone,
    '',
  ];

  totalRow.font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' },
  };
  totalRow.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  totalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

  totalRow.eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    if (colNumber >= 3 && colNumber <= 10) {
      cell.numFmt = '0';
    }
  });

  totalRow.height = 25;

  // ============================================
  // PAGE SETUP
  // ============================================
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printArea: `A1:K${currentRow}`,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
  };

  // Save workbook
  await workbook.xlsx.writeFile(outputPath);

  return outputPath;
}
