'use client';

import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { formatLKR } from '../lib/utils';
import api from '../lib/api';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Clock,
  ShieldCheck
} from 'lucide-react';

export const OrderEntryForm: React.FC<{ onOrderPlaced?: () => void; onOpenAuth?: () => void }> = ({
  onOrderPlaced,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const { selectedTicker, marketStatus } = useMarket();

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [shares, setShares] = useState<number>(100);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [availableCash, setAvailableCash] = useState<number>(0);
  const [holdingShares, setHoldingShares] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync limit price with ticker's current price upon ticker change
  useEffect(() => {
    if (selectedTicker) {
      setLimitPrice(selectedTicker.lastTradedPrice);
    }
  }, [selectedTicker?.symbol]);

  // Fetch user's current cash and holding for the selected stock
  const fetchUserPosition = async () => {
    if (!user) return;
    try {
      const res = await api.get('/portfolio');
      if (res.data) {
        setAvailableCash(res.data.wallet.availableCash);
        const holding = res.data.holdings.find((h: any) => h.ticker === selectedTicker?.symbol);
        setHoldingShares(holding ? holding.availableShares : 0);
      }
    } catch (err) {
      console.error('Failed to load user position:', err);
    }
  };

  useEffect(() => {
    fetchUserPosition();
  }, [user, selectedTicker?.symbol]);

  if (!selectedTicker) {
    return (
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-6 text-center text-zinc-500 text-xs">
        Select a ticker from the Market Watch to begin trading.
      </div>
    );
  }

  const effectivePrice = orderType === 'LIMIT' ? Number(limitPrice || selectedTicker.lastTradedPrice) : selectedTicker.lastTradedPrice;
  const grossAmount = Math.round(shares * effectivePrice * 100) / 100;
  
  // Strict CSE 1.12% Fee Calculation
  const feeRate = 0.0112;
  const feeAmount = Math.round(grossAmount * feeRate * 100) / 100;
  const netTotal = side === 'BUY'
    ? Math.round((grossAmount + feeAmount) * 100) / 100
    : Math.round((grossAmount - feeAmount) * 100) / 100;

  // Fee itemized breakdown
  const brokerage = Math.round(grossAmount * 0.0064 * 100) / 100;
  const secCess = Math.round(grossAmount * 0.00072 * 100) / 100;
  const cdsFee = Math.round(grossAmount * 0.00024 * 100) / 100;
  const shareLevy = Math.round(grossAmount * 0.0030 * 100) / 100;

  // Max affordable shares calculation for BUY
  const calculateMaxBuy = () => {
    if (effectivePrice <= 0) return 0;
    const unitWithFee = effectivePrice * 1.0112;
    return Math.floor(availableCash / unitWithFee);
  };

  const handleSetMax = () => {
    if (side === 'BUY') {
      const max = calculateMaxBuy();
      setShares(max > 0 ? max : 0);
    } else {
      setShares(holdingShares);
    }
  };

  const isBuyInsufficient = side === 'BUY' && netTotal > availableCash;
  const isSellInsufficient = side === 'SELL' && shares > holdingShares;
  const isDisabled = !user || shares <= 0 || effectivePrice <= 0 || isBuyInsufficient || isSellInsufficient || isSubmitting;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ticker: selectedTicker.symbol,
        side,
        orderType,
        shares: Number(shares),
        targetLimitPrice: orderType === 'LIMIT' ? Number(limitPrice) : undefined,
      };

      const res = await api.post('/orders', payload);
      setFeedback({
        type: 'success',
        message: res.data.message || 'Order placed successfully!',
      });

      // Refresh position and trigger parent refetch
      await fetchUserPosition();
      if (onOrderPlaced) onOrderPlaced();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to place order',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-lg flex flex-col overflow-hidden">
      {/* Header with Active Ticker Snapshot */}
      <div className="p-3.5 border-b border-fintech-border bg-[#0D131F]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-zinc-100">{selectedTicker.symbol}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                {selectedTicker.sector}
              </span>
            </div>
            <div className="text-xs text-zinc-400 truncate max-w-[220px]">
              {selectedTicker.name}
            </div>
          </div>

          <div className="text-right">
            <div className="text-base font-bold font-mono text-zinc-100">
              Rs. {selectedTicker.lastTradedPrice.toFixed(2)}
            </div>
            <div className={`text-xs font-mono flex items-center justify-end space-x-0.5 ${
              selectedTicker.change >= 0 ? 'text-fintech-green' : 'text-fintech-red'
            }`}>
              {selectedTicker.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{selectedTicker.change >= 0 ? `+${selectedTicker.change.toFixed(2)}` : selectedTicker.change.toFixed(2)} ({selectedTicker.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side & Order Type Tabs */}
      <form onSubmit={handleSubmitOrder} className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3.5">
          {/* BUY / SELL Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-fintech-panel border border-fintech-border rounded-lg">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              BUY (LKR)
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              SELL (LKR)
            </button>
          </div>

          {/* Market / Limit Order Switcher */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Order Execution:</span>
            <div className="flex items-center space-x-1 font-mono">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  orderType === 'MARKET'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
                    : 'bg-fintech-panel text-zinc-400 hover:text-zinc-300'
                }`}
              >
                MARKET
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  orderType === 'LIMIT'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
                    : 'bg-fintech-panel text-zinc-400 hover:text-zinc-300'
                }`}
              >
                LIMIT
              </button>
            </div>
          </div>

          {/* Available Balance / Shares indicator */}
          <div className="bg-fintech-panel/80 border border-fintech-border/80 rounded p-2 text-xs flex items-center justify-between">
            <span className="text-zinc-400">
              {side === 'BUY' ? 'Available Virtual Cash:' : 'Available Shares:'}
            </span>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-semibold text-zinc-200">
                {side === 'BUY' ? formatLKR(availableCash) : `${holdingShares.toLocaleString()} shares`}
              </span>
              <button
                type="button"
                onClick={handleSetMax}
                className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors font-mono"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Quantity (Shares) Input */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
              <span>Quantity (Shares)</span>
              <div className="flex space-x-1 text-[10px] font-mono">
                {[100, 500, 1000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setShares(preset)}
                    className="px-1.5 py-0.5 rounded bg-fintech-panel border border-fintech-border text-zinc-400 hover:text-zinc-200"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={shares}
              onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-fintech-panel border border-fintech-border rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Limit Price Input (Only visible when orderType === LIMIT) */}
          {orderType === 'LIMIT' && (
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                <span>Target Limit Price (LKR)</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Market: Rs. {selectedTicker.lastTradedPrice.toFixed(2)}
                </span>
              </div>
              <input
                type="number"
                min="0.10"
                step="0.10"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full bg-fintech-panel border border-fintech-border rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* CSE 1.12% Fee Breakdown Panel */}
          <div className="p-3 bg-[#0C121E] border border-fintech-border/70 rounded-lg space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-fintech-border/40">
              <span className="flex items-center space-x-1">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-zinc-300">CSE 1.12% Cost Engine</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Statutory rate</span>
            </div>

            <div className="flex justify-between font-mono text-zinc-400">
              <span>Gross Trade Value:</span>
              <span className="text-zinc-200">Rs. {grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between font-mono text-zinc-400">
              <span className="flex items-center space-x-1">
                <span>CSE Fees (1.12%):</span>
              </span>
              <span className="text-amber-400 font-semibold">
                {side === 'BUY' ? '+' : '-'} Rs. {feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="text-[10px] text-zinc-500 pl-2 space-y-0.5 pt-0.5 border-t border-fintech-border/20">
              <div className="flex justify-between">
                <span>• Brokerage (0.64%):</span>
                <span>Rs. {brokerage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• SEC Cess (0.072%):</span>
                <span>Rs. {secCess.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• CDS Fee (0.024%):</span>
                <span>Rs. {cdsFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Share Transaction Levy (0.30%):</span>
                <span>Rs. {shareLevy.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-fintech-border/60 flex justify-between items-center">
              <span className="font-bold text-zinc-200">
                {side === 'BUY' ? 'Total Cost to Settle:' : 'Net Proceeds Credited:'}
              </span>
              <span className={`text-sm font-bold font-mono ${
                side === 'BUY' ? 'text-zinc-100' : 'text-fintech-green'
              }`}>
                Rs. {netTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Insufficient Funds / Shares warnings */}
          {isBuyInsufficient && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Insufficient virtual cash. Need Rs. {netTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}, you have Rs. {availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}.</span>
            </div>
          )}

          {isSellInsufficient && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Insufficient shares to sell. Available: {holdingShares} shares.</span>
            </div>
          )}

          {/* Off-hours queuing notice */}
          {!marketStatus?.isOpen && (
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>Off-Hours Session: Order will be saved with status <strong>QUEUED</strong> and will execute or enter book when market opens at 9:30 AM SLT.</span>
            </div>
          )}

          {/* Feedback message */}
          {feedback && (
            <div className={`p-2.5 rounded text-xs flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div>
          {user ? (
            <button
              type="submit"
              disabled={isDisabled}
              className={`w-full py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-lg ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-800 disabled:text-zinc-500 shadow-emerald-950/50'
                  : 'bg-rose-600 hover:bg-rose-500 text-white disabled:bg-zinc-800 disabled:text-zinc-500 shadow-rose-950/50'
              }`}
            >
              {isSubmitting
                ? 'Routing to Exchange...'
                : !marketStatus?.isOpen
                  ? `QUEUE ${side} ORDER (${shares.toLocaleString()} Shares)`
                  : `SUBMIT ${side} ${orderType} ORDER`}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Sign In to Place Orders
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
