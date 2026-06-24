import { Router } from 'express';
import {
  getUserActivity,
  getActivityStats,
  exportActivityLog,
} from '../controllers/activityController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireAdmin, getUserActivity);
router.get('/stats', authenticate, requireAdmin, getActivityStats);
router.get('/export', authenticate, requireAdmin, exportActivityLog);

export default router;
