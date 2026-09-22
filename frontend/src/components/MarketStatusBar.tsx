'use client';

import React from 'react';
import { useMarket } from '../context/SocketContext';
import { RefreshCw } from 'lucide-react';

export const MarketStatusBar: React.FC = () => {
  const { marketStatus, syncCseData, isSyncingCse, tickers } = useMarket();

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
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                SUPER ADMIN OVERRIDE ({marketStatus.overrideStatus})
              </span>
            )}
          </div>
        </div>

        {/* Right: CSE Live Sync */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={syncCseData}
            disabled={isSyncingCse}
            className="px-2.5 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center space-x-1.5 transition-colors font-medium"
            title="Sync all 285 CSE listed stocks & official index data directly from CSE API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCse ? 'animate-spin' : ''}`} />
            <span>{isSyncingCse ? 'Syncing CSE...' : 'Sync CSE Live'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
