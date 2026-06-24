import express from 'express';
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamPerformance,
  assignAgentToTeam,
  removeAgentFromTeam
} from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', authorize('admin'), createTeam);
router.get('/', getTeams);
router.get('/:id', getTeam);
router.put('/:id', authorize('admin'), updateTeam);
router.delete('/:id', authorize('admin'), deleteTeam);
router.get('/:id/performance', getTeamPerformance);
router.post('/assign-agent', authorize('admin'), assignAgentToTeam);
router.delete('/:agentId/remove-agent', authorize('admin'), removeAgentFromTeam);

export default router;
