import * as fs from 'fs';

export interface CSVOptions {
  headers: string[];
  data: any[][];
}

export class CSVGenerator {
  /**
   * Generate CSV file from data
   */
  static async generateCSV(
    data: any[],
    outputPath: string,
    headers?: string[]
  ): Promise<string> {
    try {
      console.log('📄 Generating CSV file:', outputPath);

      if (data.length === 0) {
        throw new Error('No data to export');
      }

      // Extract headers from first object if not provided
      const csvHeaders = headers || Object.keys(data[0]);

      // Build CSV content
      let csvContent = csvHeaders.join(',') + '\n';

      // Add data rows
      data.forEach(row => {
        const values = csvHeaders.map(header => {
          let value = row[header];
          
          // Handle different data types
          if (value === null || value === undefined) {
            value = '';
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          } else {
            value = String(value);
          }

          // Escape quotes and wrap in quotes if contains comma
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }

          return value;
        });

        csvContent += values.join(',') + '\n';
      });

      // Write to file
      await fs.promises.writeFile(outputPath, csvContent, 'utf8');

      console.log('✅ CSV file generated successfully');
      return outputPath;
    } catch (error) {
      console.error('❌ CSV generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate multiple CSV sheets (as separate files)
   */
  static async generateMultipleCSV(
    sheets: { name: string; data: any[] }[],
    outputDir: string
  ): Promise<string[]> {
    try {
      console.log('📄 Generating multiple CSV files:', outputDir);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true });
      }

      const filePaths: string[] = [];

      for (const sheet of sheets) {
        const filePath = `${outputDir}/${sheet.name}.csv`;
        await this.generateCSV(sheet.data, filePath);
        filePaths.push(filePath);
      }

      console.log('✅ All CSV files generated successfully');
      return filePaths;
    } catch (error) {
      console.error('❌ Multiple CSV generation failed:', error);
      throw error;
    }
  }

  /**
   * Convert report data to CSV format
   */
  static async generateReportCSV(
    reportData: any,
    outputPath: string
  ): Promise<string> {
    try {
      const summary = [
        ['Metric', 'Value'],
        ['Total Dialed', reportData.totalDialed || 0],
        ['Connected Calls', reportData.connectedCalls || 0],
        ['Not Connected', reportData.notConnectedCalls || 0],
        ['Qualified Leads', reportData.qualifiedLeads || 0],
        ['In Process', reportData.inProcessLeads || 0],
        ['Converted', reportData.convertedLeads || 0],
        ['Rejected', reportData.rejectedLeads || 0],
        ['Duplicate Numbers', reportData.duplicateNumbers || 0],
        ['Unique Numbers', reportData.uniqueNumbers || 0]
      ];

      let csvContent = summary.map(row => row.join(',')).join('\n');
      csvContent += '\n\n';

      // Add agent summary if available
      if (reportData.agentWiseSummary && Array.isArray(reportData.agentWiseSummary)) {
        csvContent += 'Agent Summary\n';
        csvContent += 'Agent,Total Dialed,Connected,Qualified,Converted\n';
        
        reportData.agentWiseSummary.forEach((agent: any) => {
          csvContent += `${agent.agent},${agent.totalDialed},${agent.connected},${agent.qualified},${agent.converted}\n`;
        });
        
        csvContent += '\n';
      }

      // Add status summary if available
      if (reportData.statusWiseSummary && Array.isArray(reportData.statusWiseSummary)) {
        csvContent += 'Status Summary\n';
        csvContent += 'Status,Count\n';
        
        reportData.statusWiseSummary.forEach((status: any) => {
          csvContent += `${status.status},${status.count}\n`;
        });
      }

      await fs.promises.writeFile(outputPath, csvContent, 'utf8');

      console.log('✅ Report CSV generated successfully');
      return outputPath;
    } catch (error) {
      console.error('❌ Report CSV generation failed:', error);
      throw error;
    }
  }
}

export default CSVGenerator;
