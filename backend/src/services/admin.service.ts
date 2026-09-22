import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { PortfolioService } from './portfolio.service';

export class AdminService {
  /**
   * Aggregate system-wide metrics for the Admin Dashboard
   */
  public static async getGlobalMetrics() {
    const totalUsers = await prisma.user.count();
    const totalTrades = await prisma.trade.count();

    // Sum system trade volume and fee generation
    const trades = await prisma.trade.findMany();
    let totalVolume = 0;
    let totalFees = 0;
    const tickerVolumeMap: Record<string, { symbol: string, totalShares: number, totalTurnover: number, tradeCount: number }> = {};

    for (const trade of trades) {
      totalVolume += trade.grossAmount;
      totalFees += trade.feeAmount;

      if (!tickerVolumeMap[trade.ticker]) {
        tickerVolumeMap[trade.ticker] = {
          symbol: trade.ticker,
          totalShares: 0,
          totalTurnover: 0,
          tradeCount: 0
        };
      }
      tickerVolumeMap[trade.ticker].totalShares += trade.shares;
      tickerVolumeMap[trade.ticker].totalTurnover += trade.grossAmount;
      tickerVolumeMap[trade.ticker].tradeCount += 1;
    }

    // Most traded equities
    const mostTraded = Object.values(tickerVolumeMap)
      .sort((a, b) => b.totalTurnover - a.totalTurnover)
      .slice(0, 5);

    // Calculate total capital deployed across all user wallets & holdings
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    });

    let systemTotalCapital = 0;
    const leaderboard = [];

    for (const user of users) {
      try {
        const portfolio = await PortfolioService.getUserPortfolio(user.id);
        systemTotalCapital += portfolio.summary.totalPortfolioValue;

        const userTradeCount = trades.filter((t) => t.userId === user.id).length;

        leaderboard.push({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          availableCash: portfolio.wallet.availableCash,
          stockValue: portfolio.summary.totalStockValue,
          totalPortfolioValue: portfolio.summary.totalPortfolioValue,
          totalReturn: portfolio.summary.totalReturn,
          totalReturnPercent: portfolio.summary.totalReturnPercent,
          tradeCount: userTradeCount,
          createdAt: user.createdAt
        });
      } catch (err) {
        console.error(`Error calculating portfolio for user ${user.id}:`, err);
      }
    }

    // Sort leaderboard by portfolio value descending
    leaderboard.sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue);

    return {
      overview: {
        totalUsers,
        totalTrades,
        totalVolume: Math.round(totalVolume * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        totalCapitalDeployed: Math.round(systemTotalCapital * 100) / 100
      },
      topTraders: leaderboard.slice(0, 10),
      mostTradedEquities: mostTraded,
      allTraders: leaderboard
    };
  }

  /**
   * Deep inspection of an individual trader's account, ledger, holdings, and orders
   */
  public static async inspectUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const portfolio = await PortfolioService.getUserPortfolio(userId);

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return {
      user,
      portfolio,
      orders,
      trades
    };
  }

  /**
   * Permanently delete a trader account after verifying admin security PIN.
   * Cascades through wallet, holdings, orders, trades, and tournament participants.
   */
  public static async deleteTrader(adminUserId: string, targetUserId: string, pin: string) {
    if (!pin || !/^\d{4}$/.test(pin.trim())) {
      throw new Error('Valid 4-digit Security PIN is required');
    }

    // Fetch admin account to verify PIN
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      throw new Error('Forbidden: Administrator credentials required');
    }

    // Verify PIN
    let isPinValid = false;
    const cleanPin = pin.trim();
    if (admin.securityPinHash) {
      isPinValid = await bcrypt.compare(cleanPin, admin.securityPinHash);
    } else if (cleanPin === '1234') {
      // Default PIN for admin if not yet initialized
      isPinValid = true;
    }

    if (!isPinValid) {
      throw new Error('Invalid Administrator Security PIN');
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      throw new Error('Target trader account not found');
    }

    // Admin protection: Super Admins can delete other Admins and Super Admins, but no one can delete their own account
    if (targetUser.id === adminUserId) {
      throw new Error('Cannot delete your own account');
    }

    if (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') {
      if (admin.role !== 'SUPER_ADMIN') {
        throw new Error('Only Super Administrators can delete administrator or super administrator accounts');
      }
    }

    // Execute atomic cascading deletion
    await prisma.$transaction([
      prisma.tournamentParticipant.deleteMany({ where: { userId: targetUserId } }),
      prisma.trade.deleteMany({ where: { userId: targetUserId } }),
      prisma.order.deleteMany({ where: { userId: targetUserId } }),
      prisma.holding.deleteMany({ where: { userId: targetUserId } }),
      prisma.wallet.deleteMany({ where: { userId: targetUserId } }),
      prisma.user.delete({ where: { id: targetUserId } })
    ]);

    return {
      success: true,
      deletedUser: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role
      },
      message: `${targetUser.role === 'SUPER_ADMIN' ? 'Super Admin' : targetUser.role === 'ADMIN' ? 'Admin' : 'Trader'} ${targetUser.username} has been permanently deleted.`
    };
  }

  /**
   * Reset target user's portfolio back to initial starting state:
   * Cash = Rs. 1,000,000.00, Locked Cash = 0, Holdings cleared, Queued/Pending orders cancelled.
   * Super Admin authorization with 4-digit PIN required.
   */
  public static async resetPortfolio(superAdminUserId: string, targetUserId: string, pin: string) {
    if (!pin || !/^\d{4}$/.test(pin.trim())) {
      throw new Error('Valid 4-digit Security PIN is required');
    }

    const superAdmin = await prisma.user.findUnique({
      where: { id: superAdminUserId }
    });

    if (!superAdmin || superAdmin.role !== 'SUPER_ADMIN') {
      throw new Error('Forbidden: Super Administrator credentials required');
    }

    // Verify PIN
    let isPinValid = false;
    const cleanPin = pin.trim();
    if (superAdmin.securityPinHash) {
      isPinValid = await bcrypt.compare(cleanPin, superAdmin.securityPinHash);
    } else if (cleanPin === '1234') {
      isPinValid = true;
    }

    if (!isPinValid) {
      throw new Error('Invalid Super Administrator Security PIN');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true }
    });

    if (!targetUser) {
      throw new Error('Target trader account not found');
    }

    // Atomic reset
    await prisma.$transaction([
      // 1. Clear all active holdings
      prisma.holding.deleteMany({
        where: { userId: targetUserId }
      }),

      // 2. Cancel all queued and pending orders
      prisma.order.updateMany({
        where: {
          userId: targetUserId,
          status: { in: ['QUEUED', 'PENDING'] }
        },
        data: {
          status: 'CANCELLED',
          notes: 'Cancelled by Super Administrator portfolio reset'
        }
      }),

      // 3. Reset wallet to exact Rs. 1,000,000.00 starting cash
      prisma.wallet.upsert({
        where: { userId: targetUserId },
        update: {
          balance: 1000000.0,
          lockedBalance: 0.0
        },
        create: {
          userId: targetUserId,
          balance: 1000000.0,
          lockedBalance: 0.0
        }
      })
    ]);

    return {
      success: true,
      message: `Portfolio for trader "${targetUser.username}" successfully reset to initial starting capital of Rs. 1,000,000.00. All holdings and active orders have been cleared.`
    };
  }
}
