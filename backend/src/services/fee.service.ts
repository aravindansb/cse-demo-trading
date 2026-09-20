import { CSE_CONFIG } from '../config/constants';

export interface FeeCalculationResult {
  shares: number;
  price: number;
  grossAmount: number;
  feeRate: number;
  feeAmount: number;
  netTotal: number; // For BUY: gross + fee. For SELL: gross - fee.
  breakdown: {
    brokerage: number;
    secCess: number;
    cdsFee: number;
    shareLevy: number;
    otherClearing: number;
  };
}

export class FeeService {
  /**
   * Calculate transaction cost for a BUY order on CSE.
   * Buy Order Total Cost = (Shares * Price) * 1.0112
   */
  public static calculateBuy(shares: number, price: number): FeeCalculationResult {
    if (shares <= 0 || price <= 0) {
      throw new Error('Shares and price must be positive numbers');
    }

    const grossAmount = Math.round(shares * price * 100) / 100;
    const feeAmount = Math.round(grossAmount * CSE_CONFIG.FEE_RATE * 100) / 100;
    const netTotal = Math.round((grossAmount + feeAmount) * 100) / 100;

    return {
      shares,
      price,
      grossAmount,
      feeRate: CSE_CONFIG.FEE_RATE,
      feeAmount,
      netTotal,
      breakdown: {
        brokerage: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.BROKERAGE * 100) / 100,
        secCess: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.SEC_CESS * 100) / 100,
        cdsFee: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.CDS_FEE * 100) / 100,
        shareLevy: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.SHARE_LEVY * 100) / 100,
        otherClearing: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.OTHER_CLEARING * 100) / 100,
      }
    };
  }

  /**
   * Calculate net proceeds for a SELL order on CSE.
   * Sell Order Net Proceeds = (Shares * Price) * (1 - 0.0112)
   */
  public static calculateSell(shares: number, price: number): FeeCalculationResult {
    if (shares <= 0 || price <= 0) {
      throw new Error('Shares and price must be positive numbers');
    }

    const grossAmount = Math.round(shares * price * 100) / 100;
    const feeAmount = Math.round(grossAmount * CSE_CONFIG.FEE_RATE * 100) / 100;
    const netTotal = Math.round((grossAmount - feeAmount) * 100) / 100;

    return {
      shares,
      price,
      grossAmount,
      feeRate: CSE_CONFIG.FEE_RATE,
      feeAmount,
      netTotal,
      breakdown: {
        brokerage: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.BROKERAGE * 100) / 100,
        secCess: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.SEC_CESS * 100) / 100,
        cdsFee: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.CDS_FEE * 100) / 100,
        shareLevy: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.SHARE_LEVY * 100) / 100,
        otherClearing: Math.round(grossAmount * CSE_CONFIG.FEE_BREAKDOWN.OTHER_CLEARING * 100) / 100,
      }
    };
  }

  /**
   * Calculate maximum shares a trader can buy given an available cash balance and stock price.
   */
  public static calculateMaxAffordableShares(availableBalance: number, price: number): number {
    if (availableBalance <= 0 || price <= 0) return 0;
    const unitCostWithFee = price * (1 + CSE_CONFIG.FEE_RATE);
    return Math.floor(availableBalance / unitCostWithFee);
  }
}
