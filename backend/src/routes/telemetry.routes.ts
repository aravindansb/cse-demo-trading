import { Router } from 'express';
import { TelemetryController } from '../controllers/telemetry.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protect all superuser telemetry routes with authenticate and requireSuperAdmin
router.use(authenticate as any);
router.use(requireSuperAdmin as any);

router.get('/telemetry', TelemetryController.getTelemetry as any);
router.get('/events', TelemetryController.getEvents as any);

export default router;
