import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TelemetryService } from '../services/telemetry.service';

export class TelemetryController {
  public static async getTelemetry(req: AuthRequest, res: Response) {
    try {
      const data = await TelemetryService.getSystemTelemetry();
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch system telemetry' });
    }
  }

  public static async getEvents(req: AuthRequest, res: Response) {
    try {
      const category = req.query.category as string | undefined;
      const events = await TelemetryService.getAuditEventStream(category);
      return res.status(200).json({ events });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch audit events' });
    }
  }
}
