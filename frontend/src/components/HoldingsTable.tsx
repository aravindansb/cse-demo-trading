'use client';

import React from 'react';
import { formatLKR, formatPercent, formatNumber } from '../lib/utils';
import { useMarket } from '../context/SocketContext';
import { Briefcase, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';

interface HoldingItem {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  lockedShares: number;
  availableShares: number;
  averageBuyPrice: number;
  currentPrice: number;
  dayChangePercent: number;
  totalCost: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

interface HoldingsTableProps {
  holdings: HoldingItem[];
  isLoading?: boolean;
  onQuickSell?: (ticker: string) => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, isLoading, onQuickSell }) => {
  const { tickers, setSelectedTicker } = useMarket();

  if (isLoading) {
    return (
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-6 animate-pulse text-center text-zinc-500 text-xs">
        Loading portfolio holdings...
      </div>
    );
  }

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-lg flex flex-col overflow-hidden">
      <div className="p-3.5 border-b border-fintech-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-sm text-zinc-100 uppercase tracking-wide">Stock Holdings Breakdown</h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">{holdings.length} Positions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#0D131F] text-[11px] text-zinc-400 border-b border-fintech-border font-medium">
            <tr>
              <th className="py-2.5 px-3">Ticker</th>
              <th className="py-2.5 px-3 text-right">Shares</th>
              <th className="py-2.5 px-3 text-right">Avg Cost</th>
              <th className="py-2.5 px-3 text-right">Market Price</th>
              <th className="py-2.5 px-3 text-right">Market Value</th>
              <th className="py-2.5 px-3 text-right">Unrealized P&L</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fintech-border/40 font-mono">
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                  No stock holdings in portfolio. Use the Order Form to buy Colombo Stock Exchange equities.
                </td>
              </tr>
            ) : (
              holdings.map((h) => {
                const isPositive = h.unrealizedPnL >= 0;
                return (
                  <tr key={h.ticker} className="hover:bg-fintech-hover/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-zinc-200">{h.ticker}</div>
                      <div className="text-[10px] font-sans text-zinc-400 truncate max-w-[140px]">{h.name}</div>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="text-zinc-200 font-bold">{formatNumber(h.shares)}</div>
                      {h.lockedShares > 0 && (
                        <div className="text-[10px] text-amber-400">Locked: {h.lockedShares}</div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      Rs. {h.averageBuyPrice.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-zinc-100">
                      Rs. {h.currentPrice.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-zinc-200">
                      {formatLKR(h.currentValue)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className={`font-bold flex items-center justify-end space-x-0.5 ${
                        isPositive ? 'text-fintech-green' : 'text-fintech-red'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{isPositive ? '+' : ''}{formatLKR(h.unrealizedPnL)}</span>
                      </div>
                      <div className={`text-[10px] ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatPercent(h.unrealizedPnLPercent)}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          const target = tickers.find((t) => t.symbol === h.ticker);
                          if (target) setSelectedTicker(target);
                          if (onQuickSell) onQuickSell(h.ticker);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
