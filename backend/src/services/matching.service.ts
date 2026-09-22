import prisma from '../utils/prisma';
import { FeeService } from './fee.service';
import { MarketHoursService } from './marketHours.service';

export interface PlaceOrderInput {
  userId: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  shares: number;
  targetLimitPrice?: number;
}

export class MatchingService {
  /**
   * Place an order: validates balance/holdings, locks capital/shares, queues or executes based on market hours
   */
  public static async placeOrder(input: PlaceOrderInput) {
    const { userId, ticker, side, orderType, shares, targetLimitPrice } = input;

    if (!userId || !ticker || !side || !orderType) {
      throw new Error('Missing required order fields');
    }

    if (shares <= 0 || !Number.isInteger(shares)) {
      throw new Error('Shares must be a positive whole number');
    }

    if (orderType === 'LIMIT' && (!targetLimitPrice || targetLimitPrice <= 0)) {
      throw new Error('Limit orders require a valid positive target limit price');
    }

    // 1. Fetch current market ticker
    const marketTicker = await prisma.marketTicker.findUnique({
      where: { symbol: ticker }
    });

    if (!marketTicker) {
      throw new Error(`Ticker ${ticker} not found in CSE directory`);
    }

    const currentPrice = marketTicker.lastTradedPrice;
    const estimatedPrice = orderType === 'LIMIT' && targetLimitPrice ? targetLimitPrice : currentPrice;

    // 2. Validate and reserve funds or shares
    const marketStatus = await MarketHoursService.isMarketOpen();
    const isMarketActive = marketStatus.isOpen;

    let calculatedCost = 0;
    let feeAmount = 0;

    if (side === 'BUY') {
      const feeResult = FeeService.calculateBuy(shares, estimatedPrice);
      calculatedCost = feeResult.netTotal;
      feeAmount = feeResult.feeAmount;

      // Check user wallet
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('User wallet not found');

      const availableBalance = wallet.balance - wallet.lockedBalance;
      if (availableBalance < calculatedCost) {
        throw new Error(
          `Insufficient available cash balance. Required: Rs. ${calculatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} (including 1.12% CSE fee), Available: Rs. ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        );
      }

      // Lock balance for this buy order
      await prisma.wallet.update({
        where: { userId },
        data: { lockedBalance: { increment: calculatedCost } }
      });
    } else {
      // SELL side
      const feeResult = FeeService.calculateSell(shares, estimatedPrice);
      calculatedCost = feeResult.netTotal;
      feeAmount = feeResult.feeAmount;

      const holding = await prisma.holding.findUnique({
        where: { userId_ticker: { userId, ticker } }
      });

      const availableShares = holding ? holding.shares - holding.lockedShares : 0;
      if (availableShares < shares) {
        throw new Error(
          `Insufficient shares to sell. Required: ${shares}, Available: ${availableShares}`
        );
      }

      // Lock shares for this sell order
      await prisma.holding.update({
        where: { userId_ticker: { userId, ticker } },
        data: { lockedShares: { increment: shares } }
      });
    }

    // 3. Determine initial order status
    let initialStatus: 'QUEUED' | 'PENDING' | 'EXECUTED' = 'QUEUED';
    let notes = '';

    if (!isMarketActive) {
      initialStatus = 'QUEUED';
      notes = `Order QUEUED outside CSE trading hours (${marketStatus.reason}). Will execute/activate on market open.`;
    } else {
      if (orderType === 'MARKET') {
        initialStatus = 'PENDING'; // Will be immediately executed below
      } else {
        // LIMIT order during market hours
        const canExecuteImmediately =
          (side === 'BUY' && currentPrice <= (targetLimitPrice || 0)) ||
          (side === 'SELL' && currentPrice >= (targetLimitPrice || 0));

        if (canExecuteImmediately) {
          initialStatus = 'PENDING'; // Will execute immediately below
        } else {
          initialStatus = 'PENDING'; // Stays in order book waiting for price match
          notes = `Limit order entered in book at Rs. ${targetLimitPrice?.toFixed(2)}. Current market: Rs. ${currentPrice.toFixed(2)}`;
        }
      }
    }

    // 4. Create the Order in database
    const order = await prisma.order.create({
      data: {
        userId,
        ticker,
        side,
        orderType,
        status: initialStatus,
        targetLimitPrice: orderType === 'LIMIT' ? targetLimitPrice : null,
        shares,
        feeAmount,
        totalCost: calculatedCost,
        notes
      }
    });

    // 5. If market is active and condition is met, execute immediately
    if (isMarketActive) {
      if (orderType === 'MARKET') {
        return this.executeOrder(order.id, currentPrice);
      } else if (orderType === 'LIMIT') {
        const canExecute =
          (side === 'BUY' && currentPrice <= (targetLimitPrice || 0)) ||
          (side === 'SELL' && currentPrice >= (targetLimitPrice || 0));
        if (canExecute) {
          return this.executeOrder(order.id, currentPrice);
        }
      }
    }

    return order;
  }

  /**
   * Execute an order with strict ACID consistency
   */
  public static async executeOrder(orderId: string, executionPrice: number) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: { include: { wallet: true } } }
      });

      if (!order) throw new Error('Order not found');
      if (order.status === 'EXECUTED' || order.status === 'CANCELLED') {
        return order;
      }

      const { userId, ticker, side, shares, totalCost: estimatedCost } = order;

      if (side === 'BUY') {
        const actualFeeCalc = FeeService.calculateBuy(shares, executionPrice);
        const actualTotalCost = actualFeeCalc.netTotal;
        const actualFee = actualFeeCalc.feeAmount;

        // Release estimated locked balance and deduct actual cost from wallet
        await tx.wallet.update({
          where: { userId },
          data: {
            lockedBalance: { decrement: estimatedCost },
            balance: { decrement: actualTotalCost }
          }
        });

        // Upsert holding
        const existingHolding = await tx.holding.findUnique({
          where: { userId_ticker: { userId, ticker } }
        });

        if (existingHolding) {
          const totalShares = existingHolding.shares + shares;
          // Weighted average price including fee
          const totalPreviousInvestment = existingHolding.shares * existingHolding.averageBuyPrice;
          const newAvgPrice = Math.round(((totalPreviousInvestment + actualTotalCost) / totalShares) * 100) / 100;

          await tx.holding.update({
            where: { userId_ticker: { userId, ticker } },
            data: {
              shares: totalShares,
              averageBuyPrice: newAvgPrice
            }
          });
        } else {
          const unitAvgPrice = Math.round((actualTotalCost / shares) * 100) / 100;
          await tx.holding.create({
            data: {
              userId,
              ticker,
              shares,
              averageBuyPrice: unitAvgPrice
            }
          });
        }

        // Record Trade
        await tx.trade.create({
          data: {
            orderId: order.id,
            userId,
            ticker,
            side: 'BUY',
            shares,
            executedPrice: executionPrice,
            grossAmount: actualFeeCalc.grossAmount,
            feeAmount: actualFee,
            netAmount: actualTotalCost
          }
        });

        // Update Order
        return tx.order.update({
          where: { id: order.id },
          data: {
            status: 'EXECUTED',
            executedPrice: executionPrice,
            executedShares: shares,
            feeAmount: actualFee,
            totalCost: actualTotalCost,
            executedAt: new Date(),
            notes: `Executed at Rs. ${executionPrice.toFixed(2)} with Rs. ${actualFee.toFixed(2)} CSE fee (1.12%).`
          }
        });

      } else {
        // SELL side
        const actualFeeCalc = FeeService.calculateSell(shares, executionPrice);
        const actualNetProceeds = actualFeeCalc.netTotal;
        const actualFee = actualFeeCalc.feeAmount;

        // Release locked shares and deduct from holding
        const existingHolding = await tx.holding.findUnique({
          where: { userId_ticker: { userId, ticker } }
        });

        if (!existingHolding) throw new Error('Holding not found for sell execution');

        const remainingShares = existingHolding.shares - shares;
        if (remainingShares <= 0) {
          await tx.holding.delete({
            where: { userId_ticker: { userId, ticker } }
          });
        } else {
          await tx.holding.update({
            where: { userId_ticker: { userId, ticker } },
            data: {
              shares: remainingShares,
              lockedShares: { decrement: shares }
            }
          });
        }

        // Credit net proceeds to wallet
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { increment: actualNetProceeds }
          }
        });

        // Record Trade
        await tx.trade.create({
          data: {
            orderId: order.id,
            userId,
            ticker,
            side: 'SELL',
            shares,
            executedPrice: executionPrice,
            grossAmount: actualFeeCalc.grossAmount,
            feeAmount: actualFee,
            netAmount: actualNetProceeds
          }
        });

        // Update Order
        return tx.order.update({
          where: { id: order.id },
          data: {
            status: 'EXECUTED',
            executedPrice: executionPrice,
            executedShares: shares,
            feeAmount: actualFee,
            totalCost: actualNetProceeds,
            executedAt: new Date(),
            notes: `Sold at Rs. ${executionPrice.toFixed(2)}. Net proceeds: Rs. ${actualNetProceeds.toFixed(2)} after Rs. ${actualFee.toFixed(2)} CSE fee.`
          }
        });
      }
    });
  }

  /**
   * Process all QUEUED orders when market opens
   */
  public static async processQueuedOrders() {
    const queuedOrders = await prisma.order.findMany({
      where: { status: 'QUEUED' }
    });

    const results = [];
    for (const order of queuedOrders) {
      try {
        const ticker = await prisma.marketTicker.findUnique({
          where: { symbol: order.ticker }
        });
        if (!ticker) continue;

        if (order.orderType === 'MARKET') {
          const executed = await this.executeOrder(order.id, ticker.lastTradedPrice);
          results.push(executed);
        } else if (order.orderType === 'LIMIT') {
          if (order.targetLimitPrice) {
            const canExecute =
              (order.side === 'BUY' && ticker.lastTradedPrice <= order.targetLimitPrice) ||
              (order.side === 'SELL' && ticker.lastTradedPrice >= order.targetLimitPrice);

            if (canExecute) {
              const executed = await this.executeOrder(order.id, ticker.lastTradedPrice);
              results.push(executed);
            } else {
              // Transition from QUEUED to PENDING in order book
              const updated = await prisma.order.update({
                where: { id: order.id },
                data: {
                  status: 'PENDING',
                  notes: `Market opened. Order placed in active book at limit Rs. ${order.targetLimitPrice.toFixed(2)}.`
                }
              });
              results.push(updated);
            }
          } else {
            // Limit order without limit price: execute at market price
            const executed = await this.executeOrder(order.id, ticker.lastTradedPrice);
            results.push(executed);
          }
        }
      } catch (err) {
        console.error(`Error processing queued order ${order.id}:`, err);
      }
    }
    return results;
  }

  /**
   * Evaluate PENDING limit orders on incoming market price ticks
   */
  public static async evaluatePendingOrdersOnTick(tickerSymbol: string, newPrice: number) {
    const pendingOrders = await prisma.order.findMany({
      where: {
        ticker: tickerSymbol,
        status: 'PENDING',
        orderType: 'LIMIT'
      }
    });

    const executedOrders = [];

    for (const order of pendingOrders) {
      if (!order.targetLimitPrice) continue;

      const shouldExecute =
        (order.side === 'BUY' && newPrice <= order.targetLimitPrice) ||
        (order.side === 'SELL' && newPrice >= order.targetLimitPrice);

      if (shouldExecute) {
        try {
          const executed = await this.executeOrder(order.id, newPrice);
          executedOrders.push(executed);
        } catch (err) {
          console.error(`Failed to execute limit order ${order.id}:`, err);
        }
      }
    }

    return executedOrders;
  }

  /**
   * Cancel a QUEUED or PENDING order and unlock capital or shares
   */
  public static async cancelOrder(orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) throw new Error('Order not found');
      if (order.userId !== userId) throw new Error('Unauthorized to cancel this order');
      if (order.status !== 'QUEUED' && order.status !== 'PENDING') {
        throw new Error(`Cannot cancel order with status ${order.status}`);
      }

      if (order.side === 'BUY') {
        // Unlock wallet funds
        await tx.wallet.update({
          where: { userId },
          data: { lockedBalance: { decrement: order.totalCost } }
        });
      } else {
        // Unlock holding shares
        await tx.holding.update({
          where: { userId_ticker: { userId, ticker: order.ticker } },
          data: { lockedShares: { decrement: order.shares } }
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          notes: 'Cancelled by user.'
        }
      });
    });
  }
}
