import { Router } from 'express';
import {
  getAdminDashboard,
  getUsers,
  updateUser,
  deleteUser,
  getAuditLogsController,
  getAnalytics,
} from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/admin/dashboard', authenticateToken, authorizeRole('admin'), getAdminDashboard);
router.get('/admin/users', authenticateToken, authorizeRole('admin'), getUsers);
router.put('/admin/users/:id', authenticateToken, authorizeRole('admin'), updateUser);
router.delete('/admin/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);
router.get('/admin/audit-logs', authenticateToken, authorizeRole('admin'), getAuditLogsController);
router.get('/admin/analytics', authenticateToken, authorizeRole('admin'), getAnalytics);

export default router;
