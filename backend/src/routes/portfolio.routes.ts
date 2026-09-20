import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);
router.get('/', PortfolioController.getPortfolio as any);

export default router;
