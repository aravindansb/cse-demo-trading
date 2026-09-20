import { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';
import { BadgeService } from '../services/badge.service';
import { TournamentService } from '../services/tournament.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class LeaderboardController {
  public static async getLeaderboard(req: Request, res: Response) {
    try {
      const timeframe = (req.query.timeframe as 'all' | 'month' | 'week') || 'all';
      const data = await LeaderboardService.getLeaderboard(timeframe);
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch leaderboard' });
    }
  }

  public static async getBadges(req: Request, res: Response) {
    try {
      const badges = BadgeService.getAllBadges();
      return res.status(200).json(badges);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch badges' });
    }
  }

  public static async getMyRank(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const data = await LeaderboardService.getUserRankSummary(req.user.id);
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch user rank' });
    }
  }

  public static async getTournaments(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user ? req.user.id : undefined;
      const data = await TournamentService.getTournaments(currentUserId);
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch tournaments' });
    }
  }

  public static async joinTournament(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Sign in required to enter trading competitions' });
      }
      const tournamentId = req.params.id;
      const result = await TournamentService.joinTournament(req.user.id, tournamentId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to join tournament' });
    }
  }

  public static async createTournament(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      const tournament = await TournamentService.createTournament(req.body);
      return res.status(201).json(tournament);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to create tournament' });
    }
  }
}
