'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { formatLKR, formatPercent, formatNumber } from '../../lib/utils';
import api from '../../lib/api';
import { 
  Trophy, 
  Medal, 
  Flame, 
  Users, 
  Calendar, 
  Sparkles, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  CheckCircle2, 
  Timer, 
  Gift, 
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Crown
} from 'lucide-react';
import { TrademarkBadge } from '../../components/TrademarkBadge';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rankings' | 'tournaments' | 'hall-of-fame' | 'badges'>('rankings');
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

  // Data states
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [tournamentsData, setTournamentsData] = useState<any>(null);
  const [badgesList, setBadgesList] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);

  // Loading states
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  // Fetch rankings
  const fetchRankings = async (tf: 'all' | 'month' | 'week') => {
    setIsLoadingRankings(true);
    try {
      const res = await api.get(`/leaderboard?timeframe=${tf}`);
      setLeaderboardData(res.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoadingRankings(false);
    }
  };

  // Fetch tournaments
  const fetchTournaments = async () => {
    setIsLoadingTournaments(true);
    try {
      const res = await api.get('/leaderboard/tournaments');
      setTournamentsData(res.data);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  // Fetch badges
  const fetchBadges = async () => {
    try {
      const res = await api.get('/leaderboard/badges');
      setBadgesList(res.data);
    } catch (err) {
      console.error('Failed to load badges:', err);
    }
  };

  // Fetch logged in user rank summary
  const fetchMyRank = async () => {
    if (!user) return;
    try {
      const res = await api.get('/leaderboard/me');
      setUserStats(res.data);
    } catch (err) {
      // User rank not available yet
    }
  };

  useEffect(() => {
    fetchRankings(timeframe);
    fetchTournaments();
    fetchBadges();
    if (user) {
      fetchMyRank();
    }
  }, [user]);

  const handleTimeframeChange = (tf: 'all' | 'month' | 'week') => {
    setTimeframe(tf);
    fetchRankings(tf);
  };

  const handleJoinTournament = async (tournamentId: string) => {
    if (!user) {
      alert('Please sign in first to participate in trading tournaments');
      return;
    }

    setIsJoining(tournamentId);
    setJoinMessage(null);
    try {
      const res = await api.post(`/leaderboard/tournaments/${tournamentId}/join`);
      setJoinMessage(res.data.message || 'Successfully entered the tournament!');
      fetchTournaments();
      setTimeout(() => setJoinMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join tournament');
    } finally {
      setIsJoining(null);
    }
  };

  const podium = leaderboardData?.podium;
  const rankings = leaderboardData?.rankings || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-fintech-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-950/40">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center space-x-2">
              <span>CSE Public Leaderboard & Trading Competitions</span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Official Colombo Stock Exchange Trader Rankings • Mark-to-Market Real-Time Performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <TrademarkBadge size="sm" />
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-xl">
          <span className="text-[11px] text-zinc-400 font-sans uppercase block">Registered Traders</span>
          <span className="text-lg font-bold text-zinc-100 mt-1 block">
            {leaderboardData?.totalTraders || 0}
          </span>
          <span className="text-[10px] text-zinc-500">Active Colombo Portfolios</span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-xl">
          <span className="text-[11px] text-zinc-400 font-sans uppercase block">Qualified Competitors</span>
          <span className="text-lg font-bold text-emerald-400 mt-1 block">
            {leaderboardData?.qualifiedTradersCount || 0}
          </span>
          <span className="text-[10px] text-zinc-500">Min 3 executed trades</span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-xl">
          <span className="text-[11px] text-zinc-400 font-sans uppercase block">Active Tournaments</span>
          <span className="text-lg font-bold text-amber-400 mt-1 block">
            {tournamentsData?.active?.length || 0}
          </span>
          <span className="text-[10px] text-zinc-500">Weekly Sprint & Monthly Cup</span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-xl">
          <span className="text-[11px] text-zinc-400 font-sans uppercase block">Current Top Return</span>
          <span className={`text-lg font-bold mt-1 block ${(podium?.gold?.totalReturnPercent || 0) >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
            {(podium?.gold?.totalReturnPercent || 0) >= 0 ? '+' : ''}{formatPercent(podium?.gold?.totalReturnPercent || 0)}
          </span>
          <span className="text-[10px] text-zinc-500">
            {podium?.gold ? `@${podium.gold.username}` : 'No trades yet'}
          </span>
        </div>
      </div>

      {/* Join Toast Alert */}
      {joinMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{joinMessage}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex border-b border-fintech-border gap-1 text-xs">
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'rankings'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Live Rankings</span>
        </button>

        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'tournaments'
              ? 'border-blue-400 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Active Tournaments ({tournamentsData?.active?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('hall-of-fame')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'hall-of-fame'
              ? 'border-purple-400 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Hall of Fame</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'badges'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges & Achievements ({badgesList.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVE RANKINGS */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          {/* Timeframe Filter Buttons & Qualification Rule */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-fintech-card p-3 rounded-xl border border-fintech-border">
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-zinc-400 font-medium mr-2">Timeframe:</span>
              <button
                onClick={() => handleTimeframeChange('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  timeframe === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-fintech-panel hover:bg-fintech-hover text-zinc-400 border border-fintech-border'
                }`}
              >
                All-Time
              </button>
              <button
                onClick={() => handleTimeframeChange('month')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  timeframe === 'month'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-fintech-panel hover:bg-fintech-hover text-zinc-400 border border-fintech-border'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handleTimeframeChange('week')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  timeframe === 'week'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-fintech-panel hover:bg-fintech-hover text-zinc-400 border border-fintech-border'
                }`}
              >
                This Week
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Qualification: Min 3 executed trades required to unlock competitive ranking badge.</span>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          {podium && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Silver (Rank 2) */}
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-800/30 to-fintech-card border border-slate-600/40 rounded-2xl p-5 relative shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40 flex items-center justify-center font-bold text-base">
                    🥈
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-400/10 text-slate-300 border border-slate-400/30 uppercase">
                    Rank #2 Silver
                  </span>
                </div>
                <div className="my-4">
                  <div className="text-base font-extrabold text-zinc-100 truncate">
                    {podium.silver?.username || 'Position Open'}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    Valuation: {podium.silver ? formatLKR(podium.silver.totalPortfolioValue) : 'Rs. 0.00'}
                  </div>
                </div>
                <div className="pt-3 border-t border-fintech-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Return:</span>
                  <span className={`font-mono font-bold text-sm ${(podium.silver?.totalReturnPercent || 0) >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
                    {(podium.silver?.totalReturnPercent || 0) >= 0 ? '+' : ''}{formatPercent(podium.silver?.totalReturnPercent || 0)}
                  </span>
                </div>
              </div>

              {/* Gold (Rank 1 - Featured Center) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/15 via-fintech-card to-fintech-card border-2 border-amber-400/60 rounded-2xl p-5 relative shadow-2xl shadow-amber-950/40 flex flex-col justify-between md:-translate-y-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black tracking-wider uppercase flex items-center space-x-1 shadow-md">
                  <Crown className="w-3 h-3 text-black" />
                  <span>CSE Champion</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="w-11 h-11 rounded-full bg-amber-400/20 text-amber-300 border-2 border-amber-400/50 flex items-center justify-center font-bold text-xl shadow-lg">
                    🥇
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    Rank #1 Gold
                  </span>
                </div>
                <div className="my-4">
                  <div className="text-lg font-black text-amber-200 truncate">
                    {podium.gold?.username || 'Position Open'}
                  </div>
                  <div className="text-xs text-zinc-300 font-mono mt-0.5">
                    Portfolio NAV: {podium.gold ? formatLKR(podium.gold.totalPortfolioValue) : 'Rs. 0.00'}
                  </div>
                </div>
                <div className="pt-3 border-t border-amber-500/30 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Total Return:</span>
                  <span className={`font-mono font-black text-base ${(podium.gold?.totalReturnPercent || 0) >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
                    {(podium.gold?.totalReturnPercent || 0) >= 0 ? '+' : ''}{formatPercent(podium.gold?.totalReturnPercent || 0)}
                  </span>
                </div>
              </div>

              {/* Bronze (Rank 3) */}
              <div className="order-3 md:order-3 bg-gradient-to-b from-amber-900/20 to-fintech-card border border-amber-800/40 rounded-2xl p-5 relative shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-full bg-amber-900/30 text-amber-500 border border-amber-700/40 flex items-center justify-center font-bold text-base">
                    🥉
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/20 text-amber-500 border border-amber-800/30 uppercase">
                    Rank #3 Bronze
                  </span>
                </div>
                <div className="my-4">
                  <div className="text-base font-extrabold text-zinc-100 truncate">
                    {podium.bronze?.username || 'Position Open'}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    Valuation: {podium.bronze ? formatLKR(podium.bronze.totalPortfolioValue) : 'Rs. 0.00'}
                  </div>
                </div>
                <div className="pt-3 border-t border-fintech-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Return:</span>
                  <span className={`font-mono font-bold text-sm ${(podium.bronze?.totalReturnPercent || 0) >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
                    {(podium.bronze?.totalReturnPercent || 0) >= 0 ? '+' : ''}{formatPercent(podium.bronze?.totalReturnPercent || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="bg-fintech-card border border-fintech-border rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-fintech-border bg-[#0D131F] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Medal className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-200">
                  Global CSE Performance Leaderboard
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {rankings.length} Total Registered Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#080C14] text-[11px] text-zinc-400 border-b border-fintech-border font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Trader</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Return %</th>
                    <th className="py-2.5 px-3 text-right">Net Valuation (NAV)</th>
                    <th className="py-2.5 px-3 text-center">Win Rate</th>
                    <th className="py-2.5 px-3 text-center">Trades</th>
                    <th className="py-2.5 px-3">Badges & Titles</th>
                    <th className="py-2.5 px-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border/30 font-mono">
                  {isLoadingRankings ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-zinc-400 font-sans text-xs animate-pulse">
                        Calculating live mark-to-market portfolio returns...
                      </td>
                    </tr>
                  ) : rankings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-zinc-500 font-sans text-xs">
                        No registered traders found.
                      </td>
                    </tr>
                  ) : (
                    rankings.map((trader: any) => {
                      const isPositive = trader.totalReturnPercent >= 0;
                      const isCurrentUser = user && user.id === trader.id;

                      return (
                        <tr 
                          key={trader.id} 
                          className={`hover:bg-fintech-hover/60 transition-colors ${
                            isCurrentUser ? 'bg-blue-950/20 border-l-2 border-blue-500' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-bold">
                            {trader.rank === 1 ? (
                              <span className="text-amber-400 flex items-center space-x-1">
                                <span>🥇</span>
                                <span>#1</span>
                              </span>
                            ) : trader.rank === 2 ? (
                              <span className="text-slate-300 flex items-center space-x-1">
                                <span>🥈</span>
                                <span>#2</span>
                              </span>
                            ) : trader.rank === 3 ? (
                              <span className="text-amber-600 flex items-center space-x-1">
                                <span>🥉</span>
                                <span>#3</span>
                              </span>
                            ) : (
                              <span className="text-zinc-400">#{trader.rank}</span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-zinc-200 flex items-center space-x-1.5">
                              <span>{trader.username}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  YOU
                                </span>
                              )}
                              {trader.role === 'ADMIN' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  ADMIN
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {trader.isQualified ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Ranked</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 inline-block" title={`Need ${3 - trader.tradeCount} more trades to qualify`}>
                                Developing ({trader.tradeCount}/3)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-bold">
                            <span className={isPositive ? 'text-fintech-green' : 'text-fintech-red'}>
                              {isPositive ? '+' : ''}{formatPercent(trader.totalReturnPercent)}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right text-zinc-200 font-bold">
                            {formatLKR(trader.totalPortfolioValue)}
                          </td>

                          <td className="py-3 px-3 text-center text-zinc-300">
                            {trader.winRate}%
                          </td>

                          <td className="py-3 px-3 text-center text-zinc-300">
                            {trader.tradeCount}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-xs font-sans">
                              {trader.badges && trader.badges.length > 0 ? (
                                trader.badges.slice(0, 3).map((b: any) => (
                                  <span 
                                    key={b.id} 
                                    className="px-1.5 py-0.5 rounded bg-fintech-panel border border-fintech-border text-[10px] text-zinc-300 flex items-center space-x-1"
                                    title={`${b.name}: ${b.description}`}
                                  >
                                    <span>{b.icon}</span>
                                    <span className="truncate max-w-[90px]">{b.name}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-mono">No badges yet</span>
                              )}
                              {trader.badges && trader.badges.length > 3 && (
                                <span className="text-[10px] text-zinc-500 font-mono">+{trader.badges.length - 3}</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <Link
                              href={`/reports?userId=${trader.id}`}
                              className="px-2 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs inline-flex items-center space-x-1 transition-colors"
                              title="Audit verified CDS statement"
                            >
                              <FileText className="w-3 h-3" />
                              <span>CDS</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE TOURNAMENTS */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-start space-x-3 text-xs">
            <Gift className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200 block">How CSE Trading Competitions Work:</span>
              <p className="text-zinc-400 mt-0.5">
                Every trader starts on equal footing with simulated capital. Compete during exchange hours to generate the highest return percentage. Winners earn official podium badges, Hall of Fame immortalization, and certified electronic notes!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournamentsData?.active?.map((t: any) => (
              <div 
                key={t.id} 
                className="bg-fintech-card border border-fintech-border rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-blue-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{t.status}</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{t.participantCount} Competitors</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-100">{t.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{t.description}</p>

                  <div className="my-4 p-3 bg-fintech-panel rounded-lg border border-fintech-border/60 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="font-sans text-zinc-400 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Duration:</span>
                      </span>
                      <span>{new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="font-sans text-zinc-400 flex items-center space-x-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Awards:</span>
                      </span>
                      <span className="text-amber-300 font-sans text-right truncate max-w-[200px]">{t.prizeDetails}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-fintech-border flex items-center justify-between">
                  {t.isJoined ? (
                    <span className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Participating</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinTournament(t.id)}
                      disabled={isJoining === t.id}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-blue-950/40"
                    >
                      <span>{isJoining === t.id ? 'Joining...' : 'Enter Challenge'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <span className="text-[11px] text-zinc-500 font-mono">
                    Official CSE Paper Cup
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HALL OF FAME */}
      {activeTab === 'hall-of-fame' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-start space-x-3 text-xs">
            <Crown className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200 block">The Colombo Masters Hall of Fame:</span>
              <p className="text-zinc-400 mt-0.5">
                Historic tournament winners and legendary paper trading champions are immortalized here for permanent recognition across the Sri Lankan capital market simulation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournamentsData?.completed?.map((t: any) => (
              <div 
                key={t.id} 
                className="bg-fintech-card border border-purple-500/30 rounded-xl p-5 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase">
                    Concluded Cup
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {t.participantCount} Total Competitors
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-100">{t.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">{t.description}</p>

                <div className="mt-4 pt-3 border-t border-fintech-border/40">
                  <span className="text-xs font-semibold text-zinc-300 uppercase block mb-2 font-mono">
                    Podium Champions:
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    {t.topParticipants && t.topParticipants.length > 0 ? (
                      t.topParticipants.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-fintech-panel border border-fintech-border">
                          <span className="flex items-center space-x-2">
                            <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                            <span className="font-bold text-zinc-200 font-sans">@{p.username}</span>
                          </span>
                          <span className="font-bold text-emerald-400">
                            +{formatPercent(p.finalReturn || 0)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-500 text-xs font-sans">Archived without recorded podium</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BADGES SHOWCASE */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-start space-x-3 text-xs">
            <Award className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200 block">Achievement Badges & Rarity:</span>
              <p className="text-zinc-400 mt-0.5">
                Earn badges automatically by trading, achieving high returns, maintaining win streaks, and diversifying across CSE market sectors.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {badgesList.map((badge) => {
              const hasUnlocked = userStats?.badges?.some((b: any) => b.id === badge.id);

              return (
                <div 
                  key={badge.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    hasUnlocked
                      ? 'bg-fintech-card border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : 'bg-fintech-card/60 border-fintech-border/50 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        badge.rarity === 'LEGENDARY'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : badge.rarity === 'EPIC'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : badge.rarity === 'RARE'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {badge.rarity}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-zinc-100">{badge.name}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">{badge.description}</p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-fintech-border/30 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-mono">{badge.category}</span>
                    {hasUnlocked ? (
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-mono">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
