import { Router } from 'express';
import {
  uploadReport,
  getReports,
  getReportById,
  downloadReport,
  deleteReport,
  getDashboardStats,
  generateReportAutomatic,
} from '../controllers/reportController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Upload endpoint: POST /api/reports/upload
router.post('/upload', authenticateToken, upload.single('file'), uploadReport);

// FULLY AUTOMATIC Report Generation: POST /api/reports/generate-automatic
router.post('/generate-automatic', authenticateToken, generateReportAutomatic);

// List reports: GET /api/reports
router.get('/', authenticateToken, getReports);

// Get single report: GET /api/reports/:id
router.get('/:id', authenticateToken, getReportById);

// Download report: GET /api/reports/download/:id
router.get('/download/:id', authenticateToken, downloadReport);

// Delete report: DELETE /api/reports/:id
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteReport);

// Dashboard stats: GET /api/reports/dashboard/stats
router.get('/dashboard/stats', authenticateToken, getDashboardStats);

export default router;
