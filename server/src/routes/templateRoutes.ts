import { Router } from 'express';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// POST /api/templates
router.post('/', authenticateToken, authorizeRole('admin'), createTemplate);

// GET /api/templates
router.get('/', authenticateToken, getTemplates);

// GET /api/templates/:id
router.get('/:id', authenticateToken, getTemplateById);

// PUT /api/templates/:id
router.put('/:id', authenticateToken, authorizeRole('admin'), updateTemplate);

// DELETE /api/templates/:id
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteTemplate);

export default router;
