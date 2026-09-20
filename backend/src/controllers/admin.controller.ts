import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AdminService } from '../services/admin.service';

export class AdminController {
  public static async getMetrics(req: AuthRequest, res: Response) {
    try {
      const data = await AdminService.getGlobalMetrics();
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch admin metrics' });
    }
  }

  public static async inspectUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const data = await AdminService.inspectUser(userId);
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Trader account not found' });
    }
  }

  public static async deleteTrader(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const { userId } = req.params;
      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({ error: 'Administrator 4-digit Security PIN is required' });
      }

      const result = await AdminService.deleteTrader(req.user.id, userId, pin);
      return res.status(200).json(result);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to delete trader account';
      const statusCode = errMsg.includes('Forbidden') || errMsg.includes('Cannot delete')
        ? 403
        : errMsg.includes('not found')
        ? 404
        : 400;
      return res.status(statusCode).json({ error: errMsg });
    }
  }
}
