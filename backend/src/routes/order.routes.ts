import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.use(authenticate as any);

router.post('/', OrderController.placeOrder as any);
router.get('/', OrderController.getOrders as any);
router.delete('/:id', OrderController.cancelOrder as any);
router.get('/trades', OrderController.getTrades as any);
router.post('/fee-preview', OrderController.calculateFeePreview as any);

export default router;
