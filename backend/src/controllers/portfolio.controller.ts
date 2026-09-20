import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PortfolioService } from '../services/portfolio.service';

export class PortfolioController {
  public static async getPortfolio(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const portfolio = await PortfolioService.getUserPortfolio(req.user.id);
      return res.status(200).json(portfolio);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve portfolio' });
    }
  }
}
