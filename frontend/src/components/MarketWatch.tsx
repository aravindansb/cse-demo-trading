'use client';

import React, { useState } from 'react';
import { useMarket, MarketTicker } from '../context/SocketContext';
import { formatLKR, formatPercent, formatNumber } from '../lib/utils';
import { Search, ArrowUpRight, ArrowDownRight, Layers, RefreshCw } from 'lucide-react';

export const MarketWatch: React.FC = () => {
  const { tickers, selectedTicker, setSelectedTicker, tickFlashes, syncCseData, isSyncingCse } = useMarket();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const sectors = ['ALL', ...Array.from(new Set(tickers.map((t) => t.sector).filter(Boolean))).sort()];

  const filteredTickers = tickers.filter((t) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      t.symbol.toLowerCase().includes(term) ||
      t.name.toLowerCase().includes(term);
    const matchesSector = sectorFilter === 'ALL' || t.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-lg flex flex-col h-full overflow-hidden">
      {/* Header & Filters */}
      <div className="p-3 border-b border-fintech-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-sm text-zinc-100 uppercase tracking-wide">CSE Market Watch</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-zinc-400">
              {filteredTickers.length} / {tickers.length} Listed Equities
            </span>
            <button
              onClick={syncCseData}
              disabled={isSyncingCse}
              className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-fintech-hover transition-colors"
              title="Sync latest CSE prices & volume"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCse ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all 285 stocks (e.g. JKH, COMB, SAMP, LOLC, CTC, DIST, BIL)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-fintech-panel border border-fintech-border rounded px-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                sectorFilter === sec
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'bg-fintech-panel text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Tickers Table */}
      <div className="flex-1 overflow-y-auto min-h-[320px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#0D131F] sticky top-0 z-10 text-[11px] text-zinc-400 font-medium border-b border-fintech-border">
            <tr>
              <th className="py-2 px-3">Symbol</th>
              <th className="py-2 px-2 text-right">Price (LKR)</th>
              <th className="py-2 px-2 text-right">Change</th>
              <th className="py-2 px-2 text-right hidden xl:table-cell">24h High/Low</th>
              <th className="py-2 px-3 text-right hidden lg:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fintech-border/40 font-mono">
            {filteredTickers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500 font-sans">
                  No CSE listed stocks match &ldquo;{searchTerm}&rdquo;.
                </td>
              </tr>
            ) : (
              filteredTickers.map((ticker) => {
                const isSelected = selectedTicker?.symbol === ticker.symbol;
                const isPositive = ticker.change >= 0;
                const flash = tickFlashes[ticker.symbol];

                let rowBgClass = isSelected ? 'bg-blue-950/30 border-l-2 border-l-blue-500' : 'hover:bg-fintech-hover/60';
                if (flash === 'up') rowBgClass = 'bg-emerald-950/40 animate-pulse';
                if (flash === 'down') rowBgClass = 'bg-rose-950/40 animate-pulse';

                return (
                  <tr
                    key={ticker.symbol}
                    onClick={() => setSelectedTicker(ticker)}
                    className={`cursor-pointer transition-colors ${rowBgClass}`}
                  >
                    <td className="py-2 px-3">
                      <div className="font-bold text-zinc-200 flex items-center space-x-1.5">
                        <span>{ticker.symbol}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                      <div className="text-[10px] font-sans text-zinc-400 truncate max-w-[150px]">
                        {ticker.name}
                      </div>
                    </td>

                    <td className="py-2 px-2 text-right">
                      <div className={`font-bold ${isPositive ? 'text-fintech-green' : 'text-fintech-red'}`}>
                        {ticker.lastTradedPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Prev: {ticker.previousClose.toFixed(2)}
                      </div>
                    </td>

                    <td className="py-2 px-2 text-right">
                      <div className={`inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{formatPercent(ticker.changePercent)}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {isPositive ? `+${ticker.change.toFixed(2)}` : ticker.change.toFixed(2)}
                      </div>
                    </td>

                    <td className="py-2 px-2 text-right text-zinc-400 hidden xl:table-cell text-[11px]">
                      <div className="text-zinc-300">H: {ticker.highPrice.toFixed(2)}</div>
                      <div className="text-zinc-500">L: {ticker.lowPrice.toFixed(2)}</div>
                    </td>

                    <td className="py-2 px-3 text-right text-zinc-400 hidden lg:table-cell text-[11px]">
                      <div>{formatNumber(ticker.volume)}</div>
                      <div className="text-[10px] text-zinc-500">
                        Rs. {(ticker.turnover / 1000000).toFixed(1)}M
                      </div>
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
