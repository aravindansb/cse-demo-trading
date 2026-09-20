import prisma from '../utils/prisma';
import { CSE_CONFIG } from '../config/constants';
import { BadgeService, BadgeDefinition } from './badge.service';

export interface LeaderboardTrader {
  rank: number;
  id: string;
  username: string;
  role: string;
  availableCash: number;
  stockValue: number;
  totalPortfolioValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  tradeCount: number;
  winRate: number;
  isQualified: boolean; // Minimum 3 trades executed
  badges: BadgeDefinition[];
  topBadge?: BadgeDefinition;
}

export class LeaderboardService {
  /**
   * Retrieves live leaderboard rankings for a given timeframe
   */
  public static async getLeaderboard(timeframe: 'all' | 'month' | 'week' = 'all') {
    const users = await prisma.user.findMany({
      include: {
        wallet: true,
        holdings: {
          where: { shares: { gt: 0 } }
        },
        trades: true,
        orders: true
      }
    });

    const tickers = await prisma.marketTicker.findMany();
    const tickerMap = new Map<string, any>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t);
    }

    // Determine timeframe boundaries
    const now = new Date();
    let startDate: Date | undefined;
    if (timeframe === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const traderStats: Omit<LeaderboardTrader, 'rank'>[] = [];

    for (const u of users) {
      const availableCash = u.wallet?.balance || 0;
      let stockValue = 0;
      const sectorsSet = new Set<string>();

      for (const h of u.holdings) {
        const liveTicker = tickerMap.get(h.ticker);
        const price = liveTicker ? liveTicker.lastTradedPrice : h.averageBuyPrice;
        stockValue += h.shares * price;
        if (liveTicker?.sector) {
          sectorsSet.add(liveTicker.sector);
        }
      }

      stockValue = Math.round(stockValue * 100) / 100;
      const totalPortfolioValue = Math.round((availableCash + stockValue) * 100) / 100;
      const initialCapital = CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL;

      // Filter trades for period if requested
      const relevantTrades = startDate
        ? u.trades.filter(t => new Date(t.createdAt) >= startDate!)
        : u.trades;

      const tradeCount = relevantTrades.length;

      // Win rate computation on SELL trades
      const sellTrades = relevantTrades.filter(t => t.side === 'SELL');
      let winningTrades = 0;
      for (const s of sellTrades) {
        // Look up corresponding order or estimate against executed price vs avg buy
        const holding = u.holdings.find(h => h.ticker === s.ticker);
        const buyPrice = holding?.averageBuyPrice || s.executedPrice;
        if (s.executedPrice > buyPrice) {
          winningTrades++;
        }
      }
      const winRate = sellTrades.length > 0
        ? Math.round((winningTrades / sellTrades.length) * 100)
        : (relevantTrades.length > 0 ? 50 : 0);

      const totalReturn = Math.round((totalPortfolioValue - initialCapital) * 100) / 100;
      const totalReturnPercent = Math.round((totalReturn / initialCapital) * 10000) / 100;

      // Minimum 3 trades to qualify for competitive rankings
      const isQualified = u.trades.length >= 3;

      // Check for limit orders
      const hasBuyLimit = u.orders.some(o => o.side === 'BUY' && o.orderType === 'LIMIT');
      const hasSellLimit = u.orders.some(o => o.side === 'SELL' && o.orderType === 'LIMIT');

      traderStats.push({
        id: u.id,
        username: u.username,
        role: u.role,
        availableCash,
        stockValue,
        totalPortfolioValue,
        totalReturn,
        totalReturnPercent,
        tradeCount,
        winRate,
        isQualified,
        badges: [], // Filled after ranking
        distinctSectorsCount: sectorsSet.size,
        hasBuyAndSellLimit: hasBuyLimit && hasSellLimit
      } as any);
    }

    // Sort: Qualified traders first by totalReturnPercent descending, then non-qualified
    traderStats.sort((a, b) => {
      if (a.isQualified && !b.isQualified) return -1;
      if (!a.isQualified && b.isQualified) return 1;
      return b.totalReturnPercent - a.totalReturnPercent;
    });

    // Assign ranks and calculate badges
    const rankedTraders: LeaderboardTrader[] = traderStats.map((t: any, index) => {
      const rank = index + 1;
      const badges = BadgeService.evaluateBadges({
        rank: t.isQualified ? rank : undefined,
        totalReturnPercent: t.totalReturnPercent,
        tradeCount: t.tradeCount,
        winRate: t.winRate,
        totalPortfolioValue: t.totalPortfolioValue,
        distinctSectorsCount: t.distinctSectorsCount || 0,
        hasBuyAndSellLimit: !!t.hasBuyAndSellLimit
      });

      return {
        rank,
        id: t.id,
        username: t.username,
        role: t.role,
        availableCash: t.availableCash,
        stockValue: t.stockValue,
        totalPortfolioValue: t.totalPortfolioValue,
        totalReturn: t.totalReturn,
        totalReturnPercent: t.totalReturnPercent,
        tradeCount: t.tradeCount,
        winRate: t.winRate,
        isQualified: t.isQualified,
        badges,
        topBadge: badges[0]
      };
    });

    const podium = {
      gold: rankedTraders[0] || null,
      silver: rankedTraders[1] || null,
      bronze: rankedTraders[2] || null
    };

    return {
      timeframe,
      totalTraders: rankedTraders.length,
      qualifiedTradersCount: rankedTraders.filter(t => t.isQualified).length,
      podium,
      rankings: rankedTraders
    };
  }

  /**
   * Retrieves single user rank and badge overview for terminal widget
   */
  public static async getUserRankSummary(userId: string) {
    const leaderboard = await this.getLeaderboard('all');
    const trader = leaderboard.rankings.find(t => t.id === userId);

    if (!trader) {
      return {
        rank: null,
        totalTraders: leaderboard.totalTraders,
        totalReturnPercent: 0,
        badges: [],
        topBadge: null
      };
    }

    return {
      rank: trader.rank,
      totalTraders: leaderboard.totalTraders,
      totalReturn: trader.totalReturn,
      totalReturnPercent: trader.totalReturnPercent,
      isQualified: trader.isQualified,
      tradesRequired: Math.max(0, 3 - trader.tradeCount),
      badges: trader.badges,
      topBadge: trader.topBadge
    };
  }
}
