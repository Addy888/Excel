import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { parseFile } from '../utils/excelParser';
import { processReportData } from '../utils/reportProcessor';
import { cleanData } from '../utils/dataCleaningEngine';
import { RuleEngine } from '../utils/ruleEngine';
import { createAuditLog } from '../services/auditService';
import {
  generateClientTemplateReport,
  processRawDataForClientTemplate,
  calculateDateRange,
} from '../utils/clientTemplateGenerator';
import {
  detectColumns,
  validateDetectedColumns,
  generateDetectionReport,
} from '../utils/intelligentColumnDetector';
import {
  processDataAutomatically,
  generateMISReportAutomatic,
} from '../utils/automaticReportGenerator';
import fs from 'fs';

export const uploadReport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user!.id;

    console.log('\n=== UPLOAD AND AUTOMATIC PROCESSING ===');
    console.log(`File: ${req.file.originalname}`);

    // Parse the uploaded file (NO validation, just parse)
    const parsedData = parseFile(req.file.path);

    console.log(`Parsed: ${parsedData.rowCount} rows, ${parsedData.headers.length} headers`);

    if (parsedData.rowCount === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No data rows found in the uploaded file' 
      });
    }

    // Clean data
    const { cleanedData, validationReport } = cleanData(parsedData.rows);

    if (cleanedData.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid data found after cleaning' 
      });
    }

    console.log(`Cleaned: ${cleanedData.length} valid rows`);

    // INTELLIGENT COLUMN DETECTION
    console.log('\n--- Intelligent Column Detection ---');
    const csvHeaders = Object.keys(cleanedData[0]);
    const detectedColumns = detectColumns(csvHeaders);
    const validation = validateDetectedColumns(detectedColumns);

    // Log detection report
    const detectionReport = generateDetectionReport(csvHeaders, detectedColumns);
    console.log(detectionReport);

    if (!validation.isValid) {
      console.warn('Warning: Some critical fields not detected');
      console.warn('Missing:', validation.missingCritical.join(', '));
      console.warn('Available:', validation.availableFields.join(', '));
    }

    // Process data automatically
    console.log('\n--- Processing Data ---');
    const reportData = processDataAutomatically(cleanedData, detectedColumns);

    if (reportData.agents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid agent data found. Please ensure file contains agent performance data.',
        detectedColumns: validation.availableFields,
      });
    }

    console.log(`Processed: ${reportData.agents.length} agents`);
    console.log(`Date Range: ${reportData.startDate} to ${reportData.endDate}`);

    // Generate MIS report automatically
    console.log('\n--- Generating MIS Report ---');
    const outputFileName = `MIS_Report_${Date.now()}.xlsx`;
    const generatedFilePath = await generateMISReportAutomatic(reportData, outputFileName);

    console.log(`✅ Report generated: ${outputFileName}`);

    // Save to database
    const result = await prisma.$transaction(async (tx) => {
      const uploadedReport = await tx.uploadedReport.create({
        data: {
          fileName: req.file!.filename,
          originalName: req.file!.originalname,
          filePath: req.file!.path,
          fileSize: req.file!.size,
          uploadedById: parseInt(userId as any, 10),
          recordsCount: parsedData.rowCount,
          rawData: cleanedData as any,
          status: 'processed',
        }
      });

      await tx.validationReport.create({
        data: {
          uploadedReportId: uploadedReport.id,
          totalRecords: validationReport.totalRows || 0,
          validRecords: validationReport.validRows || 0,
          invalidRecords: validationReport.invalidRows || 0,
          errors: validationReport.cleaningActions || [],
        }
      });

      const summary = {
        totalDialed: reportData.agents.reduce((sum, agent) => sum + agent.totalDialed, 0),
        connectedCalls: reportData.agents.reduce((sum, agent) => sum + agent.connectedCalls, 0),
        qualifiedLeads: reportData.agents.reduce((sum, agent) => sum + agent.qualified, 0),
        inProcessLeads: reportData.agents.reduce((sum, agent) => sum + agent.inProcess, 0),
        vcScheduled: reportData.agents.reduce((sum, agent) => sum + agent.vcScheduled, 0),
        vcDone: reportData.agents.reduce((sum, agent) => sum + agent.vcDone, 0),
        bookingDone: reportData.agents.reduce((sum, agent) => sum + agent.bookingDone, 0),
        tokenDone: reportData.agents.reduce((sum, agent) => sum + agent.tokenDone, 0),
      };

      const processedReport = await tx.processedReport.create({
        data: {
          uploadedReportId: uploadedReport.id,
          processedById: parseInt(userId as any, 10),
          totalDialed: summary.totalDialed,
          connectedCalls: summary.connectedCalls,
          notConnectedCalls: 0,
          qualifiedLeads: summary.qualifiedLeads,
          inProcessLeads: summary.inProcessLeads,
          convertedLeads: summary.bookingDone,
          rejectedLeads: 0,
          duplicateNumbers: 0,
          uniqueNumbers: 0,
          agentWiseSummary: reportData.agents as any,
          dateWiseSummary: [],
          statusWiseSummary: [],
          generatedFilePath,
        }
      });

      return { uploadedReport, processedReport };
    });

    // Audit log
    await createAuditLog({
      userId: parseInt(userId as any, 10),
      action: 'UPLOAD_AND_GENERATE',
      resourceType: 'REPORT',
      resourceId: result.processedReport.id,
      details: {
        fileName: result.uploadedReport.originalName,
        fileSize: result.uploadedReport.fileSize,
        recordsCount: result.uploadedReport.recordsCount,
        agentCount: reportData.agents.length,
        detectedColumns: validation.availableFields,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    console.log('\n=== UPLOAD AND PROCESSING COMPLETE ===\n');

    // Calculate summary for response
    const responseSummary = {
      totalDialed: reportData.agents.reduce((sum, agent) => sum + agent.totalDialed, 0),
      connectedCalls: reportData.agents.reduce((sum, agent) => sum + agent.connectedCalls, 0),
      qualifiedLeads: reportData.agents.reduce((sum, agent) => sum + agent.qualified, 0),
      inProcessLeads: reportData.agents.reduce((sum, agent) => sum + agent.inProcess, 0),
      vcScheduled: reportData.agents.reduce((sum, agent) => sum + agent.vcScheduled, 0),
      vcDone: reportData.agents.reduce((sum, agent) => sum + agent.vcDone, 0),
      bookingDone: reportData.agents.reduce((sum, agent) => sum + agent.bookingDone, 0),
      tokenDone: reportData.agents.reduce((sum, agent) => sum + agent.tokenDone, 0),
    };

    res.status(201).json({
      success: true,
      message: 'File uploaded and report generated successfully',
      report: {
        id: result.uploadedReport.id,
        fileName: result.uploadedReport.originalName,
        recordsCount: result.uploadedReport.recordsCount,
        uploadDate: result.uploadedReport.uploadDate,
      },
      processedReport: {
        id: result.processedReport.id,
        fileName: outputFileName,
        agentCount: reportData.agents.length,
        dateRange: {
          startDate: reportData.startDate,
          endDate: reportData.endDate,
        },
        detectedColumns: validation.availableFields,
        summary: {
          totalDialed: responseSummary.totalDialed,
          connectedCalls: responseSummary.connectedCalls,
          qualified: responseSummary.qualifiedLeads,
          inProcess: responseSummary.inProcessLeads,
          vcScheduled: responseSummary.vcScheduled,
          vcDone: responseSummary.vcDone,
          bookingDone: responseSummary.bookingDone,
          tokenDone: responseSummary.tokenDone,
        },
      },
      headers: parsedData.headers,
      preview: cleanedData.slice(0, 10),
      validationReport: {
        totalRows: validationReport.totalRows,
        validRows: validationReport.validRows,
        invalidRows: validationReport.invalidRows,
        duplicateRows: validationReport.duplicateRows,
        emptyRows: validationReport.emptyRows,
        cleaningActions: validationReport.cleaningActions,
      },
    });
  } catch (error: any) {
    console.error('\n=== UPLOAD ERROR ===');
    console.error(error.message);
    console.error(error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Upload and processing failed', 
      error: error.message 
    });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (search) {
      whereClause.originalName = { contains: search as string };
    }

    const reports = await prisma.uploadedReport.findMany({
      where: whereClause,
      include: {
        uploadedBy: { select: { name: true, email: true } }
      },
      orderBy: { uploadDate: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.uploadedReport.count({ where: whereClause });

    // Return consistent format even with empty data
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      message: reports.length === 0 ? 'No reports found' : undefined
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch reports', 
      error: error.message 
    });
  }
};

export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const uploadedReport = await prisma.uploadedReport.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        uploadedBy: { select: { name: true, email: true } }
      }
    });

    if (!uploadedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const processedReport = await prisma.processedReport.findFirst({
      where: { uploadedReportId: uploadedReport.id },
      include: {
        processedBy: { select: { name: true, email: true } }
      }
    });

    res.json({
      uploadedReport,
      processedReport,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch report', error: error.message });
  }
};

export const downloadReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const processedReport = await prisma.processedReport.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!processedReport || !processedReport.generatedFilePath) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (!fs.existsSync(processedReport.generatedFilePath)) {
      return res.status(404).json({ message: 'Report file not found' });
    }

    res.download(processedReport.generatedFilePath);
  } catch (error: any) {
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reportId = parseInt(id, 10);

    const uploadedReport = await prisma.uploadedReport.findUnique({
      where: { id: reportId }
    });
    
    if (!uploadedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Prisma Transaction for Deletion
    await prisma.$transaction(async (tx) => {
      const processedReports = await tx.processedReport.findMany({
        where: { uploadedReportId: reportId }
      });
      
      for (const pr of processedReports) {
        if (pr.generatedFilePath && fs.existsSync(pr.generatedFilePath)) {
          fs.unlinkSync(pr.generatedFilePath);
        }
        await tx.processedReport.delete({ where: { id: pr.id } });
      }

      await tx.validationReport.deleteMany({
        where: { uploadedReportId: reportId }
      });

      await tx.uploadedReport.delete({
        where: { id: reportId }
      });
    });

    if (fs.existsSync(uploadedReport.filePath)) {
      fs.unlinkSync(uploadedReport.filePath);
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUploaded = await prisma.uploadedReport.count();
    const totalProcessed = await prisma.processedReport.count();

    const lastProcessed = await prisma.processedReport.findFirst({
      orderBy: { processedDate: 'desc' },
      include: {
        uploadedReport: { select: { originalName: true } }
      }
    });

    const recentActivity = await prisma.uploadedReport.findMany({
      orderBy: { uploadDate: 'desc' },
      take: 5,
      include: {
        uploadedBy: { select: { name: true, email: true } }
      }
    });

    res.json({
      success: true,
      data: {
        totalUploaded,
        totalProcessed,
        lastProcessed,
        recentActivity,
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dashboard stats', 
      error: error.message 
    });
  }
};



/**
 * FULLY AUTOMATIC REPORT GENERATION
 * NO manual column mapping required
 * Intelligent column detection
 * Works with ANY Excel structure
 */
export const generateReportAutomatic = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId, customTitle } = req.body;
    const userId = req.user!.id;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: reportId'
      });
    }

    // Fetch uploaded report
    const uploadedReport = await prisma.uploadedReport.findUnique({
      where: { id: parseInt(reportId, 10) }
    });

    if (!uploadedReport) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!uploadedReport.rawData) {
      return res.status(400).json({
        success: false,
        message: 'Report has no raw data'
      });
    }

    const rawData = uploadedReport.rawData as any[];

    if (rawData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Report contains no data rows'
      });
    }

    // Get CSV headers
    const csvHeaders = Object.keys(rawData[0]);

    // INTELLIGENT COLUMN DETECTION
    const detectedColumns = detectColumns(csvHeaders);
    const validation = validateDetectedColumns(detectedColumns);

    // Generate detection report for logging
    const detectionReport = generateDetectionReport(csvHeaders, detectedColumns);
    console.log('=== AUTOMATIC COLUMN DETECTION ===');
    console.log(detectionReport);

    // If critical fields missing, try to continue anyway
    if (!validation.isValid) {
      console.warn('Warning: Some critical fields not detected, but continuing...');
    }

    // Process data automatically
    const reportData = processDataAutomatically(rawData, detectedColumns);

    if (reportData.agents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid agent data found in the uploaded file. Please ensure the file contains agent performance data.',
        detectedColumns: validation.availableFields,
      });
    }

    // Generate MIS report automatically
    const outputFileName = `MIS_Report_${Date.now()}.xlsx`;
    const generatedFilePath = await generateMISReportAutomatic(reportData, outputFileName);

    // Save to database
    const processedReport = await prisma.$transaction(async (tx) => {
      // Calculate summary
      const summary = {
        totalDialed: reportData.agents.reduce((sum, agent) => sum + agent.totalDialed, 0),
        connectedCalls: reportData.agents.reduce((sum, agent) => sum + agent.connectedCalls, 0),
        qualifiedLeads: reportData.agents.reduce((sum, agent) => sum + agent.qualified, 0),
        inProcessLeads: reportData.agents.reduce((sum, agent) => sum + agent.inProcess, 0),
        vcScheduled: reportData.agents.reduce((sum, agent) => sum + agent.vcScheduled, 0),
        vcDone: reportData.agents.reduce((sum, agent) => sum + agent.vcDone, 0),
        bookingDone: reportData.agents.reduce((sum, agent) => sum + agent.bookingDone, 0),
        tokenDone: reportData.agents.reduce((sum, agent) => sum + agent.tokenDone, 0),
      };

      const pReport = await tx.processedReport.create({
        data: {
          uploadedReportId: uploadedReport.id,
          processedById: parseInt(userId as any, 10),
          totalDialed: summary.totalDialed,
          connectedCalls: summary.connectedCalls,
          notConnectedCalls: 0,
          qualifiedLeads: summary.qualifiedLeads,
          inProcessLeads: summary.inProcessLeads,
          convertedLeads: summary.bookingDone,
          rejectedLeads: 0,
          duplicateNumbers: 0,
          uniqueNumbers: 0,
          agentWiseSummary: reportData.agents as any,
          dateWiseSummary: [],
          statusWiseSummary: [],
          generatedFilePath,
        }
      });

      await tx.uploadedReport.update({
        where: { id: uploadedReport.id },
        data: { status: 'processed' }
      });

      return pReport;
    });

    // Audit log
    await createAuditLog({
      userId: parseInt(userId as any, 10),
      action: 'GENERATE_AUTOMATIC_REPORT',
      resourceType: 'REPORT',
      resourceId: processedReport.id,
      details: {
        uploadedReportId: uploadedReport.id,
        reportType: 'Automatic MIS Report',
        agentCount: reportData.agents.length,
        dateRange: `${reportData.startDate} to ${reportData.endDate}`,
        detectedColumns: validation.availableFields,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Report generated automatically',
      processedReport: {
        id: processedReport.id,
        filePath: generatedFilePath,
        fileName: outputFileName,
        agentCount: reportData.agents.length,
        dateRange: {
          startDate: reportData.startDate,
          endDate: reportData.endDate,
        },
        detectedColumns: validation.availableFields,
        summary: {
          totalDialed: reportData.agents.reduce((sum, agent) => sum + agent.totalDialed, 0),
          connectedCalls: reportData.agents.reduce((sum, agent) => sum + agent.connectedCalls, 0),
          qualified: reportData.agents.reduce((sum, agent) => sum + agent.qualified, 0),
          inProcess: reportData.agents.reduce((sum, agent) => sum + agent.inProcess, 0),
          vcScheduled: reportData.agents.reduce((sum, agent) => sum + agent.vcScheduled, 0),
          vcDone: reportData.agents.reduce((sum, agent) => sum + agent.vcDone, 0),
          bookingDone: reportData.agents.reduce((sum, agent) => sum + agent.bookingDone, 0),
          tokenDone: reportData.agents.reduce((sum, agent) => sum + agent.tokenDone, 0),
        },
      },
    });
  } catch (error: any) {
    console.error('Automatic report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report automatically',
      error: error.message
    });
  }
};
