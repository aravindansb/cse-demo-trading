import axios from 'axios';
import fs from 'fs';
import path from 'path';
import prisma from '../utils/prisma';

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export function classifySector(name: string, symbol: string): string {
  const upper = (name + ' ' + symbol).toUpperCase();
  if (upper.includes('BANK') || upper.includes('COMMERCIAL BANK') || upper.includes('SAMPATH') || upper.includes('HATTON') || upper.includes('SEYLAN') || upper.includes('DFCC') || upper.includes('AMANA BANK') || upper.includes('UNION BANK') || upper.includes('PAN ASIA') || upper.includes('NATIONS TRUST')) return 'Banking';
  if (upper.includes('FINANCE') || upper.includes('LEASING') || upper.includes('CAPITAL') || upper.includes('ALLIANCE') || upper.includes('INVESTMENT') || upper.includes('HOLDINGS') || upper.includes('CREDIT') || upper.includes('FUND') || upper.includes('WEALTH')) return 'Diversified Financials';
  if (upper.includes('HOTEL') || upper.includes('RESORT') || upper.includes('LEISURE') || upper.includes('VILLAS') || upper.includes('BEACH') || upper.includes('TRAVEL') || upper.includes('INN') || upper.includes('DOLPHIN') || upper.includes('CITRUS') || upper.includes('BERUWALA') || upper.includes('EDEN')) return 'Consumer Services';
  if (upper.includes('TEA') || upper.includes('PLANTATION') || upper.includes('ESTATES') || upper.includes('DISTILLER') || upper.includes('BEVERAGE') || upper.includes('BREW') || upper.includes('FOOD') || upper.includes('SUGAR') || upper.includes('FARMS') || upper.includes('GRAIN') || upper.includes('TOBACCO') || upper.includes('AGRI') || upper.includes('KANDY') || upper.includes('SOY') || upper.includes('CEYLON COLD') || upper.includes('DILMAH') || upper.includes('BALANGODA') || upper.includes('BOGAWANTALAWA')) return 'Food, Beverage & Tobacco';
  if (upper.includes('INSURANCE') || upper.includes('TAKAFUL') || upper.includes('ASSURANCE') || upper.includes('CEYLINCO') || upper.includes('JANASHAKTHI') || upper.includes('HNB ASSURANCE') || upper.includes('CO-OPERATIVE INSURANCE')) return 'Insurance';
  if (upper.includes('HOSPITAL') || upper.includes('HEALTH') || upper.includes('MEDICAL') || upper.includes('SURGICAL') || upper.includes('PHARMA') || upper.includes('DURDANS') || upper.includes('ASIRI') || upper.includes('NAWALOKA') || upper.includes('LANKA HOSPITALS') || upper.includes('CEYLON HOSPITALS')) return 'Health Care';
  if (upper.includes('TELECOM') || upper.includes('DIALOG') || upper.includes('SLT') || upper.includes('MOBITEL') || upper.includes('AXIATA') || upper.includes('COMMUNICATION')) return 'Telecommunication';
  if (upper.includes('CABLE') || upper.includes('ENGINEERING') || upper.includes('ACCESS') || upper.includes('ALUMEX') || upper.includes('DOCKYARD') || upper.includes('CONSTRUCTION') || upper.includes('LANKA WALL') || upper.includes('TILES') || upper.includes('GLASS') || upper.includes('KELANI') || upper.includes('ACL') || upper.includes('SIERRA') || upper.includes('HAYLEYS') || upper.includes('JOHN KEELLS') || upper.includes('SPENCE')) return 'Capital Goods';
  if (upper.includes('PROPERTIES') || upper.includes('LAND') || upper.includes('REALTY') || upper.includes('ESTATE') || upper.includes('HOUSING') || upper.includes('DEVELOPMENT') || upper.includes('OVERSEAS REALTY') || upper.includes('COLOMBO LAND') || upper.includes('EAST WEST')) return 'Real Estate';
  if (upper.includes('POWER') || upper.includes('ENERGY') || upper.includes('WIND') || upper.includes('SOLAR') || upper.includes('GAS') || upper.includes('LANKA IOC') || upper.includes('HYDRO') || upper.includes('VIDULLANKA') || upper.includes('VALLIBEL POWER') || upper.includes('PANASIAN POWER') || upper.includes('LAUGFS')) return 'Utilities & Energy';
  if (upper.includes('CHEMICAL') || upper.includes('PLASTIC') || upper.includes('RUBBER') || upper.includes('CHEMICALS') || upper.includes('CHEMANEX') || upper.includes('CIC') || upper.includes('TOKYO CEMENT') || upper.includes('CEMENT') || upper.includes('MINERAL') || upper.includes('GRAPHITE') || upper.includes('EX-PACK') || upper.includes('PACKAGING') || upper.includes('ACME') || upper.includes('BOGALA') || upper.includes('DIPPED PRODUCTS')) return 'Materials';
  if (upper.includes('RETAIL') || upper.includes('CARGILLS') || upper.includes('SINGER') || upper.includes('ABANS') || upper.includes('SOFTLOGIC') || upper.includes('MOTORS') || upper.includes('DIMO') || upper.includes('UNITED MOTORS') || upper.includes('AUTOMOBILE') || upper.includes('AUTODROME') || upper.includes('C. W. MACKIE') || upper.includes('BROWNS')) return 'Retailing & Autos';
  if (upper.includes('LOGISTICS') || upper.includes('SHIPPING') || upper.includes('FREIGHT') || upper.includes('TRANSPORT') || upper.includes('AIR') || upper.includes('CARGO') || upper.includes('EXPOLANKA')) return 'Transportation';
  if (upper.includes('TECH') || upper.includes('SOFTWARE') || upper.includes('IT') || upper.includes('DIGITAL') || upper.includes('E-CHANNELLING') || upper.includes('PICKME') || upper.includes('SYSTEMS')) return 'Software & Services';
  return 'Diversified';
}

export class IngestionService {
  private static isInitialized = false;
  private static cachedTickers: any[] = [];
  private static intervalId: NodeJS.Timeout | null = null;
  private static onTickCallback?: (tickers: any[], indices: MarketIndex[]) => void;

  // Real live baseline values for Colombo Stock Exchange indices
  private static aspi: MarketIndex = {
    name: 'All Share Price Index (ASPI)',
    value: 21313.92,
    change: -68.82,
    changePercent: -0.32
  };

  private static spSl20: MarketIndex = {
    name: 'S&P Sri Lanka 20 (S&P SL20)',
    value: 5994.33,
    change: -8.13,
    changePercent: -0.14
  };

  public static getCachedTickers(): any[] {
    return this.cachedTickers;
  }

  /**
   * Ensure ALL listed CSE stocks are seeded in database
   */
  public static async ensureDefaultTickers() {
    if (this.isInitialized && this.cachedTickers.length > 0) return;

    const existingCount = await prisma.marketTicker.count();
    if (existingCount >= 200) {
      this.isInitialized = true;
      if (this.cachedTickers.length === 0) {
        this.cachedTickers = await prisma.marketTicker.findMany({ orderBy: { symbol: 'asc' } });
      }
      return;
    }

    // Load full 285 stocks from local snapshot or fetch live
    let stocksList: any[] = [];
    const snapshotPath = path.join(__dirname, '../config/cse_all_stocks.json');

    if (fs.existsSync(snapshotPath)) {
      try {
        const raw = fs.readFileSync(snapshotPath, 'utf8');
        stocksList = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading cse_all_stocks.json snapshot:', err);
      }
    }

    if (stocksList.length === 0) {
      try {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' };
        const res = await axios.post('https://www.cse.lk/api/tradeSummary', {}, { headers, timeout: 5000 });
        stocksList = res.data?.reqTradeSummery || [];
      } catch (err) {
        console.error('Failed to fetch initial stocks from CSE API:', err);
      }
    }

    if (stocksList.length > 0) {
      for (const item of stocksList) {
        const symbol = item.symbol;
        if (!symbol) continue;

        const name = item.name || symbol;
        const sector = classifySector(name, symbol);
        const price = Number(item.price || item.closingPrice || item.previousClose || 10.0);
        const previousClose = Number(item.previousClose || price);
        const openPrice = Number(item.open || price);
        const highPrice = Number(item.high || price);
        const lowPrice = Number(item.low || price);
        const change = Number(item.change || Math.round((price - previousClose) * 100) / 100);
        const changePercent = Number(item.percentageChange || (previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0));
        const volume = Number(item.sharevolume || item.crossingVolume || 1000);
        const turnover = Number(item.turnover || Math.round(price * volume * 100) / 100);

        await prisma.marketTicker.upsert({
          where: { symbol },
          update: {
            name,
            sector,
            lastTradedPrice: price,
            openPrice,
            highPrice,
            lowPrice,
            previousClose,
            change,
            changePercent,
            volume,
            turnover
          },
          create: {
            symbol,
            name,
            sector,
            lastTradedPrice: price,
            openPrice,
            highPrice,
            lowPrice,
            previousClose,
            change,
            changePercent,
            volume,
            turnover
          }
        });
      }
      console.log(`[IngestionService] Successfully loaded and synchronized ${stocksList.length} CSE stocks into database.`);
    }

    // Also sync indices on startup
    await this.fetchCseIndices();

    this.isInitialized = true;
  }

  /**
   * Fetch real live CSE indices (ASPI and S&P SL20) via official POST endpoints
   */
  public static async fetchCseIndices(): Promise<boolean> {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
    try {
      const [aspiRes, snpRes] = await Promise.all([
        axios.post('https://www.cse.lk/api/aspiData', {}, { headers, timeout: 3500 }),
        axios.post('https://www.cse.lk/api/snpData', {}, { headers, timeout: 3500 })
      ]);

      if (aspiRes.data && aspiRes.data.value) {
        this.aspi = {
          name: 'All Share Price Index (ASPI)',
          value: Number(aspiRes.data.value),
          change: Number(aspiRes.data.change || 0),
          changePercent: Number(aspiRes.data.percentage || 0)
        };
      }

      if (snpRes.data && snpRes.data.value) {
        this.spSl20 = {
          name: 'S&P Sri Lanka 20 (S&P SL20)',
          value: Number(snpRes.data.value),
          change: Number(snpRes.data.change || 0),
          changePercent: Number(snpRes.data.percentage || 0)
        };
      }
      return true;
    } catch (err) {
      console.error('Failed to fetch live indices from CSE API:', err);
      return false;
    }
  }

  /**
   * Full sync from CSE live endpoints for all 285 stocks and indices
   */
  public static async syncLiveCseData(): Promise<{ success: boolean; stockCount: number; aspi: MarketIndex; spSl20: MarketIndex }> {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

    // 1. Fetch live indices
    await this.fetchCseIndices();

    // 2. Fetch live stocks
    let updatedCount = 0;
    try {
      const res = await axios.post('https://www.cse.lk/api/tradeSummary', {}, { headers, timeout: 5000 });
      const list = res.data?.reqTradeSummery;

      if (Array.isArray(list) && list.length > 0) {
        for (const item of list) {
          if (!item.symbol) continue;
          const price = Number(item.price || item.closingPrice || item.previousClose || 0);
          if (price <= 0) continue;

          const sector = classifySector(item.name || item.symbol, item.symbol);

          await prisma.marketTicker.upsert({
            where: { symbol: item.symbol },
            update: {
              name: item.name,
              sector,
              lastTradedPrice: price,
              openPrice: Number(item.open || price),
              highPrice: Number(item.high || price),
              lowPrice: Number(item.low || price),
              previousClose: Number(item.previousClose || price),
              change: Number(item.change || 0),
              changePercent: Number(item.percentageChange || 0),
              volume: Number(item.sharevolume || item.crossingVolume || 0),
              turnover: Number(item.turnover || 0)
            },
            create: {
              symbol: item.symbol,
              name: item.name || item.symbol,
              sector,
              lastTradedPrice: price,
              openPrice: Number(item.open || price),
              highPrice: Number(item.high || price),
              lowPrice: Number(item.low || price),
              previousClose: Number(item.previousClose || price),
              change: Number(item.change || 0),
              changePercent: Number(item.percentageChange || 0),
              volume: Number(item.sharevolume || item.crossingVolume || 0),
              turnover: Number(item.turnover || 0)
            }
          });
          updatedCount++;
        }

        // Save fresh snapshot to disk
        try {
          const snapshotPath = path.join(__dirname, '../config/cse_all_stocks.json');
          fs.writeFileSync(snapshotPath, JSON.stringify(list, null, 2));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to sync live tradeSummary from CSE:', err);
    }

    const allTickers = await prisma.marketTicker.findMany({ orderBy: { symbol: 'asc' } });

    if (this.onTickCallback) {
      this.onTickCallback(allTickers, [this.aspi, this.spSl20]);
    }

    return {
      success: updatedCount > 0,
      stockCount: allTickers.length,
      aspi: this.aspi,
      spSl20: this.spSl20
    };
  }

  /**
   * Generate stochastic price ticks (used during simulation / demo sessions).
   * High performance: updates only 4-6 active liquid stocks per tick to prevent DB saturation.
   */
  public static async simulateMarketTicks(forceSimulate = false) {
    let tickers = this.cachedTickers;
    if (!tickers || tickers.length === 0) {
      tickers = await prisma.marketTicker.findMany({ orderBy: { symbol: 'asc' } });
      this.cachedTickers = tickers;
    }

    if (tickers.length === 0) {
      await this.ensureDefaultTickers();
      tickers = this.cachedTickers;
      if (tickers.length === 0) return { tickers: [], indices: [this.aspi, this.spSl20] };
    }

    // Select 5-6 active liquid stocks per tick (realistic CSE market movement)
    const activeSymbols = new Set([
      'JKH.N0000', 'COMB.N0000', 'HNB.N0000', 'SAMP.N0000', 'DIAL.N0000', 'BIL.N0000', 'LIOC.N0000'
    ]);

    // Pick 2 blue chips + 3 random stocks to simulate live trading action
    const randomPicked = tickers
      .filter((t) => !activeSymbols.has(t.symbol))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((t) => t.symbol);

    const targetSymbolsToTick = new Set([
      Array.from(activeSymbols)[Math.floor(Math.random() * activeSymbols.size)],
      Array.from(activeSymbols)[Math.floor(Math.random() * activeSymbols.size)],
      ...randomPicked
    ]);

    const updatedTickers: any[] = [];

    for (const ticker of tickers) {
      if (targetSymbolsToTick.has(ticker.symbol) || forceSimulate) {
        const deltaPercent = (Math.random() * 0.8 - 0.38) / 100;
        let newPrice = Math.round(ticker.lastTradedPrice * (1 + deltaPercent) * 100) / 100;
        if (newPrice < 0.5) newPrice = 0.5;

        const change = Math.round((newPrice - ticker.previousClose) * 100) / 100;
        const changePercent = ticker.previousClose > 0 ? Math.round((change / ticker.previousClose) * 10000) / 100 : 0;
        const newHigh = Math.max(ticker.highPrice, newPrice);
        const newLow = Math.min(ticker.lowPrice, newPrice);
        const additionalVolume = Math.floor(Math.random() * 8000) + 100;
        const newVolume = ticker.volume + additionalVolume;
        const newTurnover = Math.round((ticker.turnover + additionalVolume * newPrice) * 100) / 100;

        try {
          const updated = await prisma.marketTicker.update({
            where: { symbol: ticker.symbol },
            data: {
              lastTradedPrice: newPrice,
              change,
              changePercent,
              highPrice: newHigh,
              lowPrice: newLow,
              volume: newVolume,
              turnover: newTurnover
            }
          });
          updatedTickers.push(updated);
        } catch {
          updatedTickers.push(ticker);
        }
      } else {
        updatedTickers.push(ticker);
      }
    }

    this.cachedTickers = updatedTickers;

    // Minor index fluctuations
    const aspiDelta = Math.round((Math.random() * 6 - 2.9) * 100) / 100;
    this.aspi.value = Math.round((this.aspi.value + aspiDelta) * 100) / 100;
    this.aspi.change = Math.round((this.aspi.change + aspiDelta) * 100) / 100;
    this.aspi.changePercent = Math.round((this.aspi.change / 21350) * 10000) / 100;

    const spDelta = Math.round((Math.random() * 2.5 - 1.2) * 100) / 100;
    this.spSl20.value = Math.round((this.spSl20.value + spDelta) * 100) / 100;
    this.spSl20.change = Math.round((this.spSl20.change + spDelta) * 100) / 100;
    this.spSl20.changePercent = Math.round((this.spSl20.change / 6000) * 10000) / 100;

    if (this.onTickCallback) {
      this.onTickCallback(updatedTickers, [this.aspi, this.spSl20]);
    }

    return { tickers: updatedTickers, indices: [this.aspi, this.spSl20] };
  }

  /**
   * Start live ingestion loop
   */
  public static startIngestionLoop(onTick?: (tickers: any[], indices: MarketIndex[]) => void) {
    if (onTick) {
      this.onTickCallback = onTick;
    }

    if (this.intervalId) return;

    // Run periodic sync every 5 seconds
    this.intervalId = setInterval(async () => {
      try {
        // Try live sync first
        const synced = await this.syncLiveCseData();
        if (!synced.success) {
          await this.simulateMarketTicks();
        }
      } catch (err) {
        console.error('Error in market ingestion loop:', err);
      }
    }, 5000);
  }

  /**
   * Stop ingestion loop
   */
  public static stopIngestionLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get all tickers (served directly from RAM cache in 0ms)
   */
  public static async getAllTickers() {
    if (this.cachedTickers.length > 0) {
      return this.cachedTickers;
    }
    await this.ensureDefaultTickers();
    if (this.cachedTickers.length === 0) {
      this.cachedTickers = await prisma.marketTicker.findMany({
        orderBy: { symbol: 'asc' }
      });
    }
    return this.cachedTickers;
  }

  /**
   * Get single ticker by symbol (served from RAM cache)
   */
  public static async getTicker(symbol: string) {
    if (this.cachedTickers.length > 0) {
      const found = this.cachedTickers.find((t) => t.symbol === symbol);
      if (found) return found;
    }
    return prisma.marketTicker.findUnique({
      where: { symbol }
    });
  }

  /**
   * Get current indices
   */
  public static getIndices(): MarketIndex[] {
    return [this.aspi, this.spSl20];
  }
}
