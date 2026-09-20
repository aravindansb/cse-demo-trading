import { Request, Response } from 'express';
import { MarketHoursService } from '../services/marketHours.service';
import { IngestionService } from '../services/ingestion.service';
import { MatchingService } from '../services/matching.service';

export class MarketController {
  public static async getStatus(req: Request, res: Response) {
    try {
      const status = await MarketHoursService.isMarketOpen();
      return res.status(200).json(status);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to get market status' });
    }
  }

  public static async getTickers(req: Request, res: Response) {
    try {
      const tickers = await IngestionService.getAllTickers();
      return res.status(200).json(tickers);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to get tickers' });
    }
  }

  public static async getTicker(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      const ticker = await IngestionService.getTicker(symbol);
      if (!ticker) return res.status(404).json({ error: 'Ticker not found' });
      return res.status(200).json(ticker);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to get ticker' });
    }
  }

  public static async getIndices(req: Request, res: Response) {
    try {
      const indices = IngestionService.getIndices();
      return res.status(200).json(indices);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to get indices' });
    }
  }

  public static async simulateTick(req: Request, res: Response) {
    try {
      const result = await IngestionService.simulateMarketTicks(true);
      return res.status(200).json({ message: 'Tick simulated successfully', result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to simulate tick' });
    }
  }

  public static async syncCse(req: Request, res: Response) {
    try {
      const result = await IngestionService.syncLiveCseData();
      return res.status(200).json({
        message: `Successfully synchronized ${result.stockCount} CSE listed stocks and real indices`,
        result
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to sync with CSE live data' });
    }
  }

  public static async overrideSession(req: Request, res: Response) {
    try {
      const { isOpen, isOverrideActive } = req.body;
      const updatedSession = await MarketHoursService.setSessionOverride(Boolean(isOpen), Boolean(isOverrideActive));

      let processedOrders: any[] = [];
      if (isOpen && isOverrideActive) {
        processedOrders = await MatchingService.processQueuedOrders();
      }

      return res.status(200).json({
        message: isOverrideActive
          ? `Market session manually overridden to ${isOpen ? 'OPEN' : 'CLOSED'}`
          : 'Market session restored to real Sri Lanka Standard Time schedule',
        session: updatedSession,
        processedQueuedOrdersCount: processedOrders.length
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to set session override' });
    }
  }
}
