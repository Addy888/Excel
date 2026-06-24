import { Router } from 'express';
import {
  getStorageStats,
  cleanupOldReports,
  deleteReportFiles,
} from '../controllers/storageController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, requireAdmin, getStorageStats);
router.post('/cleanup', authenticate, requireAdmin, cleanupOldReports);
router.post('/delete-files', authenticate, requireAdmin, deleteReportFiles);

export default router;
