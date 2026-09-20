import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All reporting endpoints require authentication
router.use(authenticate as any);

// Endpoints
router.get('/cds-statement', ReportController.getCdsStatement as any);
router.get('/contract-notes', ReportController.getContractNotes as any);
router.get('/contract-notes/:tradeId', ReportController.getSingleContractNote as any);
router.get('/capital-gains', ReportController.getCapitalGains as any);
router.get('/cash-ledger', ReportController.getCashLedger as any);

export default router;
