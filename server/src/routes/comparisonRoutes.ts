import express from 'express';
import {
  compareReports,
  getComparisons,
  getComparison,
  deleteComparison
} from '../controllers/comparisonController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', compareReports);
router.get('/', getComparisons);
router.get('/:id', getComparison);
router.delete('/:id', deleteComparison);

export default router;
