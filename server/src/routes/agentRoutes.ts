import express from 'express';
import {
  getAgents,
  getAgentPerformanceDashboard,
  getAgentPerformance,
  createAgentPerformance,
  createAgent
} from '../controllers/agentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAgents);
router.post('/', createAgent);
router.get('/performance/dashboard', getAgentPerformanceDashboard);
router.get('/:id/performance', getAgentPerformance);
router.post('/performance', createAgentPerformance);

export default router;
