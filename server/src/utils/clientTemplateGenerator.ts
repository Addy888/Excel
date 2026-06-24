import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export interface AgentData {
  userName: string;
  userId: string;
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

export interface ClientTemplateOptions {
  startDate: string;
  endDate: string;
  agentData: AgentData[];
}

const normalizeKey = (key: string) => key.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const findKey = (keys: string[], target: string): string | undefined => {
  const normTarget = normalizeKey(target);
  return keys.find(k => normalizeKey(k) === normTarget);
};

export const processRawDataForClientTemplate = (rawData: any[]): AgentData[] => {
  if (!rawData || rawData.length === 0) return [];

  const keys = Object.keys(rawData[0]);
  
  const colUser = findKey(keys, 'USER NAME') || findKey(keys, 'NAME') || findKey(keys, 'AGENT') || findKey(keys, 'AGENT NAME') || findKey(keys, 'CALLER NAME') || findKey(keys, 'EXECUTIVE NAME') || findKey(keys, 'EMPLOYEE NAME');
  const colId = findKey(keys, 'ID') || findKey(keys, 'USER ID');
  const colDoj = findKey(keys, 'DOJ') || findKey(keys, 'DATE OF JOINING') || findKey(keys, 'JOINING DATE');
  const colCalls = findKey(keys, 'CALLS') || findKey(keys, 'TOTAL DIALED') || findKey(keys, 'DIALED') || findKey(keys, 'CALLS MADE') || findKey(keys, 'TOTAL CALLS');
  const colCp = findKey(keys, 'CP') || findKey(keys, 'CONNECTED') || findKey(keys, 'CONNECTED CALLS');
  const colCmdis = findKey(keys, 'CMDIS') || findKey(keys, 'QUALIFIED') || findKey(keys, 'INTERESTED');
  const colCallbk = findKey(keys, 'CALLBK') || findKey(keys, 'IN PROCESS') || findKey(keys, 'CALLBACK');
  const colVc = findKey(keys, 'VC') || findKey(keys, 'VC SCHEDULED');
  const colVcDone = findKey(keys, 'VCDONE') || findKey(keys, 'VC DONE');
  const colBooking = findKey(keys, 'BOOKING') || findKey(keys, 'BOOKING DONE');
  const colToken = findKey(keys, 'TOKEN') || findKey(keys, 'TOKEN DONE');
  const colRemark = findKey(keys, 'REMARK') || findKey(keys, 'REMARKS');

  if (!colUser || !colCalls) {
    return [];
  }

  const agentMap = new Map<string, AgentData>();

  rawData.forEach((row) => {
    const userName = row[colUser]?.toString().trim();
    if (!userName || userName === '' || userName.toLowerCase() === 'unknown') return;

    const userId = colId ? row[colId]?.toString().trim() : userName;

    if (!agentMap.has(userName)) {
      agentMap.set(userName, {
        userName,
        userId: userId || userName,
        dateOfJoining: colDoj ? row[colDoj]?.toString().trim() : '',
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

    const agent = agentMap.get(userName)!;

    const calls = parseInt(row[colCalls]) || 0;
    agent.totalDialed += calls;

    const cp = colCp ? (parseInt(row[colCp]) || 0) : 0;
    const cmdis = colCmdis ? (parseInt(row[colCmdis]) || 0) : 0;
    const callbk = colCallbk ? (parseInt(row[colCallbk]) || 0) : 0;
    const vc = colVc ? (parseInt(row[colVc]) || 0) : 0;
    
    agent.connectedCalls += (cp + cmdis + callbk + vc);
    agent.qualified += cmdis;
    agent.inProcess += callbk;
    agent.vcScheduled += vc;

    if (colVcDone) agent.vcDone += parseInt(row[colVcDone]) || 0;
    if (colBooking) agent.bookingDone += parseInt(row[colBooking]) || 0;
    if (colToken) agent.tokenDone += parseInt(row[colToken]) || 0;

    if (colRemark) {
      const remark = row[colRemark]?.toString().trim();
      if (remark && remark !== '') {
        agent.remark = remark;
      }
    }
  });

  return Array.from(agentMap.values()).sort((a, b) => a.userName.localeCompare(b.userName));
};

export const calculateDateRange = (rawData: any[], dateColumnHint: string = 'DATE'): { startDate: string; endDate: string } => {
  if (!rawData || rawData.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    return { startDate: today, endDate: today };
  }
  const keys = Object.keys(rawData[0]);
  const dateCol = findKey(keys, dateColumnHint);

  const dates: Date[] = [];
  if (dateCol) {
    rawData.forEach((row) => {
      const dateValue = row[dateCol];
      if (dateValue) {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) dates.push(date);
        } catch (e) {}
      }
    });
  }

  if (dates.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    return { startDate: today, endDate: today };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return {
    startDate: formatDate(dates[0]),
    endDate: formatDate(dates[dates.length - 1]),
  };
};

const applyStyles = (cell: ExcelJS.Cell, isHeader: boolean = false, isTitle: boolean = false, isTotal: boolean = false) => {
  cell.font = {
    name: 'Calibri',
    size: isTitle ? 14 : (isHeader || isTotal ? 11 : 10),
    bold: isTitle || isHeader || isTotal,
    color: { argb: 'FF000000' },
  };

  if (isTitle || isTotal || isHeader) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }, // Yellow title bars
    };
  }

  cell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };

  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };
};

export const generateClientTemplateReport = async (
  options: ClientTemplateOptions,
  outputFileName: string = `Team_Performance_Report_${Date.now()}.xlsx`
): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  const reportsDir = path.join(__dirname, '../../uploads/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const outputPath = path.join(reportsDir, outputFileName);

  const ag = options.agentData;

  const totals = {
    agents: ag.length,
    dialed: ag.reduce((s, a) => s + a.totalDialed, 0),
    conn: ag.reduce((s, a) => s + a.connectedCalls, 0),
    qual: ag.reduce((s, a) => s + a.qualified, 0),
    inp: ag.reduce((s, a) => s + a.inProcess, 0),
    vcs: ag.reduce((s, a) => s + a.vcScheduled, 0),
    vcd: ag.reduce((s, a) => s + a.vcDone, 0),
    book: ag.reduce((s, a) => s + a.bookingDone, 0),
    tok: ag.reduce((s, a) => s + a.tokenDone, 0),
  };

  const sheet = workbook.addWorksheet('MIS Report', {
    views: [{ state: 'normal' }],
  });

  // Determine max columns needed (Campaign has 13, FCS has 10/11)
  const maxCols = 13;
  
  // Set default column widths
  for (let i = 1; i <= maxCols; i++) {
    sheet.getColumn(i).width = 15;
  }
  sheet.getColumn(1).width = 25; // Caller's Name / Category is usually wider
  sheet.getColumn(11).width = 25; // Remark column for FCS tables (Column K)
  sheet.getColumn(13).width = 25; // Remark for Campaign table (Column M)

  let currentRowIdx = 1;

  const addTable = (title: string, headers: string[], dataRows: any[][], totalRow: any[]) => {
    const columnCount = headers.length;

    // Title
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, columnCount);
    const titleCell = sheet.getCell(currentRowIdx, 1);
    titleCell.value = title;
    applyStyles(titleCell, false, true, false);
    sheet.getRow(currentRowIdx).height = 30;
    currentRowIdx++;

    // Blank row for spacing
    sheet.getRow(currentRowIdx).height = 5;
    currentRowIdx++;

    // Headers
    const headerRow = sheet.getRow(currentRowIdx);
    headerRow.values = headers;
    headerRow.height = 35;
    headerRow.eachCell((cell) => applyStyles(cell, true, false, false));
    currentRowIdx++;

    // Data
    dataRows.forEach(rowData => {
      const row = sheet.getRow(currentRowIdx);
      row.values = rowData;
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        applyStyles(cell, false, false, false);
        if (colNumber === 1 || headers[colNumber - 1] === 'Remark') {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
        if (typeof cell.value === 'number') {
          cell.numFmt = '0';
        }
      });
      currentRowIdx++;
    });

    // Totals
    const tRow = sheet.getRow(currentRowIdx);
    tRow.values = totalRow;
    tRow.height = 25;
    tRow.eachCell((cell, colNumber) => {
      applyStyles(cell, false, false, true);
      if (colNumber === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
    currentRowIdx++;

    // Add multiple blank rows between sections for clean visual separation
    sheet.getRow(currentRowIdx).height = 20;
    currentRowIdx++;
    sheet.getRow(currentRowIdx).height = 20;
    currentRowIdx++;
  };

  // SECTION 1. CAMPAIGN PERFORMANCE - TODAY
  const campHeaders = [
    'Category', 'Spends', 'No Of Agent', 'Total Leads Received', 'Total Dialed', 
    'Connected Calls', 'Qualified', 'In Process', 'VC Scheduled', 'VC Done', 
    'Booking Done', 'Token Done', 'Remark'
  ];
  const campData = [
    ['Sales Campaign', 0, totals.agents, totals.dialed, totals.dialed, totals.conn, totals.qual, totals.inp, totals.vcs, totals.vcd, totals.book, totals.tok, '']
  ];
  const campTotals = ['TOTAL', 0, totals.agents, totals.dialed, totals.dialed, totals.conn, totals.qual, totals.inp, totals.vcs, totals.vcd, totals.book, totals.tok, ''];
  addTable('CAMPAIGN PERFORMANCE - TODAY', campHeaders, campData, campTotals);

  // SECTION 2. FCS TEAM PERFORMANCE - TODAY
  const fcsHeaders = [
    "Caller's Name", 'Total Dialed', 'Connected Calls', 'Qualified', 'In Process', 
    'VC Scheduled', 'VC Done', 'Booking Done', 'Token Done', 'Remark'
  ];
  const fcsData = ag.map(a => [a.userName, a.totalDialed, a.connectedCalls, a.qualified, a.inProcess, a.vcScheduled, a.vcDone, a.bookingDone, a.tokenDone, a.remark || '']);
  const fcsTotals = ['TOTAL', totals.dialed, totals.conn, totals.qual, totals.inp, totals.vcs, totals.vcd, totals.book, totals.tok, ''];
  addTable('FCS TEAM PERFORMANCE - TODAY', fcsHeaders, fcsData, fcsTotals);

  // SECTION 3. FCS TEAM PERFORMANCE - CURRENT MONTH
  addTable('FCS TEAM PERFORMANCE - CURRENT MONTH', fcsHeaders, fcsData, fcsTotals);

  // SECTION 4. FCS TEAM PERFORMANCE - FROM START DATE TILL DATE
  const fcsTillHeaders = [
    "Caller's Name", 'Date Of Joining', 'Total Dialed', 'Connected Calls', 'Qualified', 
    'In Process', 'VC Scheduled', 'VC Done', 'Booking Done', 'Token Done', 'Remark'
  ];
  const fcsTillData = ag.map(a => [a.userName, a.dateOfJoining || '', a.totalDialed, a.connectedCalls, a.qualified, a.inProcess, a.vcScheduled, a.vcDone, a.bookingDone, a.tokenDone, a.remark || '']);
  const fcsTillTotals = ['TOTAL', '', totals.dialed, totals.conn, totals.qual, totals.inp, totals.vcs, totals.vcd, totals.book, totals.tok, ''];
  addTable('FCS TEAM PERFORMANCE - FROM JOINING DATE TILL TODAY', fcsTillHeaders, fcsTillData, fcsTillTotals);

  // Page Setup
  const lastColLetter = String.fromCharCode(64 + maxCols);
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printArea: `A1:${lastColLetter}${currentRowIdx}`,
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
  };
  sheet.properties.outlineLevelCol = 0;
  sheet.properties.outlineLevelRow = 0;

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
};
