'use client';

import React from 'react';
import { useMarket } from '../context/SocketContext';
import { Clock, AlertCircle, CheckCircle2, Zap, Play, Pause, RotateCcw, RefreshCw, Globe } from 'lucide-react';

export const MarketStatusBar: React.FC = () => {
  const { marketStatus, simulateTick, toggleMarketSessionOverride, syncCseData, isSyncingCse, tickers } = useMarket();

  if (!marketStatus) return null;

  return (
    <div className="bg-fintech-card border-b border-fintech-border px-4 py-2.5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Left: Status and Explanation */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            {marketStatus.isOpen ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span>
            )}

            <span className="font-bold text-zinc-200">
              {marketStatus.isOpen ? 'MARKET ACTIVE' : 'MARKET CLOSED'}
            </span>
          </div>

          <div className="h-4 w-px bg-fintech-border hidden md:block" />

          <div className="text-zinc-400 text-xs flex items-center space-x-2">
            <span>{marketStatus.reason}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
              {tickers.length} CSE Equities Active
            </span>
            {marketStatus.isOverridden && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30">
                OVERRIDE ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick sync and simulation triggers */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={syncCseData}
            disabled={isSyncingCse}
            className="px-2.5 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center space-x-1.5 transition-colors font-medium"
            title="Sync all 285 CSE listed stocks & official index data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCse ? 'animate-spin' : ''}`} />
            <span>{isSyncingCse ? 'Syncing CSE...' : 'Sync CSE Live'}</span>
          </button>

          <button
            onClick={simulateTick}
            className="px-2.5 py-1 rounded bg-fintech-panel hover:bg-fintech-hover border border-fintech-border text-zinc-300 hover:text-white flex items-center space-x-1.5 transition-colors"
            title="Simulate instant price tick for active tickers"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Tick</span>
          </button>

          {marketStatus.isOpen ? (
            <button
              onClick={() => toggleMarketSessionOverride(false, true)}
              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center space-x-1.5 transition-colors"
              title="Force simulate market closed to test QUEUED orders"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Simulate Closed</span>
            </button>
          ) : (
            <button
              onClick={() => toggleMarketSessionOverride(true, true)}
              className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1.5 transition-colors"
              title="Force simulate market open to test immediate matching & queued transitions"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Open</span>
            </button>
          )}

          {marketStatus.isOverridden && (
            <button
              onClick={() => toggleMarketSessionOverride(false, false)}
              className="p-1 rounded bg-fintech-panel hover:bg-fintech-hover border border-fintech-border text-zinc-400 hover:text-zinc-200"
              title="Reset session to real Sri Lanka Standard Time clock"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
