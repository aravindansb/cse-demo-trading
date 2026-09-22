import prisma from '../utils/prisma';
import { CSE_CONFIG } from '../config/constants';
import { IngestionService } from './ingestion.service';

export class PortfolioService {
  /**
   * Calculate complete portfolio statistics, holdings valuation, and P&L for a user
   */
  public static async getUserPortfolio(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found for user');
    }

    const holdings = await prisma.holding.findMany({
      where: { userId, shares: { gt: 0 } }
    });

    // Fetch current prices from RAM cache or query strictly the held tickers
    const cached = IngestionService.getCachedTickers();
    const tickerMap = new Map<string, any>();
    if (cached && cached.length > 0) {
      for (const t of cached) tickerMap.set(t.symbol, t);
    } else {
      const heldSymbols = holdings.map((h) => h.ticker);
      const tickers = heldSymbols.length > 0
        ? await prisma.marketTicker.findMany({ where: { symbol: { in: heldSymbols } } })
        : [];
      for (const t of tickers) tickerMap.set(t.symbol, t);
    }

    let totalStockValue = 0;
    let totalInvestedInHoldings = 0;
    let totalUnrealizedPnL = 0;

    const itemizedHoldings = holdings.map((h) => {
      const tickerInfo = tickerMap.get(h.ticker);
      const currentPrice = tickerInfo ? tickerInfo.lastTradedPrice : h.averageBuyPrice;
      const currentValue = Math.round(h.shares * currentPrice * 100) / 100;
      const totalCost = Math.round(h.shares * h.averageBuyPrice * 100) / 100;
      const unrealizedPnL = Math.round((currentValue - totalCost) * 100) / 100;
      const unrealizedPnLPercent = totalCost > 0 ? Math.round((unrealizedPnL / totalCost) * 10000) / 100 : 0;

      totalStockValue += currentValue;
      totalInvestedInHoldings += totalCost;
      totalUnrealizedPnL += unrealizedPnL;

      return {
        id: h.id,
        ticker: h.ticker,
        name: tickerInfo?.name || h.ticker,
        sector: tickerInfo?.sector || 'Equities',
        shares: h.shares,
        lockedShares: h.lockedShares,
        availableShares: h.shares - h.lockedShares,
        averageBuyPrice: h.averageBuyPrice,
        currentPrice,
        dayChangePercent: tickerInfo?.changePercent || 0,
        totalCost,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent
      };
    });

    totalStockValue = Math.round(totalStockValue * 100) / 100;
    totalInvestedInHoldings = Math.round(totalInvestedInHoldings * 100) / 100;
    totalUnrealizedPnL = Math.round(totalUnrealizedPnL * 100) / 100;

    const totalCash = wallet.balance;
    const availableCash = Math.round((wallet.balance - wallet.lockedBalance) * 100) / 100;
    const lockedCash = wallet.lockedBalance;

    const totalPortfolioValue = Math.round((totalCash + totalStockValue) * 100) / 100;
    const baselineCapital = CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL;
    const totalReturn = Math.round((totalPortfolioValue - baselineCapital) * 100) / 100;
    const totalReturnPercent = Math.round((totalReturn / baselineCapital) * 10000) / 100;

    // Calculate Realized P&L from trades
    // Realized P&L = Total Return - Unrealized P&L
    const realizedPnL = Math.round((totalReturn - totalUnrealizedPnL) * 100) / 100;

    return {
      wallet: {
        totalCash,
        availableCash,
        lockedCash,
        baselineCapital
      },
      summary: {
        totalPortfolioValue,
        totalStockValue,
        totalInvestedInHoldings,
        unrealizedPnL: totalUnrealizedPnL,
        unrealizedPnLPercent: totalInvestedInHoldings > 0 ? Math.round((totalUnrealizedPnL / totalInvestedInHoldings) * 10000) / 100 : 0,
        realizedPnL,
        totalReturn,
        totalReturnPercent
      },
      holdings: itemizedHoldings
    };
  }
}
