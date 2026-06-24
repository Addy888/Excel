import express from 'express';
import {
  createProcessingProfile,
  getProcessingProfiles,
  getProcessingProfileById,
  updateProcessingProfile,
  deleteProcessingProfile,
  getDefaultProfile
} from '../controllers/processingProfileController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createProcessingProfile);
router.get('/', getProcessingProfiles);
router.get('/default', getDefaultProfile);
router.get('/:id', getProcessingProfileById);
router.put('/:id', updateProcessingProfile);
router.delete('/:id', deleteProcessingProfile);

export default router;
