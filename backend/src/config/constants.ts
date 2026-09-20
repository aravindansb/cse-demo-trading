export const CSE_CONFIG = {
  // CSE standard composite fee rate of 1.12%
  FEE_RATE: 0.0112,
  
  // Breakdown of the 1.12% fee for audit and transparency
  FEE_BREAKDOWN: {
    BROKERAGE: 0.0064,         // 0.64% Brokerage Commission
    SEC_CESS: 0.00072,         // 0.072% SEC Cess
    CDS_FEE: 0.00024,          // 0.024% CDS Fee
    SHARE_LEVY: 0.0030,        // 0.30% Share Transaction Levy
    OTHER_CLEARING: 0.00084,   // 0.084% Clearing and investor fund
    TOTAL: 0.0112              // Total 1.12%
  },

  // Initial virtual capital granted to every new trader: 1,000,000.00 LKR
  INITIAL_VIRTUAL_CAPITAL: 1000000.0,

  // Market hours in Asia/Colombo (Sri Lanka Standard Time UTC+5:30)
  TRADING_HOURS: {
    TIMEZONE: 'Asia/Colombo',
    OPEN_HOUR: 9,
    OPEN_MINUTE: 30,
    CLOSE_HOUR: 14,
    CLOSE_MINUTE: 30,
    OPEN_DAYS: [1, 2, 3, 4, 5] // Monday (1) to Friday (5)
  },

  // Blue-chip Sri Lankan equities for CSE demo trading
  DEFAULT_TICKERS: [
    {
      symbol: 'JKH.N0000',
      name: 'John Keells Holdings PLC',
      sector: 'Capital Goods',
      basePrice: 198.50,
      openPrice: 197.00,
      highPrice: 201.00,
      lowPrice: 196.50,
      previousClose: 197.25,
      volume: 852000
    },
    {
      symbol: 'COMB.N0000',
      name: 'Commercial Bank of Ceylon PLC',
      sector: 'Banking',
      basePrice: 102.25,
      openPrice: 101.50,
      highPrice: 103.50,
      lowPrice: 101.00,
      previousClose: 101.75,
      volume: 1240000
    },
    {
      symbol: 'SAMP.N0000',
      name: 'Sampath Bank PLC',
      sector: 'Banking',
      basePrice: 79.80,
      openPrice: 79.00,
      highPrice: 80.50,
      lowPrice: 78.75,
      previousClose: 79.10,
      volume: 980000
    },
    {
      symbol: 'LOLC.N0000',
      name: 'LOLC Holdings PLC',
      sector: 'Diversified Financials',
      basePrice: 435.00,
      openPrice: 432.00,
      highPrice: 442.00,
      lowPrice: 430.00,
      previousClose: 431.50,
      volume: 320000
    },
    {
      symbol: 'DIAL.N0000',
      name: 'Dialog Axiata PLC',
      sector: 'Telecommunication',
      basePrice: 10.40,
      openPrice: 10.30,
      highPrice: 10.60,
      lowPrice: 10.20,
      previousClose: 10.30,
      volume: 2450000
    },
    {
      symbol: 'HAYL.N0000',
      name: 'Hayleys PLC',
      sector: 'Capital Goods',
      basePrice: 94.50,
      openPrice: 93.80,
      highPrice: 96.00,
      lowPrice: 93.50,
      previousClose: 94.00,
      volume: 410000
    },
    {
      symbol: 'MELS.N0000',
      name: 'Melstacorp PLC',
      sector: 'Food, Beverage & Tobacco',
      basePrice: 91.00,
      openPrice: 90.00,
      highPrice: 92.50,
      lowPrice: 89.50,
      previousClose: 90.25,
      volume: 530000
    },
    {
      symbol: 'HNB.N0000',
      name: 'Hatton National Bank PLC',
      sector: 'Banking',
      basePrice: 195.00,
      openPrice: 193.50,
      highPrice: 197.00,
      lowPrice: 193.00,
      previousClose: 194.00,
      volume: 670000
    },
    {
      symbol: 'DIST.N0000',
      name: 'Distilleries Company of Sri Lanka PLC',
      sector: 'Food, Beverage & Tobacco',
      basePrice: 28.50,
      openPrice: 28.20,
      highPrice: 29.00,
      lowPrice: 28.00,
      previousClose: 28.30,
      volume: 890000
    },
    {
      symbol: 'CTC.N0000',
      name: 'Ceylon Tobacco Company PLC',
      sector: 'Consumer Staples',
      basePrice: 1180.00,
      openPrice: 1175.00,
      highPrice: 1195.00,
      lowPrice: 1170.00,
      previousClose: 1175.00,
      volume: 45000
    }
  ]
};
