import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-reset-pin', AuthController.verifyResetPin);
router.post('/reset-password-with-pin', AuthController.resetPasswordWithPin);
router.get('/me', authenticate as any, AuthController.me as any);

export default router;
