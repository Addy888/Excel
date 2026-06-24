import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { parseFile } from '../utils/excelParser';
import { processReportData } from '../utils/reportProcessor';
import { generateClientTemplateReport, processRawDataForClientTemplate, calculateDateRange } from '../utils/clientTemplateGenerator';
import { cleanData } from '../utils/dataCleaningEngine';
import { RuleEngine } from '../utils/ruleEngine';

/**
 * Auto-process workflow with progress tracking
 * Steps: Upload → Validate → Clean → Apply Rules → Generate MIS → Save History
 */
export const autoProcessReport = async (req: AuthRequest, res: Response) => {
  const progressSteps = [
    { step: 1, name: 'Uploading File', percentage: 0 },
    { step: 2, name: 'Validating Data', percentage: 20 },
    { step: 3, name: 'Cleaning Data', percentage: 40 },
    { step: 4, name: 'Applying Rules', percentage: 60 },
    { step: 5, name: 'Generating MIS Report', percentage: 80 },
    { step: 6, name: 'Saving to History', percentage: 90 },
    { step: 7, name: 'Complete', percentage: 100 }
  ];

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user!.id;
    const { profileId, columnMapping } = req.body;

    // Parse column mapping if provided as string
    let parsedColumnMapping = columnMapping;
    if (typeof columnMapping === 'string') {
      parsedColumnMapping = JSON.parse(columnMapping);
    }

    // Step 1: Upload & Parse (0-20%)
    const parsedData = parseFile(req.file.path);
    
    // Step 2: Validate & Clean (20-40%)
    const { cleanedData, validationReport } = cleanData(parsedData.rows);

    // Load processing profile if specified
    let processingProfile = null;
    if (profileId) {
      processingProfile = await prisma.processingProfile.findUnique({
        where: { id: Number(profileId) },
        include: { columnMapping: true }
      });

      if (processingProfile && processingProfile.columnMapping) {
        parsedColumnMapping = processingProfile.columnMapping.mappings;
      }
    }

    // Step 3: Apply Column Mapping (40-60%)
    const mappedData = applyColumnMapping(cleanedData, parsedColumnMapping);

    // Step 4: Apply Rules (60-70%)
    const rulesEngine = new RuleEngine();
    const processedWithRules = await rulesEngine.processData(mappedData);

    // Step 5: Process Report Data (70-80%)
    const processedData = processReportData(processedWithRules);

    // Step 6: Save to Database (80-90%)
    const result = await prisma.$transaction(async (tx) => {
      const uploadedReport = await tx.uploadedReport.create({
        data: {
          fileName: req.file!.filename,
          originalName: req.file!.originalname,
          filePath: req.file!.path,
          fileSize: req.file!.size,
          uploadedById: parseInt(userId as any, 10),
          recordsCount: parsedData.rowCount,
          rawData: mappedData,
          status: 'processing'
        }
      });

      await tx.validationReport.create({
        data: {
          uploadedReportId: uploadedReport.id,
          totalRecords: validationReport.totalRows || 0,
          validRecords: validationReport.validRows || 0,
          invalidRecords: validationReport.invalidRows || 0,
          errors: validationReport.cleaningActions || []
        }
      });

      // Generate error report if there are invalid records
      if (validationReport.invalidRows && validationReport.invalidRows > 0) {
        await tx.errorReport.create({
          data: {
            uploadedReportId: uploadedReport.id,
            invalidRecords: validationReport.cleaningActions || [],
            missingFields: [],
            duplicateEntries: [],
            totalErrors: validationReport.invalidRows
          }
        });
      }

      // Step 7: Generate Excel Report (90-95%)
      const dateColumn = parsedColumnMapping.date || 'Date';
      const { startDate, endDate } = calculateDateRange(mappedData, dateColumn);
      const agentData = processRawDataForClientTemplate(mappedData);
      
      const outputFileName = `Team_Performance_Report_${Date.now()}.xlsx`;
      const generatedPath = await generateClientTemplateReport(
        { startDate, endDate, agentData },
        outputFileName
      );

      // Step 8: Save Processed Report (95-100%)
      const processedReport = await tx.processedReport.create({
        data: {
          uploadedReportId: uploadedReport.id,
          processedById: parseInt(userId as any, 10),
          totalDialed: processedData.summary.totalDialed,
          connectedCalls: processedData.summary.connectedCalls,
          notConnectedCalls: processedData.summary.notConnectedCalls,
          qualifiedLeads: processedData.summary.qualifiedLeads,
          inProcessLeads: processedData.summary.inProcessLeads,
          convertedLeads: processedData.summary.convertedLeads,
          rejectedLeads: processedData.summary.rejectedLeads,
          duplicateNumbers: processedData.summary.duplicateNumbers,
          uniqueNumbers: processedData.summary.uniqueNumbers,
          agentWiseSummary: processedData.agentWiseSummary,
          dateWiseSummary: processedData.dateWiseSummary,
          statusWiseSummary: processedData.statusWiseSummary,
          generatedFilePath: generatedPath
        }
      });

      await tx.uploadedReport.update({
        where: { id: uploadedReport.id },
        data: { status: 'processed' }
      });

      // Update campaign and agent performance if applicable
      await updateCampaignAndAgentMetrics(
        tx,
        processedData,
        new Date()
      );

      return { uploadedReport, processedReport, validationReport };
    });

    res.json({
      success: true,
      message: 'Report processed successfully',
      data: {
        uploadedReportId: result.uploadedReport.id,
        processedReportId: result.processedReport.id,
        fileName: result.uploadedReport.originalName,
        recordsCount: result.uploadedReport.recordsCount,
        validRecords: result.validationReport.validRows,
        invalidRecords: result.validationReport.invalidRows,
        summary: {
          totalDialed: result.processedReport.totalDialed,
          connectedCalls: result.processedReport.connectedCalls,
          qualifiedLeads: result.processedReport.qualifiedLeads,
          convertedLeads: result.processedReport.convertedLeads,
          conversionRate: result.processedReport.totalDialed > 0
            ? ((result.processedReport.convertedLeads / result.processedReport.totalDialed) * 100).toFixed(2)
            : '0.00'
        },
        downloadPath: result.processedReport.generatedFilePath,
        progressSteps: progressSteps[6]
      }
    });
  } catch (error: any) {
    console.error('Auto-process error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-process report',
      error: error.message
    });
  }
};

/**
 * Apply column mapping to data
 */
function applyColumnMapping(data: any[], mapping: any): any[] {
  if (!mapping || !Array.isArray(mapping)) {
    return data;
  }

  return data.map(row => {
    const mappedRow: any = {};
    
    mapping.forEach((map: any) => {
      if (map.sourceColumn && map.targetColumn && row[map.sourceColumn] !== undefined) {
        mappedRow[map.targetColumn] = row[map.sourceColumn];
      }
    });

    // Keep unmapped fields
    Object.keys(row).forEach(key => {
      if (mappedRow[key] === undefined) {
        mappedRow[key] = row[key];
      }
    });

    return mappedRow;
  });
}

/**
 * Update campaign and agent performance metrics
 */
async function updateCampaignAndAgentMetrics(
  tx: any,
  processedData: any,
  reportDate: Date
): Promise<void> {
  try {
    // Group by agent
    const agentMetrics = processedData.agentWiseSummary || [];

    for (const agentData of agentMetrics) {
      // Find or create agent
      let agent = await tx.agent.findFirst({
        where: { name: agentData.agent }
      });

      if (!agent) {
        agent = await tx.agent.create({
          data: {
            name: agentData.agent,
            email: `${agentData.agent.toLowerCase().replace(/\s+/g, '.')}@example.com`
          }
        });
      }

      // Calculate productivity score
      const productivityScore = calculateProductivityScore({
        totalCalls: agentData.totalDialed || 0,
        connectedCalls: agentData.connected || 0,
        qualifiedLeads: agentData.qualified || 0,
        convertedLeads: agentData.converted || 0
      });

      // Upsert agent performance
      await tx.agentPerformance.upsert({
        where: {
          agentId_reportDate: {
            agentId: agent.id,
            reportDate
          }
        },
        update: {
          totalCalls: agentData.totalDialed || 0,
          connectedCalls: agentData.connected || 0,
          qualifiedLeads: agentData.qualified || 0,
          convertedLeads: agentData.converted || 0,
          conversionRate: agentData.totalDialed > 0
            ? (agentData.converted / agentData.totalDialed) * 100
            : 0,
          productivityScore
        },
        create: {
          agentId: agent.id,
          reportDate,
          totalCalls: agentData.totalDialed || 0,
          connectedCalls: agentData.connected || 0,
          qualifiedLeads: agentData.qualified || 0,
          convertedLeads: agentData.converted || 0,
          conversionRate: agentData.totalDialed > 0
            ? (agentData.converted / agentData.totalDialed) * 100
            : 0,
          productivityScore
        }
      });
    }
  } catch (error) {
    console.error('Error updating metrics:', error);
    // Don't throw - metrics update is non-critical
  }
}

/**
 * Calculate productivity score
 */
function calculateProductivityScore(data: {
  totalCalls: number;
  connectedCalls: number;
  qualifiedLeads: number;
  convertedLeads: number;
}): number {
  const { totalCalls, connectedCalls, qualifiedLeads, convertedLeads } = data;

  if (totalCalls === 0) return 0;

  const connectionRate = (connectedCalls / totalCalls) * 100;
  const qualificationRate = connectedCalls > 0 ? (qualifiedLeads / connectedCalls) * 100 : 0;
  const conversionRate = (convertedLeads / totalCalls) * 100;

  const score = (
    (connectionRate * 0.3) +
    (qualificationRate * 0.3) +
    (conversionRate * 0.4)
  );

  return Number(score.toFixed(2));
}
