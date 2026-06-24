import express from 'express';
import {
  createFormula,
  getFormulas,
  getFormula,
  updateFormula,
  deleteFormula,
  testFormula,
  getBuiltInFormulas
} from '../controllers/formulaController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/built-in', getBuiltInFormulas);
router.post('/test', testFormula);
router.post('/', authorize('admin'), createFormula);
router.get('/', getFormulas);
router.get('/:id', getFormula);
router.put('/:id', authorize('admin'), updateFormula);
router.delete('/:id', authorize('admin'), deleteFormula);

export default router;
