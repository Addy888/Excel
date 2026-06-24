import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { processRawDataForClientTemplate, generateClientTemplateReport } from './src/utils/clientTemplateGenerator';

async function main() {
  const csvPath = path.join(__dirname, 'uploads/1782042258488-91992260-AGENT_PERFORMACE_DETAIL20260602-173628.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Skip the first 4 lines since the actual header is on line 5
  const lines = fileContent.split('\n');
  const csvDataString = lines.slice(4).join('\n');
  
  const records = parse(csvDataString, {
    columns: true,
    skip_empty_lines: true
  });

  const columnMapping = {
    userName: 'USER NAME',
    userId: 'ID',
    calls: 'CALLS',
    cp: 'CP',
    cmdis: 'CMDIS',
    callbk: 'CALLBK',
    vc: 'VC',
    // Mocking configured mappings as they might not be in the raw CSV
    vcDone: '', 
    bookingDone: '',
    tokenDone: ''
  };

  const agentData = processRawDataForClientTemplate(records);
  
  const options = {
    startDate: '02-06-2026',
    endDate: '02-06-2026',
    agentData: agentData,
    title: 'FCS TEAM PERFORMANCE - FROM 02-06-2026 TILL DATE'
  };

  const outputPath = await generateClientTemplateReport(options, 'Team_Performance_Report.xlsx');
  console.log(`Report generated successfully at: ${outputPath}`);
  
  // Copy it to the requested location if needed or just leave it in uploads/reports
  fs.copyFileSync(outputPath, path.join(__dirname, 'Team_Performance_Report.xlsx'));
  console.log('Copied to server root as Team_Performance_Report.xlsx');
}

main().catch(console.error);
