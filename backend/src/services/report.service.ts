import prisma from '../utils/prisma';
import { CSE_CONFIG } from '../config/constants';
import { FeeService } from './fee.service';

export interface BrokerFirmInfo {
  name: string;
  memberOf: string;
  cdsParticipantCode: string;
  registrationNumber: string;
  address: string;
  telephone: string;
  email: string;
  web: string;
  platformEngine?: string;
}

export const OFFICIAL_BROKER_INFO: BrokerFirmInfo = {
  name: 'Colombo Demo Stock Brokers (Pvt) Ltd',
  memberOf: 'Member of the Colombo Stock Exchange',
  cdsParticipantCode: 'BMS / 007',
  registrationNumber: 'CSE/MBR/2026/08',
  address: 'Level 04, West Tower, World Trade Center, Echelon Square, Colombo 01, Sri Lanka',
  telephone: '+94 11 235 6000',
  email: 'settlements@csedemo.lk',
  web: 'www.csedemo.lk',
  platformEngine: 'Powered by Aravinda™ ATS Engine'
};

export class ReportService {
  /**
   * Generates a realistic Sri Lankan CDS Account Number for a given user
   */
  public static getCdsAccountNumber(username: string, userId: string): string {
    const cleanUser = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'TRDR';
    const hexPart = userId.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `CDS/COL/${cleanUser}${hexPart}-N`;
  }

  /**
   * Helper to calculate T+2 settlement date skipping weekends (Saturday & Sunday)
   */
  public static calculateSettlementDate(tradeDate: Date): Date {
    const settlement = new Date(tradeDate);
    let businessDaysAdded = 0;
    while (businessDaysAdded < 2) {
      settlement.setDate(settlement.getDate() + 1);
      const day = settlement.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) and not Saturday (6)
        businessDaysAdded++;
      }
    }
    return settlement;
  }

  /**
   * 1. Official CDS Account Statement
   * Returns complete CDS statement with opening shares, period movements, closing valuation, and NAV.
   */
  public static async getCdsStatement(userId: string, startDate?: string, endDate?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, holdings: true }
    });

    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch all market tickers for pricing
    const tickers = await prisma.marketTicker.findMany();
    const tickerMap = new Map<string, any>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t);
    }

    // Fetch trades
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    // Determine movements per ticker
    const movementMap = new Map<string, {
      preBuys: number;
      preSells: number;
      periodBuys: number;
      periodSells: number;
      periodBuyValue: number;
      periodSellValue: number;
    }>();

    // Initialize map from current holdings and past trades
    for (const h of user.holdings) {
      movementMap.set(h.ticker, {
        preBuys: 0,
        preSells: 0,
        periodBuys: 0,
        periodSells: 0,
        periodBuyValue: 0,
        periodSellValue: 0
      });
    }

    for (const tr of allTrades) {
      if (!movementMap.has(tr.ticker)) {
        movementMap.set(tr.ticker, {
          preBuys: 0,
          preSells: 0,
          periodBuys: 0,
          periodSells: 0,
          periodBuyValue: 0,
          periodSellValue: 0
        });
      }

      const rec = movementMap.get(tr.ticker)!;
      const tradeTime = new Date(tr.createdAt).getTime();

      if (start && tradeTime < start.getTime()) {
        if (tr.side === 'BUY') rec.preBuys += tr.shares;
        if (tr.side === 'SELL') rec.preSells += tr.shares;
      } else if (!end || tradeTime <= end.getTime()) {
        if (tr.side === 'BUY') {
          rec.periodBuys += tr.shares;
          rec.periodBuyValue += tr.grossAmount;
        }
        if (tr.side === 'SELL') {
          rec.periodSells += tr.shares;
          rec.periodSellValue += tr.grossAmount;
        }
      }
    }

    const statementHoldings = [];
    let totalStockValuation = 0;
    let totalStockCost = 0;
    let totalUnrealizedGainLoss = 0;

    for (const [symbol, mv] of movementMap.entries()) {
      const currentHolding = user.holdings.find(h => h.ticker === symbol);
      const openingShares = Math.max(0, mv.preBuys - mv.preSells);
      const closingShares = openingShares + mv.periodBuys - mv.periodSells;

      // Skip tickers that had 0 opening, 0 period movement, and 0 closing
      if (openingShares === 0 && mv.periodBuys === 0 && mv.periodSells === 0 && closingShares === 0) {
        continue;
      }

      const tickerInfo = tickerMap.get(symbol);
      const marketPrice = tickerInfo ? tickerInfo.lastTradedPrice : (currentHolding?.averageBuyPrice || 0);
      const avgCostPrice = currentHolding?.averageBuyPrice || (mv.periodBuys > 0 ? (mv.periodBuyValue / mv.periodBuys) : marketPrice);
      
      const valuation = Math.round(closingShares * marketPrice * 100) / 100;
      const costBasis = Math.round(closingShares * avgCostPrice * 100) / 100;
      const unrealizedPnL = Math.round((valuation - costBasis) * 100) / 100;
      const unrealizedPnLPercent = costBasis > 0 ? Math.round((unrealizedPnL / costBasis) * 10000) / 100 : 0;

      totalStockValuation += valuation;
      totalStockCost += costBasis;
      totalUnrealizedGainLoss += unrealizedPnL;

      statementHoldings.push({
        symbol,
        name: tickerInfo?.name || symbol,
        sector: tickerInfo?.sector || 'Equities',
        openingShares,
        periodBought: mv.periodBuys,
        periodSold: mv.periodSells,
        closingShares,
        lockedShares: currentHolding?.lockedShares || 0,
        availableShares: Math.max(0, closingShares - (currentHolding?.lockedShares || 0)),
        avgCostPrice: Math.round(avgCostPrice * 100) / 100,
        marketPrice,
        valuation,
        costBasis,
        unrealizedPnL,
        unrealizedPnLPercent,
        dayChangePercent: tickerInfo?.changePercent || 0
      });
    }

    // Sort by valuation descending
    statementHoldings.sort((a, b) => b.valuation - a.valuation);

    totalStockValuation = Math.round(totalStockValuation * 100) / 100;
    totalStockCost = Math.round(totalStockCost * 100) / 100;
    totalUnrealizedGainLoss = Math.round(totalUnrealizedGainLoss * 100) / 100;

    const cashBalance = user.wallet.balance;
    const lockedCash = user.wallet.lockedBalance;
    const availableCash = Math.round((cashBalance - lockedCash) * 100) / 100;
    const netAssetValue = Math.round((cashBalance + totalStockValuation) * 100) / 100;

    return {
      statementInfo: {
        statementNumber: `CDS-STM-${new Date().getFullYear()}-${user.id.slice(0, 6).toUpperCase()}`,
        cdsAccountNumber: this.getCdsAccountNumber(user.username, user.id),
        accountHolderName: user.username,
        email: user.email,
        statementPeriod: {
          from: start ? start.toISOString().slice(0, 10) : 'Account Inception',
          to: end.toISOString().slice(0, 10),
          generatedAt: new Date().toISOString()
        },
        broker: OFFICIAL_BROKER_INFO
      },
      portfolioSummary: {
        totalStockValuation,
        totalStockCost,
        totalUnrealizedGainLoss,
        cashBalance,
        availableCash,
        lockedCash,
        netAssetValue,
        initialCapital: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL,
        totalReturn: Math.round((netAssetValue - CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL) * 100) / 100,
        totalReturnPercent: Math.round(((netAssetValue - CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL) / CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL) * 10000) / 100
      },
      holdings: statementHoldings
    };
  }

  /**
   * 2. Broker Bought / Sold Contract Notes
   * Returns list of contract notes with full 4-way 1.12% fee breakdown and settlement date
   */
  public static async getContractNotes(
    userId: string,
    startDate?: string,
    endDate?: string,
    ticker?: string,
    side?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const whereClause: any = { userId };

    if (ticker) {
      whereClause.ticker = ticker;
    }
    if (side) {
      whereClause.side = side.toUpperCase();
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        order: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const tickers = await prisma.marketTicker.findMany();
    const tickerMap = new Map<string, string>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t.name);
    }

    const cdsNumber = this.getCdsAccountNumber(user.username, user.id);

    const contractNotes = trades.map(trade => {
      const tradeDate = new Date(trade.createdAt);
      const settlementDate = this.calculateSettlementDate(tradeDate);
      const feeDetails = trade.side === 'BUY'
        ? FeeService.calculateBuy(trade.shares, trade.executedPrice)
        : FeeService.calculateSell(trade.shares, trade.executedPrice);

      const contractNoteNo = `CN-${tradeDate.getFullYear()}${(tradeDate.getMonth() + 1).toString().padStart(2, '0')}-${trade.id.slice(0, 6).toUpperCase()}`;

      return {
        id: trade.id,
        contractNoteNo,
        orderId: trade.orderId,
        tradeDate: tradeDate.toISOString(),
        settlementDate: settlementDate.toISOString().slice(0, 10),
        settlementCycle: 'T+2',
        cdsAccountNumber: cdsNumber,
        clientName: user.username,
        clientEmail: user.email,
        ticker: trade.ticker,
        companyName: tickerMap.get(trade.ticker) || trade.ticker,
        side: trade.side, // "BUY" or "SELL"
        sideLabel: trade.side === 'BUY' ? 'BOUGHT' : 'SOLD',
        shares: trade.shares,
        executedPrice: trade.executedPrice,
        grossAmount: trade.grossAmount,
        fees: {
          rate: CSE_CONFIG.FEE_RATE,
          ratePercent: '1.120%',
          totalFee: trade.feeAmount,
          breakdown: feeDetails.breakdown
        },
        netAmount: trade.netAmount, // Payable for BUY, Receivable for SELL
        status: 'SETTLED',
        broker: OFFICIAL_BROKER_INFO
      };
    });

    return {
      summary: {
        totalNotes: contractNotes.length,
        totalBoughtValue: contractNotes.filter(n => n.side === 'BUY').reduce((sum, n) => sum + n.grossAmount, 0),
        totalSoldValue: contractNotes.filter(n => n.side === 'SELL').reduce((sum, n) => sum + n.grossAmount, 0),
        totalFeesPaid: Math.round(contractNotes.reduce((sum, n) => sum + n.fees.totalFee, 0) * 100) / 100
      },
      contractNotes
    };
  }

  /**
   * 3. Single Contract Note Slip
   */
  public static async getSingleContractNote(tradeId: string, userId?: string) {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        user: true,
        order: true
      }
    });

    if (!trade) {
      throw new Error('Contract note trade not found');
    }

    if (userId && trade.userId !== userId) {
      throw new Error('Unauthorized access to contract note');
    }

    const tickerInfo = await prisma.marketTicker.findUnique({
      where: { symbol: trade.ticker }
    });

    const tradeDate = new Date(trade.createdAt);
    const settlementDate = this.calculateSettlementDate(tradeDate);
    const feeDetails = trade.side === 'BUY'
      ? FeeService.calculateBuy(trade.shares, trade.executedPrice)
      : FeeService.calculateSell(trade.shares, trade.executedPrice);

    const contractNoteNo = `CN-${tradeDate.getFullYear()}${(tradeDate.getMonth() + 1).toString().padStart(2, '0')}-${trade.id.slice(0, 6).toUpperCase()}`;

    return {
      contractNoteNo,
      tradeId: trade.id,
      orderId: trade.orderId,
      tradeDate: tradeDate.toISOString(),
      settlementDate: settlementDate.toISOString().slice(0, 10),
      settlementCycle: 'T+2',
      client: {
        id: trade.user.id,
        username: trade.user.username,
        email: trade.user.email,
        cdsAccountNumber: this.getCdsAccountNumber(trade.user.username, trade.user.id)
      },
      broker: OFFICIAL_BROKER_INFO,
      security: {
        symbol: trade.ticker,
        companyName: tickerInfo?.name || trade.ticker,
        sector: tickerInfo?.sector || 'Equities'
      },
      transaction: {
        side: trade.side,
        sideDescription: trade.side === 'BUY' ? 'BOUGHT ON ACCOUNT OF CLIENT' : 'SOLD ON ACCOUNT OF CLIENT',
        shares: trade.shares,
        executedPrice: trade.executedPrice,
        grossConsideration: trade.grossAmount,
        fees: {
          rate: CSE_CONFIG.FEE_RATE,
          rateFormatted: '1.120%',
          totalFee: trade.feeAmount,
          itemized: [
            { name: 'Brokerage Commission', rate: '0.640%', amount: feeDetails.breakdown.brokerage },
            { name: 'SEC Cess', rate: '0.072%', amount: feeDetails.breakdown.secCess },
            { name: 'CDS Clearance Fee', rate: '0.024%', amount: feeDetails.breakdown.cdsFee },
            { name: 'Share Transaction Levy', rate: '0.300%', amount: feeDetails.breakdown.shareLevy }
          ]
        },
        netConsideration: trade.netAmount,
        payableOrReceivable: trade.side === 'BUY' ? 'NET AMOUNT PAYABLE' : 'NET PROCEEDS RECEIVABLE'
      },
      settlementStatus: 'CONFIRMED & SETTLED',
      regulatoryNote: 'This transaction is governed by the Rules and Regulations of the Colombo Stock Exchange and the Central Depository Systems (Pvt) Ltd.'
    };
  }

  /**
   * 4. Capital Gains & P&L Statement (Tax & Performance Accounting)
   */
  public static async getCapitalGainsReport(userId: string, startDate?: string, endDate?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, holdings: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const whereClause: any = { userId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    const tickers = await prisma.marketTicker.findMany();
    const tickerMap = new Map<string, any>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t);
    }

    // Match buys and sells for realized P&L estimation
    const closedPositions: any[] = [];
    let totalRealizedGain = 0;
    let totalRealizedLoss = 0;
    let totalFeesPaid = 0;
    let winCount = 0;
    let lossCount = 0;

    // We can match SELL trades with the average buy price of the holding or past buys
    for (const trade of trades) {
      totalFeesPaid += trade.feeAmount;

      if (trade.side === 'SELL') {
        const holding = user.holdings.find(h => h.ticker === trade.ticker);
        const costPrice = holding?.averageBuyPrice || (trade.executedPrice * 0.95);
        const totalCostBasis = Math.round(trade.shares * costPrice * 100) / 100;
        const grossProceeds = trade.grossAmount;
        const netProceeds = trade.netAmount; // grossProceeds - feeAmount
        
        // Net Realized P&L = Net proceeds - Cost basis
        const netPnL = Math.round((netProceeds - totalCostBasis) * 100) / 100;
        const pnlPercent = totalCostBasis > 0 ? Math.round((netPnL / totalCostBasis) * 10000) / 100 : 0;

        if (netPnL >= 0) {
          totalRealizedGain += netPnL;
          winCount++;
        } else {
          totalRealizedLoss += Math.abs(netPnL);
          lossCount++;
        }

        const tickerInfo = tickerMap.get(trade.ticker);

        closedPositions.push({
          id: trade.id,
          date: trade.createdAt,
          ticker: trade.ticker,
          companyName: tickerInfo?.name || trade.ticker,
          sector: tickerInfo?.sector || 'Equities',
          shares: trade.shares,
          avgBuyPrice: costPrice,
          costBasis: totalCostBasis,
          sellPrice: trade.executedPrice,
          grossProceeds,
          feePaid: trade.feeAmount,
          netProceeds,
          netPnL,
          pnlPercent,
          isProfit: netPnL >= 0
        });
      }
    }

    // Unrealized Positions
    const openPositions: any[] = [];
    let totalUnrealizedGain = 0;

    for (const h of user.holdings) {
      if (h.shares <= 0) continue;
      const tickerInfo = tickerMap.get(h.ticker);
      const marketPrice = tickerInfo ? tickerInfo.lastTradedPrice : h.averageBuyPrice;
      const costBasis = Math.round(h.shares * h.averageBuyPrice * 100) / 100;
      const currentValuation = Math.round(h.shares * marketPrice * 100) / 100;
      const unrealizedPnL = Math.round((currentValuation - costBasis) * 100) / 100;
      const unrealizedPnLPercent = costBasis > 0 ? Math.round((unrealizedPnL / costBasis) * 10000) / 100 : 0;

      totalUnrealizedGain += unrealizedPnL;

      openPositions.push({
        ticker: h.ticker,
        companyName: tickerInfo?.name || h.ticker,
        sector: tickerInfo?.sector || 'Equities',
        shares: h.shares,
        avgBuyPrice: h.averageBuyPrice,
        costBasis,
        marketPrice,
        currentValuation,
        unrealizedPnL,
        unrealizedPnLPercent,
        isProfit: unrealizedPnL >= 0
      });
    }

    const netRealizedPnL = Math.round((totalRealizedGain - totalRealizedLoss) * 100) / 100;
    const totalClosedTrades = winCount + lossCount;
    const winRate = totalClosedTrades > 0 ? Math.round((winCount / totalClosedTrades) * 10000) / 100 : 0;

    return {
      cdsAccountNumber: this.getCdsAccountNumber(user.username, user.id),
      clientName: user.username,
      summary: {
        totalRealizedGain: Math.round(totalRealizedGain * 100) / 100,
        totalRealizedLoss: Math.round(totalRealizedLoss * 100) / 100,
        netRealizedPnL,
        totalUnrealizedGain: Math.round(totalUnrealizedGain * 100) / 100,
        totalFeesPaid: Math.round(totalFeesPaid * 100) / 100,
        totalClosedTrades,
        winCount,
        lossCount,
        winRate
      },
      closedPositions: closedPositions.reverse(),
      openPositions
    };
  }

  /**
   * 5. Cash Movement Ledger
   */
  public static async getCashLedger(userId: string, startDate?: string, endDate?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    const allTrades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    const entries: any[] = [];
    let runningBalance = CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL;

    // Initial Account Funding
    entries.push({
      date: user.createdAt,
      type: 'CAPITAL_ALLOCATION',
      reference: 'INIT-VIRTUAL-FUNDING',
      description: 'Initial Virtual Trading Capital Grant (Colombo Stock Exchange Demo)',
      debit: 0,
      credit: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL,
      balance: runningBalance
    });

    for (const trade of allTrades) {
      const tradeDate = new Date(trade.createdAt);
      const contractRef = `CN-${tradeDate.getFullYear()}${(tradeDate.getMonth() + 1).toString().padStart(2, '0')}-${trade.id.slice(0, 6).toUpperCase()}`;

      if (trade.side === 'BUY') {
        // Debit: netAmount (Gross + Fee)
        runningBalance = Math.round((runningBalance - trade.netAmount) * 100) / 100;
        entries.push({
          date: trade.createdAt,
          type: 'TRADE_BUY',
          reference: contractRef,
          description: `Bought ${trade.shares.toLocaleString()} ${trade.ticker} @ LKR ${trade.executedPrice.toFixed(2)} (Incl. 1.12% fees LKR ${trade.feeAmount.toFixed(2)})`,
          debit: trade.netAmount,
          credit: 0,
          balance: runningBalance
        });
      } else {
        // Credit: netAmount (Gross - Fee)
        runningBalance = Math.round((runningBalance + trade.netAmount) * 100) / 100;
        entries.push({
          date: trade.createdAt,
          type: 'TRADE_SELL',
          reference: contractRef,
          description: `Sold ${trade.shares.toLocaleString()} ${trade.ticker} @ LKR ${trade.executedPrice.toFixed(2)} (Net of 1.12% fees LKR ${trade.feeAmount.toFixed(2)})`,
          debit: 0,
          credit: trade.netAmount,
          balance: runningBalance
        });
      }
    }

    // Filter by dates if specified
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    const filteredEntries = entries.filter(e => {
      const time = new Date(e.date).getTime();
      return time >= start && time <= end;
    });

    return {
      cdsAccountNumber: this.getCdsAccountNumber(user.username, user.id),
      clientName: user.username,
      wallet: {
        currentBalance: user.wallet.balance,
        lockedBalance: user.wallet.lockedBalance,
        availableBalance: Math.round((user.wallet.balance - user.wallet.lockedBalance) * 100) / 100
      },
      ledger: filteredEntries.reverse()
    };
  }
}
