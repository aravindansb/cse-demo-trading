import { Router } from 'express';
import { MarketController } from '../controllers/market.controller';

const router = Router();

router.get('/status', MarketController.getStatus);
router.get('/tickers', MarketController.getTickers);
router.get('/tickers/:symbol', MarketController.getTicker);
router.get('/indices', MarketController.getIndices);
router.post('/simulate-tick', MarketController.simulateTick);
router.post('/sync-cse', MarketController.syncCse);
router.post('/override-session', MarketController.overrideSession);

export default router;
