import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { createAuditLog } from '../services/auditService';

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, columns, formulas, aggregations } = req.body;
    const userId = req.user!.id;

    const template = await prisma.reportTemplate.create({
      data: {
        name,
        description,
        columns,
        formulas,
        aggregations,
        createdById: parseInt(userId as any, 10),
      }
    });

    await createAuditLog({
      userId: parseInt(userId as any, 10),
      action: 'CREATE_TEMPLATE',
      resourceType: 'TEMPLATE',
      resourceId: template.id,
      details: { name: template.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Template created successfully',
      template,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create template', error: error.message });
  }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.reportTemplate.findMany({
      where: { isActive: true },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.reportTemplate.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch template', error: error.message });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user!.id;

    const templateId = parseInt(id, 10);

    const template = await prisma.reportTemplate.update({
      where: { id: templateId },
      data: {
        name: updates.name,
        description: updates.description,
        columns: updates.columns,
        formulas: updates.formulas,
        aggregations: updates.aggregations,
        isActive: updates.isActive
      }
    });

    await createAuditLog({
      userId: parseInt(userId as any, 10),
      action: 'UPDATE_TEMPLATE',
      resourceType: 'TEMPLATE',
      resourceId: template.id,
      details: { name: template.name, updates },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Template updated successfully',
      template,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const templateId = parseInt(id, 10);

    const template = await prisma.reportTemplate.update({
      where: { id: templateId },
      data: { isActive: false }
    });

    await createAuditLog({
      userId: parseInt(userId as any, 10),
      action: 'DELETE_TEMPLATE',
      resourceType: 'TEMPLATE',
      resourceId: template.id,
      details: { name: template.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
};
