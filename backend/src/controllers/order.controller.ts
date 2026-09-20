import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MatchingService } from '../services/matching.service';
import { FeeService } from '../services/fee.service';
import prisma from '../utils/prisma';

export class OrderController {
  /**
   * Place an order
   */
  public static async placeOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { ticker, side, orderType, shares, targetLimitPrice } = req.body;

      const order = await MatchingService.placeOrder({
        userId: req.user.id,
        ticker,
        side,
        orderType,
        shares: Number(shares),
        targetLimitPrice: targetLimitPrice ? Number(targetLimitPrice) : undefined
      });

      return res.status(201).json({
        message: order.status === 'QUEUED'
          ? 'Order successfully queued outside market hours'
          : order.status === 'EXECUTED'
            ? 'Order executed successfully'
            : 'Order placed in order book',
        order
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to place order' });
    }
  }

  /**
   * Get user's orders
   */
  public static async getOrders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { status } = req.query;
      const whereClause: any = { userId: req.user.id };
      if (status && typeof status === 'string') {
        whereClause.status = status;
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(orders);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve orders' });
    }
  }

  /**
   * Cancel an open or queued order
   */
  public static async cancelOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const cancelledOrder = await MatchingService.cancelOrder(id, req.user.id);

      return res.status(200).json({
        message: 'Order cancelled successfully. Funds/shares unlocked.',
        order: cancelledOrder
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to cancel order' });
    }
  }

  /**
   * Get user's completed trade history
   */
  public static async getTrades(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const trades = await prisma.trade.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(trades);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve trades' });
    }
  }

  /**
   * Real-time fee preview endpoint for UI order form
   */
  public static async calculateFeePreview(req: AuthRequest, res: Response) {
    try {
      const { side, shares, price } = req.body;
      const nShares = Number(shares);
      const nPrice = Number(price);

      if (nShares <= 0 || nPrice <= 0) {
        return res.status(400).json({ error: 'Shares and price must be greater than zero' });
      }

      const calculation = side === 'BUY'
        ? FeeService.calculateBuy(nShares, nPrice)
        : FeeService.calculateSell(nShares, nPrice);

      return res.status(200).json(calculation);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Fee calculation failed' });
    }
  }
}
