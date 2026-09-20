import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller';
import { authenticate, requireAdmin, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public Rankings & Badges
router.get('/', LeaderboardController.getLeaderboard);
router.get('/badges', LeaderboardController.getBadges);

// Authenticated User Rank & Badges (Widget)
router.get('/me', authenticate as any, LeaderboardController.getMyRank as any);

// Tournaments
router.get('/tournaments', optionalAuthenticate as any, LeaderboardController.getTournaments as any);
router.post('/tournaments/:id/join', authenticate as any, LeaderboardController.joinTournament as any);

// Admin Tournament Management
router.post('/tournaments', authenticate as any, requireAdmin as any, LeaderboardController.createTournament as any);

export default router;
