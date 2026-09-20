import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes with authentication and ADMIN role check
router.use(authenticate as any);
router.use(requireAdmin as any);

router.get('/metrics', AdminController.getMetrics as any);
router.get('/traders/:userId', AdminController.inspectUser as any);
router.delete('/traders/:userId', AdminController.deleteTrader as any);
router.post('/reset-password', AuthController.adminResetPassword as any);
router.post('/reset-pin', AuthController.adminResetPin as any);
router.post('/create-admin', AuthController.createAdminUser as any);

export default router;
