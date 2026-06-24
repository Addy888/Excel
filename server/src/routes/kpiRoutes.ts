import express from 'express';
import {
  createKPI,
  getKPIs,
  calculateKPIValues,
  updateKPI,
  deleteKPI,
  getBuiltInKPIs
} from '../controllers/kpiController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/built-in', getBuiltInKPIs);
router.get('/values', calculateKPIValues);
router.post('/', authorize('admin'), createKPI);
router.get('/', getKPIs);
router.put('/:id', authorize('admin'), updateKPI);
router.delete('/:id', authorize('admin'), deleteKPI);

export default router;
