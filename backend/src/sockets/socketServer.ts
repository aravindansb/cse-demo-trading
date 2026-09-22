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

  // Dedicated Market Session & Queued Order Watcher Loop (evaluates every 5 seconds)
  let lastMarketOpenState: boolean | null = null;
  const processMarketClockAndQueuedOrders = async () => {
    try {
      const currentStatus = await MarketHoursService.isMarketOpen();

      // Detect session opening transition or initial state change to broadcast
      if (lastMarketOpenState !== null && lastMarketOpenState !== currentStatus.isOpen) {
        console.log(`[Market Engine] Session transition: ${lastMarketOpenState ? 'OPEN' : 'CLOSED'} -> ${currentStatus.isOpen ? 'OPEN' : 'CLOSED'}`);
        broadcastSessionChange(currentStatus);
      }
      lastMarketOpenState = currentStatus.isOpen;

      // Whenever market is OPEN (scheduled 09:30 SLT or super admin override), auto-execute queued orders
      if (currentStatus.isOpen) {
        const processedOrders = await MatchingService.processQueuedOrders();
        if (processedOrders.length > 0) {
          console.log(`[Market Engine] Auto-processed ${processedOrders.length} queued order(s) on market open.`);
          for (const order of processedOrders) {
            if (order.status === 'EXECUTED') {
              io.to(`user:${order.userId}`).emit('order:executed', {
                order,
                message: `Your queued order for ${order.shares} shares of ${order.ticker} has executed at Rs. ${order.executedPrice?.toFixed(2)}.`
              });
            } else if (order.status === 'PENDING') {
              io.to(`user:${order.userId}`).emit('order:activated', {
                order,
                message: `Your queued limit order for ${order.shares} shares of ${order.ticker} is now active in the order book at limit Rs. ${order.targetLimitPrice?.toFixed(2)}.`
              });
            }
          }
          io.emit('market:orders-updated');
        }
      }
    } catch (err) {
      console.error('[Market Engine] Error in market session watcher:', err);
    }
  };

  // Run immediately and every 5 seconds
  processMarketClockAndQueuedOrders();
  setInterval(processMarketClockAndQueuedOrders, 5000);

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
        if (executedOrders.length > 0) {
          io.emit('market:orders-updated');
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
