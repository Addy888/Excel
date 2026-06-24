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
import fs from 'fs';

export const uploadReport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user!.id;

    // Parse the uploaded file
    const parsedData = parseFile(req.file.path);

    // Clean and validate data
    const { cleanedData, validationReport } = cleanData(parsedData.rows);

    if (cleanedData.length === 0) {
      return res.status(400).json({ message: 'No valid data found after cleaning.' });
    }

    // Auto-process raw data into agent data format for client template
    const agentData = processRawDataForClientTemplate(cleanedData);

    if (agentData.length === 0) {
      return res.status(400).json({ message: 'No valid agent data found.' });
    }

    // Calculate date range from data (auto detect date column)
    const { startDate, endDate } = calculateDateRange(cleanedData, 'DATE');

    const outputFileName = `MIS_Report_${Date.now()}.xlsx`;
    const generatedFilePath = await generateClientTemplateReport(
      {
        startDate,
        endDate,
        agentData,
      },
      outputFileName
    );

    // Transaction for UploadedReport, ValidationReport, and ProcessedReport
    const result = await prisma.$transaction(async (tx) => {
      const uploadedReport = await tx.uploadedReport.create({
        data: {
          fileName: req.file!.filename,
          originalName: req.file!.originalname,
          filePath: req.file!.path,
          fileSize: req.file!.size,
          uploadedById: parseInt(userId as any, 10),
          recordsCount: parsedData.rowCount,
          rawData: cleanedData,
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
        totalDialed: agentData.reduce((sum, agent) => sum + agent.totalDialed, 0),
        connectedCalls: agentData.reduce((sum, agent) => sum + agent.connectedCalls, 0),
        qualifiedLeads: agentData.reduce((sum, agent) => sum + agent.qualified, 0),
        inProcessLeads: agentData.reduce((sum, agent) => sum + agent.inProcess, 0),
        convertedLeads: agentData.reduce((sum, agent) => sum + agent.bookingDone, 0),
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
          convertedLeads: summary.convertedLeads,
          rejectedLeads: 0,
          duplicateNumbers: 0,
          uniqueNumbers: 0,
          agentWiseSummary: agentData as any,
          dateWiseSummary: [],
          statusWiseSummary: [],
          generatedFilePath,
        }
      });

      return { uploadedReport, pReport, summary };
    });

    // Audit log
    await createAuditLog({
      userId: parseInt(userId as any, 10),
      action: 'UPLOAD_AND_PROCESS',
      resourceType: 'REPORT',
      resourceId: result.uploadedReport.id,
      details: {
        fileName: result.uploadedReport.originalName,
        recordsCount: result.uploadedReport.recordsCount,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'File processed successfully',
      report: {
        id: result.uploadedReport.id,
        fileName: result.uploadedReport.originalName,
      },
      processedReport: {
        id: result.pReport.id,
        filePath: generatedFilePath,
        fileName: outputFileName,
        summary: {
          totalDialed: agentData.reduce((sum, agent) => sum + agent.totalDialed, 0),
          connectedCalls: agentData.reduce((sum, agent) => sum + agent.connectedCalls, 0),
          qualified: agentData.reduce((sum, agent) => sum + agent.qualified, 0),
          inProcess: agentData.reduce((sum, agent) => sum + agent.inProcess, 0),
          vcScheduled: agentData.reduce((sum, agent) => sum + agent.vcScheduled, 0),
          vcDone: agentData.reduce((sum, agent) => sum + agent.vcDone, 0),
          bookingDone: agentData.reduce((sum, agent) => sum + agent.bookingDone, 0),
          tokenDone: agentData.reduce((sum, agent) => sum + agent.tokenDone, 0),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Upload and processing failed', error: error.message });
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

