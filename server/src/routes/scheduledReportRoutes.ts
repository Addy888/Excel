import express from 'express';
import {
  createScheduledReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  triggerScheduledReport,
  getReportRuns
} from '../controllers/scheduledReportController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', authorize('admin'), createScheduledReport);
router.get('/', getScheduledReports);
router.get('/:id', getScheduledReport);
router.put('/:id', authorize('admin'), updateScheduledReport);
router.delete('/:id', authorize('admin'), deleteScheduledReport);
router.post('/:id/trigger', authorize('admin'), triggerScheduledReport);
router.get('/:id/runs', getReportRuns);

export default router;
