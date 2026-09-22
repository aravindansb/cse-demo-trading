import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-reset-pin', AuthController.verifyResetPin);
router.post('/reset-password-with-pin', AuthController.resetPasswordWithPin);
router.post('/change-password', authenticate as any, AuthController.changePassword as any);
router.post('/change-pin', authenticate as any, AuthController.changePin as any);
router.get('/me', authenticate as any, AuthController.me as any);

export default router;
