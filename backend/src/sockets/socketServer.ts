import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { IngestionService } from '../services/ingestion.service';
import { MatchingService } from '../services/matching.service';
import { MarketHoursService } from '../services/marketHours.service';

let ioInstance: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // User can join their private room for targeted order notifications
    socket.on('join-user-room', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  // Wire IngestionService tick callbacks
  IngestionService.startIngestionLoop(async (tickers, indices) => {
    // Broadcast live ticks to all clients
    io.emit('market:ticks', {
      tickers,
      indices,
      timestamp: new Date().toISOString()
    });

    // Check if market is active before evaluating limit orders
    const marketStatus = await MarketHoursService.isMarketOpen();
    if (marketStatus.isOpen) {
      for (const ticker of tickers) {
        const executedOrders = await MatchingService.evaluatePendingOrdersOnTick(
          ticker.symbol,
          ticker.lastTradedPrice
        );

        for (const order of executedOrders) {
          io.to(`user:${order.userId}`).emit('order:executed', {
            order,
            message: `Your limit order for ${order.shares} shares of ${order.ticker} has executed at Rs. ${order.executedPrice?.toFixed(2)}.`
          });
        }
      }
    }
  });

  return io;
};

export const getSocketIO = () => ioInstance;

export const broadcastSessionChange = (status: any) => {
  if (ioInstance) {
    ioInstance.emit('market:session', status);
  }
};
