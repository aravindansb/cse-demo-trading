'use client';

import React from 'react';
import { formatLKR, formatPercent } from '../lib/utils';
import { Wallet, TrendingUp, PieChart, DollarSign, ArrowUpRight, ArrowDownRight, ShieldCheck, Clock } from 'lucide-react';

interface PortfolioSummaryProps {
  portfolio: {
    wallet: {
      totalCash: number;
      availableCash: number;
      lockedCash: number;
      baselineCapital: number;
    };
    summary: {
      totalPortfolioValue: number;
      totalStockValue: number;
      totalInvestedInHoldings: number;
      unrealizedPnL: number;
      unrealizedPnLPercent: number;
      realizedPnL: number;
      totalReturn: number;
      totalReturnPercent: number;
    };
  } | null;
  isLoading?: boolean;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio, isLoading }) => {
  if (isLoading || !portfolio) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-fintech-card border border-fintech-border rounded-lg p-4 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const { wallet, summary } = portfolio;
  const isTotalReturnPositive = summary.totalReturn >= 0;
  const isUnrealizedPositive = summary.unrealizedPnL >= 0;
  const isRealizedPositive = summary.realizedPnL >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Cash & Pending Orders Dual-Display Card */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs pb-1 border-b border-fintech-border/40">
          <span className="font-semibold text-zinc-300">Cash & Orders</span>
          <Wallet className="w-4 h-4 text-blue-400" />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* Left Column: Available Cash */}
          <div className="border-r border-fintech-border/50 pr-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-medium">Available Cash</span>
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-0.5 truncate" title={`Available Cash: ${formatLKR(wallet.availableCash)}`}>
              {formatLKR(wallet.availableCash)}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Free to trade</span>
          </div>

          {/* Right Column: Pending Orders (Locked Cash) */}
          <div className="pl-1">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-medium truncate">Pending</span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-amber-300 mt-0.5 truncate" title={`Locked in Orders: ${formatLKR(wallet.lockedCash)}`}>
              {formatLKR(wallet.lockedCash)}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 truncate">Locked in buys</span>
          </div>
        </div>

        {/* Footer Subline with Total Cash & Starting Capital */}
        <div className="text-[10px] text-zinc-500 font-mono mt-2 pt-1 border-t border-fintech-border/40 flex justify-between items-center">
          <span className="truncate">Total: <strong className="text-zinc-300 font-semibold">{formatLKR(wallet.totalCash)}</strong></span>
          <span className="text-zinc-600">Base: 1.0M</span>
        </div>
      </div>

      {/* 2. Total Portfolio Value Card */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>Total Portfolio Value</span>
          <PieChart className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono text-zinc-100">
            {formatLKR(summary.totalPortfolioValue)}
          </div>
          <div className={`text-[11px] font-mono mt-0.5 flex items-center space-x-1 ${
            isTotalReturnPositive ? 'text-fintech-green' : 'text-fintech-red'
          }`}>
            {isTotalReturnPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{isTotalReturnPositive ? '+' : ''}{formatLKR(summary.totalReturn)} ({formatPercent(summary.totalReturnPercent)})</span>
          </div>
        </div>
      </div>

      {/* 3. Unrealized P&L Card */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>Unrealized P&L (Holdings)</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className={`text-xl font-bold font-mono ${
            isUnrealizedPositive ? 'text-fintech-green' : 'text-fintech-red'
          }`}>
            {isUnrealizedPositive ? '+' : ''}{formatLKR(summary.unrealizedPnL)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Equity Value: {formatLKR(summary.totalStockValue)}
          </div>
        </div>
      </div>

      {/* 4. Realized P&L Card */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>Realized P&L (Closed Trades)</span>
          <DollarSign className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className={`text-xl font-bold font-mono ${
            isRealizedPositive ? 'text-fintech-green' : 'text-fintech-red'
          }`}>
            {isRealizedPositive ? '+' : ''}{formatLKR(summary.realizedPnL)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Settled after 1.12% CSE fees
          </div>
        </div>
      </div>
    </div>
  );
};
