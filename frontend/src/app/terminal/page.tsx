'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { PortfolioSummary } from '../../components/PortfolioSummary';
import { MarketWatch } from '../../components/MarketWatch';
import { OrderEntryForm } from '../../components/OrderEntryForm';
import { HoldingsTable } from '../../components/HoldingsTable';
import { OrdersTable } from '../../components/OrdersTable';
import { AuthModal } from '../../components/AuthModal';
import api from '../../lib/api';
import { useMarket } from '../../context/SocketContext';
import { Trophy, ChevronRight } from 'lucide-react';
import { formatPercent } from '../../lib/utils';

export default function TerminalPage() {
  const { user } = useAuth();
  const { orderRefreshTick } = useMarket();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [rankSummary, setRankSummary] = useState<any>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchPortfolio = async () => {
    if (!user) return;
    setIsLoadingPortfolio(true);
    try {
      const res = await api.get('/portfolio');
      setPortfolio(res.data);
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const fetchRankSummary = async () => {
    if (!user) {
      setRankSummary(null);
      return;
    }
    try {
      const res = await api.get('/leaderboard/me');
      setRankSummary(res.data);
    } catch {
      // Ignored if unranked
    }
  };

  useEffect(() => {
    fetchPortfolio();
    fetchRankSummary();
  }, [user, refreshTrigger, orderRefreshTick]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* 1. Top Section: Portfolio Performance Cards */}
      <PortfolioSummary portfolio={portfolio} isLoading={isLoadingPortfolio} />

      {/* Competitive Leaderboard Rank Bar */}
      {user && rankSummary && (
        <div className="bg-gradient-to-r from-amber-500/10 via-fintech-card to-blue-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-zinc-100 flex items-center space-x-1.5">
                <span>National Rank:</span>
                <span className="text-amber-400 font-mono font-black text-sm">
                  {rankSummary.rank ? `#${rankSummary.rank}` : 'Unranked'}
                </span>
                <span className="text-zinc-500 font-normal">/ {rankSummary.totalTraders} Traders</span>
              </span>
              <span className="text-[11px] text-zinc-400 block sm:inline sm:ml-2">
                {rankSummary.isQualified 
                  ? `Qualified competitor (${formatPercent(rankSummary.totalReturnPercent)} overall return)`
                  : `Execute ${rankSummary.tradesRequired} more trade(s) to unlock official competitive ranking`}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {rankSummary.topBadge && (
              <span className="px-2 py-1 rounded-lg bg-fintech-panel border border-fintech-border text-zinc-200 flex items-center space-x-1 text-xs">
                <span>{rankSummary.topBadge.icon}</span>
                <span className="font-medium">{rankSummary.topBadge.name}</span>
              </span>
            )}
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>View Leaderboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Market Watch (5 columns on large screens) */}
        <div className="lg:col-span-5 h-[560px]">
          <MarketWatch />
        </div>

        {/* Middle Column: Order Entry Form (4 columns) */}
        <div className="lg:col-span-4 min-h-[560px]">
          <OrderEntryForm
            onOrderPlaced={handleRefresh}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        </div>

        {/* Right Column: Holdings Breakdown (3 columns) */}
        <div className="lg:col-span-3 min-h-[560px]">
          <HoldingsTable
            holdings={portfolio?.holdings || []}
            isLoading={isLoadingPortfolio}
            onQuickSell={() => handleRefresh()}
          />
        </div>
      </div>

      {/* 3. Bottom Section: Active & Queued Orders / History Table */}
      <div className="mt-4">
        <OrdersTable
          refreshTrigger={refreshTrigger}
          onOrderCancelled={handleRefresh}
        />
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
