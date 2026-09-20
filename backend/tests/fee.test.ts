import { FeeService } from '../src/services/fee.service';
import { CSE_CONFIG } from '../src/config/constants';

describe('CSE FeeService (1.12% Standard Transaction Cost)', () => {
  it('should correctly calculate Buy order total cost with 1.12% fee', () => {
    const shares = 1000;
    const price = 200.00; // e.g. JKH at Rs. 200
    const gross = shares * price; // 200,000.00
    const expectedFee = Math.round(gross * 0.0112 * 100) / 100; // 2,240.00
    const expectedTotal = gross + expectedFee; // 202,240.00

    const result = FeeService.calculateBuy(shares, price);

    expect(result.shares).toBe(1000);
    expect(result.price).toBe(200.00);
    expect(result.grossAmount).toBe(200000.00);
    expect(result.feeAmount).toBe(2240.00);
    expect(result.netTotal).toBe(202240.00);
    expect(result.feeRate).toBe(0.0112);
  });

  it('should correctly calculate Sell order net proceeds with 1.12% fee deducted', () => {
    const shares = 500;
    const price = 100.00; // e.g. COMB at Rs. 100
    const gross = shares * price; // 50,000.00
    const expectedFee = Math.round(gross * 0.0112 * 100) / 100; // 560.00
    const expectedNetProceeds = gross - expectedFee; // 49,440.00

    const result = FeeService.calculateSell(shares, price);

    expect(result.shares).toBe(500);
    expect(result.price).toBe(100.00);
    expect(result.grossAmount).toBe(50000.00);
    expect(result.feeAmount).toBe(560.00);
    expect(result.netTotal).toBe(49440.00);
  });

  it('should correctly calculate individual CSE statutory fee breakdown', () => {
    const shares = 1000;
    const price = 100.00;
    const gross = 100000.00;

    const result = FeeService.calculateBuy(shares, price);
    const { breakdown } = result;

    expect(breakdown.brokerage).toBe(Math.round(gross * CSE_CONFIG.FEE_BREAKDOWN.BROKERAGE * 100) / 100);
    expect(breakdown.secCess).toBe(Math.round(gross * CSE_CONFIG.FEE_BREAKDOWN.SEC_CESS * 100) / 100);
    expect(breakdown.cdsFee).toBe(Math.round(gross * CSE_CONFIG.FEE_BREAKDOWN.CDS_FEE * 100) / 100);
    expect(breakdown.shareLevy).toBe(Math.round(gross * CSE_CONFIG.FEE_BREAKDOWN.SHARE_LEVY * 100) / 100);
  });

  it('should calculate max affordable shares considering 1.12% fee', () => {
    const availableBalance = 1000000.00; // 1M LKR
    const price = 198.50; // JKH price
    const unitWithFee = price * 1.0112; // ~200.7232
    const expectedMaxShares = Math.floor(availableBalance / unitWithFee);

    const maxShares = FeeService.calculateMaxAffordableShares(availableBalance, price);
    expect(maxShares).toBe(expectedMaxShares);

    // Verify that buying maxShares does not exceed available balance
    const buyResult = FeeService.calculateBuy(maxShares, price);
    expect(buyResult.netTotal).toBeLessThanOrEqual(availableBalance);

    // Verify buying maxShares + 1 would exceed available balance
    const exceedResult = FeeService.calculateBuy(maxShares + 1, price);
    expect(exceedResult.netTotal).toBeGreaterThan(availableBalance);
  });
});
