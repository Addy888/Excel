import express from 'express';
import {
  getCampaigns,
  getCampaignAnalytics,
  getAllCampaignReports,
  createCampaignReport,
  createCampaign,
  getCampaignAgents
} from '../controllers/campaignController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getCampaigns);
router.post('/', createCampaign);
router.get('/reports', getAllCampaignReports);
router.post('/reports', createCampaignReport);
router.get('/:id/analytics', getCampaignAnalytics);
router.get('/:id/agents', getCampaignAgents);

export default router;
