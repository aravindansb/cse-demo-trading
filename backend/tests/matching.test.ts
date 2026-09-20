import prisma from '../src/utils/prisma';
import { AuthService } from '../src/services/auth.service';
import { MatchingService } from '../src/services/matching.service';
import { MarketHoursService } from '../src/services/marketHours.service';
import { IngestionService } from '../src/services/ingestion.service';
import { PortfolioService } from '../src/services/portfolio.service';

describe('MatchingService & Trading Flow Integration', () => {
  let testUserId: string;

  beforeAll(async () => {
    await IngestionService.ensureDefaultTickers();
    // Register a test trader
    const testUsername = `test_trader_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const regResult = await AuthService.register({
      username: testUsername,
      email: testEmail,
      password: 'SecurePassword123!'
    });
    testUserId = regResult.user.id;
  });

  afterAll(async () => {
    // Reset any session override
    await MarketHoursService.setSessionOverride(false, false);
  });

  it('should initialize newly registered user with exactly Rs. 1,000,000.00 virtual cash balance', async () => {
    const portfolio = await PortfolioService.getUserPortfolio(testUserId);
    expect(portfolio.wallet.totalCash).toBe(1000000.0);
    expect(portfolio.wallet.availableCash).toBe(1000000.0);
    expect(portfolio.wallet.lockedCash).toBe(0.0);
    expect(portfolio.holdings.length).toBe(0);
  });

  it('should place order as QUEUED when market is closed, and lock cash in wallet', async () => {
    // Force simulated closed market
    await MarketHoursService.setSessionOverride(false, true);

    const order = await MatchingService.placeOrder({
      userId: testUserId,
      ticker: 'JKH.N0000',
      side: 'BUY',
      orderType: 'MARKET',
      shares: 100
    });

    expect(order.status).toBe('QUEUED');
    expect(order.ticker).toBe('JKH.N0000');
    expect(order.shares).toBe(100);
    expect(order.totalCost).toBeGreaterThan(0);

    // Verify wallet has locked balance
    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet?.lockedBalance).toBe(order.totalCost);
    expect(wallet?.balance).toBe(1000000.0);
    expect((wallet?.balance || 0) - (wallet?.lockedBalance || 0)).toBe(1000000.0 - order.totalCost);
  });

  it('should execute QUEUED orders automatically when market opens', async () => {
    // Force simulated open market
    await MarketHoursService.setSessionOverride(true, true);

    // Process queued orders
    const executedOrders = await MatchingService.processQueuedOrders();
    expect(executedOrders.length).toBeGreaterThanOrEqual(1);

    // Verify holding was created for JKH
    const holding = await prisma.holding.findUnique({
      where: { userId_ticker: { userId: testUserId, ticker: 'JKH.N0000' } }
    });
    expect(holding).toBeDefined();
    expect(holding?.shares).toBe(100);

    // Verify trade was recorded with CSE 1.12% fee
    const trades = await prisma.trade.findMany({
      where: { userId: testUserId }
    });
    expect(trades.length).toBe(1);
    expect(trades[0].feeAmount).toBeGreaterThan(0);

    // Verify wallet locked balance is now released
    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet?.lockedBalance).toBe(0);
    expect(wallet?.balance).toBeLessThan(1000000.0);
  });

  it('should place and execute a SELL order during open market hours with 1.12% fee deducted', async () => {
    const preSellPortfolio = await PortfolioService.getUserPortfolio(testUserId);
    const preSellCash = preSellPortfolio.wallet.availableCash;

    const sellOrder = await MatchingService.placeOrder({
      userId: testUserId,
      ticker: 'JKH.N0000',
      side: 'SELL',
      orderType: 'MARKET',
      shares: 50
    });

    expect(sellOrder.status).toBe('EXECUTED');

    const postSellPortfolio = await PortfolioService.getUserPortfolio(testUserId);
    expect(postSellPortfolio.wallet.availableCash).toBeGreaterThan(preSellCash);

    const jkhHolding = postSellPortfolio.holdings.find(h => h.ticker === 'JKH.N0000');
    expect(jkhHolding?.shares).toBe(50);
  });
});
