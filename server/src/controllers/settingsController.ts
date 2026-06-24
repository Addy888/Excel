import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Get system settings
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      // Return default settings
      return res.json({
        status: 'success',
        data: {
          companyName: 'MIS Report Extractor',
          logo: null,
          timezone: 'UTC',
          currency: 'USD',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
          theme: 'light',
          primaryColor: '#3b82f6',
          secondaryColor: '#10b981',
          reportSettings: {
            defaultPageSize: 20,
            maxUploadSize: 100,
            allowedFileTypes: ['xlsx', 'xls', 'csv'],
            autoProcess: false,
          },
        },
      });
    }

    res.json({
      status: 'success',
      data: settings,
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve settings',
    });
  }
};

/**
 * Update system settings (Admin only)
 */
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      logo,
      timezone,
      currency,
      dateFormat,
      timeFormat,
      theme,
      primaryColor,
      secondaryColor,
      reportSettings,
    } = req.body;

    const existingSettings = await prisma.systemSettings.findFirst();

    let settings;
    if (existingSettings) {
      settings = await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: {
          companyName,
          logo,
          timezone,
          currency,
          dateFormat,
          timeFormat,
          theme,
          primaryColor,
          secondaryColor,
          reportSettings,
        },
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          companyName,
          logo,
          timezone,
          currency,
          dateFormat,
          timeFormat,
          theme,
          primaryColor,
          secondaryColor,
          reportSettings,
        },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'UPDATE_SETTINGS',
        resource: 'SystemSettings',
        details: { changes: req.body },
        ipAddress: req.ip,
      },
    });

    logger.info(`Settings updated by user ${(req as any).user.id}`);

    res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update settings',
    });
  }
};

/**
 * Upload company logo
 */
export const uploadLogo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    const logoPath = `/uploads/${req.file.filename}`;

    const existingSettings = await prisma.systemSettings.findFirst();

    let settings;
    if (existingSettings) {
      settings = await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: { logo: logoPath },
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          logo: logoPath,
          companyName: 'MIS Report Extractor',
        },
      });
    }

    res.json({
      status: 'success',
      message: 'Logo uploaded successfully',
      data: { logo: logoPath },
    });
  } catch (error) {
    logger.error('Upload logo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload logo',
    });
  }
};

/**
 * Get white label settings (public)
 */
export const getWhiteLabelSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findFirst({
      select: {
        companyName: true,
        logo: true,
        theme: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    res.json({
      status: 'success',
      data: settings || {
        companyName: 'MIS Report Extractor',
        logo: null,
        theme: 'light',
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
      },
    });
  } catch (error) {
    logger.error('Get white label settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve settings',
    });
  }
};
