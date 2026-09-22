import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  private static getTargetUserId(req: Request): string {
    const authUser = (req as any).user;
    if (!authUser) {
      throw new Error('Unauthorized');
    }
    const requestedUserId = req.query.userId as string | undefined;
    if (requestedUserId && requestedUserId !== authUser.id) {
      if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
        const error: any = new Error('Access denied: Auditing other traders is restricted to Admin and Super Admin accounts.');
        error.statusCode = 403;
        throw error;
      }
      return requestedUserId;
    }
    return authUser.id;
  }

  public static async getCdsStatement(req: Request, res: Response) {
    try {
      const targetUserId = ReportController.getTargetUserId(req);
      const { startDate, endDate } = req.query;

      const statement = await ReportService.getCdsStatement(
        targetUserId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.status(200).json({ success: true, data: statement });
    } catch (err: any) {
      console.error('[REPORT CONTROLLER] getCdsStatement error:', err);
      const status = err.statusCode || 400;
      res.status(status).json({ success: false, error: err.message });
    }
  }

  public static async getContractNotes(req: Request, res: Response) {
    try {
      const targetUserId = ReportController.getTargetUserId(req);
      const { startDate, endDate, ticker, side } = req.query;

      const notes = await ReportService.getContractNotes(
        targetUserId,
        startDate as string | undefined,
        endDate as string | undefined,
        ticker as string | undefined,
        side as string | undefined
      );

      res.status(200).json({ success: true, data: notes });
    } catch (err: any) {
      console.error('[REPORT CONTROLLER] getContractNotes error:', err);
      const status = err.statusCode || 400;
      res.status(status).json({ success: false, error: err.message });
    }
  }

  public static async getSingleContractNote(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const { tradeId } = req.params;

      const isAdminOrSuper = authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN';
      const note = await ReportService.getSingleContractNote(
        tradeId,
        isAdminOrSuper ? undefined : authUser.id
      );

      res.status(200).json({ success: true, data: note });
    } catch (err: any) {
      console.error('[REPORT CONTROLLER] getSingleContractNote error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async getCapitalGains(req: Request, res: Response) {
    try {
      const targetUserId = ReportController.getTargetUserId(req);
      const { startDate, endDate } = req.query;

      const pnlReport = await ReportService.getCapitalGainsReport(
        targetUserId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.status(200).json({ success: true, data: pnlReport });
    } catch (err: any) {
      console.error('[REPORT CONTROLLER] getCapitalGains error:', err);
      const status = err.statusCode || 400;
      res.status(status).json({ success: false, error: err.message });
    }
  }

  public static async getCashLedger(req: Request, res: Response) {
    try {
      const targetUserId = ReportController.getTargetUserId(req);
      const { startDate, endDate } = req.query;

      const ledger = await ReportService.getCashLedger(
        targetUserId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.status(200).json({ success: true, data: ledger });
    } catch (err: any) {
      console.error('[REPORT CONTROLLER] getCashLedger error:', err);
      const status = err.statusCode || 400;
      res.status(status).json({ success: false, error: err.message });
    }
  }
}
