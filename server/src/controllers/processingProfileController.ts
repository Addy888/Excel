import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Create a new processing profile
 */
export const createProcessingProfile = async (req: Request, res: Response) => {
  try {
    const { name, description, columnMappingId, rules, filters, isDefault } = req.body;
    const userId = (req as any).user.id;

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await prisma.processingProfile.updateMany({
        where: { createdById: userId },
        data: { isDefault: false }
      });
    }

    const profile = await prisma.processingProfile.create({
      data: {
        name,
        description,
        columnMappingId,
        rules,
        filters,
        isDefault: isDefault || false,
        createdById: userId
      },
      include: {
        columnMapping: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Processing profile created successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Error creating processing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create processing profile',
      error: error.message
    });
  }
};

/**
 * Get all processing profiles for the current user
 */
export const getProcessingProfiles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { search, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { createdById: userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    const [profiles, total] = await Promise.all([
      prisma.processingProfile.findMany({
        where,
        include: {
          columnMapping: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.processingProfile.count({ where })
    ]);

    res.json({
      success: true,
      data: profiles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching processing profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch processing profiles',
      error: error.message
    });
  }
};

/**
 * Get a single processing profile by ID
 */
export const getProcessingProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const profile = await prisma.processingProfile.findFirst({
      where: {
        id: Number(id),
        createdById: userId
      },
      include: {
        columnMapping: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Processing profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Error fetching processing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch processing profile',
      error: error.message
    });
  }
};

/**
 * Update a processing profile
 */
export const updateProcessingProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, columnMappingId, rules, filters, isDefault } = req.body;
    const userId = (req as any).user.id;

    // Check if profile exists and belongs to user
    const existingProfile = await prisma.processingProfile.findFirst({
      where: {
        id: Number(id),
        createdById: userId
      }
    });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: 'Processing profile not found'
      });
    }

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await prisma.processingProfile.updateMany({
        where: {
          createdById: userId,
          id: { not: Number(id) }
        },
        data: { isDefault: false }
      });
    }

    const profile = await prisma.processingProfile.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        columnMappingId,
        rules,
        filters,
        isDefault
      },
      include: {
        columnMapping: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Processing profile updated successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Error updating processing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update processing profile',
      error: error.message
    });
  }
};

/**
 * Delete a processing profile
 */
export const deleteProcessingProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if profile exists and belongs to user
    const profile = await prisma.processingProfile.findFirst({
      where: {
        id: Number(id),
        createdById: userId
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Processing profile not found'
      });
    }

    await prisma.processingProfile.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Processing profile deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting processing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete processing profile',
      error: error.message
    });
  }
};

/**
 * Get default processing profile
 */
export const getDefaultProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const profile = await prisma.processingProfile.findFirst({
      where: {
        createdById: userId,
        isDefault: true
      },
      include: {
        columnMapping: true
      }
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Error fetching default profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default profile',
      error: error.message
    });
  }
};
