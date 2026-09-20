'use client';

import React from 'react';
import { formatLKR, formatPercent } from '../lib/utils';
import { Wallet, TrendingUp, PieChart, DollarSign, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';

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
          <div key={i} className="bg-fintech-card border border-fintech-border rounded-lg p-4 animate-pulse h-24" />
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
      {/* 1. Available Virtual Cash Card */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>Available Cash</span>
          <Wallet className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono text-zinc-100">
            {formatLKR(wallet.availableCash)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5 flex justify-between">
            <span>Locked: {formatLKR(wallet.lockedCash)}</span>
            <span>Base: 1.0M</span>
          </div>
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
