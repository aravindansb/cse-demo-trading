import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import portfolioRoutes from './routes/portfolio.routes';
import marketRoutes from './routes/market.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import telemetryRoutes from './routes/telemetry.routes';

import { initSocketServer } from './sockets/socketServer';
import { IngestionService } from './services/ingestion.service';
import { AuthService } from './services/auth.service';
import { TournamentService } from './services/tournament.service';
import prisma from './utils/prisma';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/superuser', telemetryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Colombo Stock Exchange (CSE) Demo Trading API',
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);

// Initialize WebSockets
initSocketServer(server);

// Bootstrapping and starting the server
server.listen(PORT, async () => {
  console.log(`[CSE DEMO TRADING SERVER] Running on port ${PORT}`);
  try {
    await IngestionService.ensureDefaultTickers();
    console.log('[CSE DEMO TRADING SERVER] Initialized CSE default tickers');
    await AuthService.ensureUserPins();
    await TournamentService.ensureDefaultTournaments();

    // Ensure administrator accounts are elevated to SUPER_ADMIN
    await prisma.user.updateMany({
      where: {
        OR: [
          { username: 'admin' },
          { username: 'admin_cse' },
          { username: 'Aravinda' },
          { role: 'ADMIN' }
        ]
      },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log('[CSE DEMO TRADING SERVER] Verified supreme SUPER_ADMIN privileges for administrator accounts.');
  } catch (err) {
    console.error('[CSE DEMO TRADING SERVER] Error during bootstrap:', err);
  }
});
