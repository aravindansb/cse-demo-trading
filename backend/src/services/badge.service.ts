export interface BadgeDefinition {
  id: string;
  name: string;
  category: 'PODIUM' | 'PERFORMANCE' | 'ACTIVITY' | 'MILESTONE';
  description: string;
  icon: string; // Emoji / Lucide indicator
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  color: string; // Tailwind color class
}

export const ALL_BADGES: Record<string, BadgeDefinition> = {
  PODIUM_GOLD: {
    id: 'PODIUM_GOLD',
    name: 'CSE Gold Champion',
    category: 'PODIUM',
    description: 'Ranked #1 on the Global CSE Leaderboard',
    icon: '🥇',
    rarity: 'LEGENDARY',
    color: 'from-amber-400 to-yellow-600'
  },
  PODIUM_SILVER: {
    id: 'PODIUM_SILVER',
    name: 'CSE Silver Medalist',
    category: 'PODIUM',
    description: 'Ranked #2 on the Global CSE Leaderboard',
    icon: '🥈',
    rarity: 'EPIC',
    color: 'from-slate-300 to-zinc-400'
  },
  PODIUM_BRONZE: {
    id: 'PODIUM_BRONZE',
    name: 'CSE Bronze Medalist',
    category: 'PODIUM',
    description: 'Ranked #3 on the Global CSE Leaderboard',
    icon: '🥉',
    rarity: 'EPIC',
    color: 'from-amber-700 to-amber-900'
  },
  TOP_10: {
    id: 'TOP_10',
    name: 'Top 10 Elite Trader',
    category: 'PODIUM',
    description: 'Ranked among the Top 10 traders across Sri Lanka',
    icon: '⭐',
    rarity: 'RARE',
    color: 'from-blue-500 to-cyan-500'
  },
  BULL_MASTER: {
    id: 'BULL_MASTER',
    name: 'Bull Market Master',
    category: 'PERFORMANCE',
    description: 'Achieved an overall portfolio return of +15% or higher',
    icon: '🐂',
    rarity: 'RARE',
    color: 'from-emerald-500 to-green-600'
  },
  ALPHA_HUNTER: {
    id: 'ALPHA_HUNTER',
    name: 'Alpha Hunter',
    category: 'PERFORMANCE',
    description: 'Generated an exceptional portfolio return of +30% or higher',
    icon: '⚡',
    rarity: 'EPIC',
    color: 'from-purple-500 to-indigo-600'
  },
  DOUBLE_BAGGER: {
    id: 'DOUBLE_BAGGER',
    name: 'Double Bagger Legend',
    category: 'PERFORMANCE',
    description: 'Doubled starting capital (+100% net portfolio return)',
    icon: '🚀',
    rarity: 'LEGENDARY',
    color: 'from-rose-500 to-red-600'
  },
  GREEN_STREAK: {
    id: 'GREEN_STREAK',
    name: 'Green Win Streak',
    category: 'PERFORMANCE',
    description: 'Achieved a high win rate (≥ 70%) with minimum 5 closed trades',
    icon: '🔥',
    rarity: 'EPIC',
    color: 'from-lime-400 to-emerald-500'
  },
  COLOMBO_TRADER: {
    id: 'COLOMBO_TRADER',
    name: 'Qualified Colombo Trader',
    category: 'ACTIVITY',
    description: 'Completed at least 3 executed trades to qualify for competitive rankings',
    icon: '💼',
    rarity: 'COMMON',
    color: 'from-zinc-500 to-zinc-700'
  },
  COLOMBO_VETERAN: {
    id: 'COLOMBO_VETERAN',
    name: 'Colombo Veteran',
    category: 'ACTIVITY',
    description: 'Executed 25 or more market and limit trades on the exchange',
    icon: '🎖️',
    rarity: 'RARE',
    color: 'from-blue-600 to-indigo-800'
  },
  CSE_WHALE: {
    id: 'CSE_WHALE',
    name: 'CSE Market Whale',
    category: 'ACTIVITY',
    description: 'Accumulated over Rs. 2,500,000 LKR in portfolio valuation or 50+ trades',
    icon: '🐋',
    rarity: 'LEGENDARY',
    color: 'from-cyan-500 to-blue-700'
  },
  DIVERSIFIED: {
    id: 'DIVERSIFIED',
    name: 'Diversified Fund Manager',
    category: 'ACTIVITY',
    description: 'Holds equity positions across 4 or more distinct Colombo market sectors',
    icon: '🌐',
    rarity: 'RARE',
    color: 'from-teal-500 to-emerald-700'
  },
  MARKET_MAKER: {
    id: 'MARKET_MAKER',
    name: 'CSE Market Maker',
    category: 'ACTIVITY',
    description: 'Successfully queued both BUY and SELL limit orders in the order book',
    icon: '⚖️',
    rarity: 'COMMON',
    color: 'from-amber-500 to-orange-600'
  }
};

export class BadgeService {
  /**
   * Returns all system badge definitions
   */
  public static getAllBadges(): BadgeDefinition[] {
    return Object.values(ALL_BADGES);
  }

  /**
   * Computes badges unlocked by a trader based on their performance, rank, and holdings
   */
  public static evaluateBadges(params: {
    rank?: number;
    totalReturnPercent: number;
    tradeCount: number;
    winRate: number;
    totalPortfolioValue: number;
    distinctSectorsCount: number;
    hasBuyAndSellLimit: boolean;
  }): BadgeDefinition[] {
    const unlocked: BadgeDefinition[] = [];

    // 1. Podium Badges
    if (params.rank === 1) unlocked.push(ALL_BADGES.PODIUM_GOLD);
    else if (params.rank === 2) unlocked.push(ALL_BADGES.PODIUM_SILVER);
    else if (params.rank === 3) unlocked.push(ALL_BADGES.PODIUM_BRONZE);
    else if (params.rank && params.rank <= 10) unlocked.push(ALL_BADGES.TOP_10);

    // 2. Performance Tiers
    if (params.totalReturnPercent >= 100) {
      unlocked.push(ALL_BADGES.DOUBLE_BAGGER);
      unlocked.push(ALL_BADGES.ALPHA_HUNTER);
      unlocked.push(ALL_BADGES.BULL_MASTER);
    } else if (params.totalReturnPercent >= 30) {
      unlocked.push(ALL_BADGES.ALPHA_HUNTER);
      unlocked.push(ALL_BADGES.BULL_MASTER);
    } else if (params.totalReturnPercent >= 15) {
      unlocked.push(ALL_BADGES.BULL_MASTER);
    }

    if (params.winRate >= 70 && params.tradeCount >= 5) {
      unlocked.push(ALL_BADGES.GREEN_STREAK);
    }

    // 3. Activity & Milestone Badges
    if (params.tradeCount >= 3) {
      unlocked.push(ALL_BADGES.COLOMBO_TRADER);
    }
    if (params.tradeCount >= 25) {
      unlocked.push(ALL_BADGES.COLOMBO_VETERAN);
    }
    if (params.tradeCount >= 50 || params.totalPortfolioValue >= 2500000) {
      unlocked.push(ALL_BADGES.CSE_WHALE);
    }
    if (params.distinctSectorsCount >= 4) {
      unlocked.push(ALL_BADGES.DIVERSIFIED);
    }
    if (params.hasBuyAndSellLimit) {
      unlocked.push(ALL_BADGES.MARKET_MAKER);
    }

    // De-duplicate if needed
    const uniqueMap = new Map<string, BadgeDefinition>();
    for (const b of unlocked) {
      uniqueMap.set(b.id, b);
    }

    return Array.from(uniqueMap.values());
  }
}
