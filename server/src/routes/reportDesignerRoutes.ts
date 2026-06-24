import express from 'express';
import {
  createReportDesign,
  getReportDesigns,
  getReportDesign,
  updateReportDesign,
  deleteReportDesign,
  applyReportDesign
} from '../controllers/reportDesignerController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createReportDesign);
router.get('/', getReportDesigns);
router.get('/:id', getReportDesign);
router.put('/:id', updateReportDesign);
router.delete('/:id', authorize('admin'), deleteReportDesign);
router.post('/apply', applyReportDesign);

export default router;
