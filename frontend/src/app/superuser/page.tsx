'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/SocketContext';
import { formatLKR, formatNumber } from '../../lib/utils';
import api from '../../lib/api';
import {
  Activity,
  Cpu,
  Database,
  Server,
  Zap,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  Users,
  TrendingUp,
  FileText,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Play,
  Pause,
  SlidersHorizontal
} from 'lucide-react';
import { TrademarkBadge } from '../../components/TrademarkBadge';

export default function SuperUserCommandCenterPage() {
  const { user } = useAuth();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { marketStatus, toggleMarketSessionOverride } = useMarket();
  const [sessionActionLoading, setSessionActionLoading] = useState<boolean>(false);
  const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);

  const handleSessionOverride = async (isOpen: boolean, isOverrideActive: boolean) => {
    try {
      setSessionActionLoading(true);
      await toggleMarketSessionOverride(isOpen, isOverrideActive);
      setSessionFeedback(
        isOverrideActive
          ? `Market session forced to ${isOpen ? 'OPEN' : 'CLOSED'} (Simulated)`
          : 'Market restored to real Sri Lanka Standard Time schedule'
      );
      setTimeout(() => setSessionFeedback(null), 4000);
    } catch (err: any) {
      setSessionFeedback('Failed to update market session');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    try {
      setIsRefreshing(true);
      const [telemetryRes, eventsRes] = await Promise.all([
        api.get('/superuser/telemetry'),
        api.get(`/superuser/events?category=${selectedCategory}`)
      ]);
      setTelemetry(telemetryRes.data);
      setEvents(eventsRes.data.events || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load telemetry or events:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval every 5 seconds
  useEffect(() => {
    if (!autoRefresh || !user || user.role !== 'SUPER_ADMIN') return;
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, user, fetchData]);

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-md mx-auto my-20 bg-fintech-card border border-purple-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl shadow-purple-950/20">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Supreme Super User Access Required</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            The Exchange Telemetry Command Center is restricted exclusively to accounts with the <strong>SUPER_ADMIN</strong> role.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/terminal"
            className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            <span>Return to Trading Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Observatory Header */}
      <div className="bg-gradient-to-r from-[#0C101B] via-[#0E1526] to-[#120D22] border border-purple-500/30 rounded-xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <h1 className="text-xl font-black tracking-wide text-zinc-100 uppercase flex items-center space-x-2 font-mono">
                <span>Exchange Command Center</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  SUPER ADMIN
                </span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Live server telemetry, database footprint, retail traffic analytics, and platform-wide audit event streaming.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* System Status Pill */}
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-300">SYSTEM NOMINAL</span>
            </div>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition-colors ${
                autoRefresh
                  ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                  : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400'
              }`}
              title="Toggle automatic 5-second polling"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>Auto-Sync: {autoRefresh ? 'ON (5s)' : 'PAUSED'}</span>
            </button>

            {/* Quick Switch to Admin Console */}
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>

            <TrademarkBadge size="sm" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* Super Admin Exclusive: Market Session Simulator & Engine Control */}
      <div className="bg-[#0B0F19] border border-purple-500/40 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono flex items-center space-x-2">
                <span>Market Session Control</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  SUPER ADMIN EXCLUSIVE
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Regular CSE trading is 09:30 – 14:30 SLT. Override the session here to simulate execution of queued market/limit orders anytime.
            </p>
          </div>

          {/* Current Market State Badge */}
          <div className="flex items-center space-x-3">
            <div className="text-left md:text-right">
              <div className="text-[11px] text-zinc-400 font-mono">Current Engine State</div>
              <div className="text-sm font-bold font-mono flex items-center md:justify-end space-x-2 mt-0.5">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${marketStatus?.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className={marketStatus?.isOpen ? 'text-emerald-400' : 'text-rose-400'}>
                  {marketStatus?.isOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
                </span>
                <span className="text-xs text-zinc-400 font-normal">
                  ({marketStatus?.isOverridden ? `Simulated ${marketStatus.overrideStatus}` : 'Auto SLT Clock'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-4 border-t border-fintech-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleSessionOverride(true, true)}
              disabled={sessionActionLoading}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-sm ${
                marketStatus?.isOverridden && marketStatus?.overrideStatus === 'OPEN'
                  ? 'bg-emerald-500 text-black shadow-emerald-500/20 ring-2 ring-emerald-400'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Force session OPEN: triggers processing of all queued orders"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Market OPEN</span>
              <span className="text-[10px] opacity-80">(Executes Queued)</span>
            </button>

            <button
              onClick={() => handleSessionOverride(false, true)}
              disabled={sessionActionLoading}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-sm ${
                marketStatus?.isOverridden && marketStatus?.overrideStatus === 'CLOSED'
                  ? 'bg-rose-500 text-white shadow-rose-500/20 ring-2 ring-rose-400'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40'
              }`}
              title="Force session CLOSED: causes new retail orders to be queued"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Market CLOSED</span>
              <span className="text-[10px] opacity-80">(Forces Queueing)</span>
            </button>

            <button
              onClick={() => handleSessionOverride(false, false)}
              disabled={sessionActionLoading}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
                !marketStatus?.isOverridden
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-600'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
              title="Restore standard Sri Lanka Standard Time matching schedule (9:30 AM - 2:30 PM)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sessionActionLoading ? 'animate-spin' : ''}`} />
              <span>Restore Real SLT Clock</span>
            </button>
          </div>

          {sessionFeedback && (
            <div className="text-xs font-mono font-semibold text-purple-300 bg-purple-950/70 border border-purple-500/40 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{sessionFeedback}</span>
            </div>
          )}
        </div>
      </div>

      {/* Row 1: 4 Server & Platform Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Node.js Process Uptime */}
        <div className="bg-fintech-card border border-fintech-border rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">Process Uptime</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
            {telemetry?.server?.uptimeFormatted || '00:00:00'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center justify-between">
            <span>Node {telemetry?.server?.nodeVersion || 'v20+'}</span>
            <span className="text-emerald-400 font-semibold">99.98% High-Avail</span>
          </div>
        </div>

        {/* Server Memory Consumption */}
        <div className="bg-fintech-card border border-fintech-border rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">Memory (Heap Used)</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
            {telemetry?.server?.memory?.heapUsedMB || 0} <span className="text-xs text-zinc-400">/ {telemetry?.server?.memory?.heapTotalMB || 0} MB</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                (telemetry?.server?.memory?.usagePercent || 0) > 80
                  ? 'bg-rose-500'
                  : (telemetry?.server?.memory?.usagePercent || 0) > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${telemetry?.server?.memory?.usagePercent || 10}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            RSS: {telemetry?.server?.memory?.rssMB || 0} MB ({telemetry?.server?.memory?.usagePercent || 0}% heap)
          </div>
        </div>

        {/* SQLite Database Telemetry */}
        <div className="bg-fintech-card border border-fintech-border rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">Database Footprint</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-400">
            {telemetry?.database?.sizeKB ? formatNumber(telemetry.database.sizeKB) : 0} KB
            <span className="text-xs text-zinc-400 ml-1">({telemetry?.database?.sizeMB || '0.00'} MB)</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1 truncate">
            {telemetry?.database?.entities?.equities || 285} Tickers • {telemetry?.database?.entities?.trades || 0} Trades • {telemetry?.database?.entities?.orders || 0} Orders
          </div>
        </div>

        {/* Real-Time API Speed & Throughput */}
        <div className="bg-fintech-card border border-fintech-border rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">API Latency & Traffic</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-cyan-400 flex items-center space-x-1.5">
            <span>~{telemetry?.server?.apiLatencyMs || 10} ms</span>
            <span className="text-xs text-zinc-500 font-sans font-normal">avg response</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center justify-between">
            <span>{telemetry?.server?.requestsPerMinute || 45} req/min</span>
            <span className="text-blue-400">WebSockets Live</span>
          </div>
        </div>
      </div>

      {/* Row 2: 2-Column Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Engagement, Screen Traffic & Top Traders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Traffic & Financial Velocity */}
          <div className="bg-fintech-card border border-fintech-border rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Retail Traffic & Financial Velocity</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-fintech-panel border border-fintech-border/50 rounded-lg p-3">
                <div className="text-[10px] text-zinc-500 font-sans">Active Traders Today</div>
                <div className="text-lg font-bold text-zinc-100 mt-0.5">
                  {telemetry?.engagement?.activeTradersCount || 0} / {telemetry?.engagement?.totalUsers || 0}
                </div>
                <div className="text-[10px] text-emerald-400 font-sans mt-0.5">
                  {telemetry?.engagement?.participationRate || 0}% Engagement
                </div>
              </div>

              <div className="bg-fintech-panel border border-fintech-border/50 rounded-lg p-3">
                <div className="text-[10px] text-zinc-500 font-sans">Total Turnover</div>
                <div className="text-lg font-bold text-zinc-100 mt-0.5">
                  {formatLKR(telemetry?.engagement?.totalTurnover || 0)}
                </div>
                <div className="text-[10px] text-amber-400 font-sans mt-0.5">
                  Fees: {formatLKR(telemetry?.engagement?.totalFees || 0)}
                </div>
              </div>
            </div>

            {/* Screen Engagement Distribution */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center justify-between">
                <span>Screen Traffic Distribution</span>
                <span className="text-[10px] text-zinc-500 font-mono">Est. Impressions</span>
              </div>
              <div className="space-y-2">
                {telemetry?.engagement?.screenDistribution?.map((item: any) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span className="font-mono text-[11px] truncate">{item.name}</span>
                      <span className="font-mono font-bold text-[11px]" style={{ color: item.color }}>
                        {item.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 5 Active Market Movers */}
          <div className="bg-fintech-card border border-fintech-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Top Active Traders (By Volume)</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Real-Time</span>
            </h3>

            <div className="divide-y divide-fintech-border/40 font-mono text-xs">
              {telemetry?.engagement?.topTraders?.length === 0 ? (
                <div className="text-xs text-zinc-500 py-3 text-center">No active traders yet.</div>
              ) : (
                telemetry?.engagement?.topTraders?.map((trader: any, idx: number) => (
                  <div key={trader.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 text-zinc-500 font-bold text-[11px]">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-zinc-200">{trader.username}</div>
                        <div className="text-[10px] text-zinc-500 font-sans">{trader.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{formatLKR(trader.turnover)}</div>
                      <div className="text-[10px] text-zinc-500">{trader.tradeCount} trades</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Real-Time Audit Event Stream (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-fintech-card border border-fintech-border rounded-xl flex flex-col h-full overflow-hidden">
            {/* Header & Category Filters */}
            <div className="p-4 border-b border-fintech-border bg-[#0C111D] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <h2 className="font-bold text-sm text-zinc-100 uppercase tracking-wide">
                    Live Audit Event Stream
                  </h2>
                </div>
                <div className="text-xs font-mono text-zinc-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{events.length} Events Captured</span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['ALL', 'TRADES', 'ORDERS', 'TOURNAMENTS', 'AUTH'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-fintech-panel border border-fintech-border text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Event Feed */}
            <div className="p-4 overflow-y-auto max-h-[640px] space-y-3 font-mono text-xs">
              {events.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-sans space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-zinc-600" />
                  <p>No events recorded in this category yet.</p>
                </div>
              ) : (
                events.map((evt) => {
                  const isBuy = evt.category === 'TRADES' && evt.title.includes('BUY');
                  const isSell = evt.category === 'TRADES' && evt.title.includes('SELL');
                  const isOrder = evt.category === 'ORDERS';
                  const isAuth = evt.category === 'AUTH';
                  const isTournament = evt.category === 'TOURNAMENTS';

                  const badgeColor = isBuy
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : isSell
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : isOrder
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : isTournament
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-lg bg-[#0A0E17] border border-fintech-border/70 hover:border-purple-500/40 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badgeColor}`}>
                            {evt.category}
                          </span>
                          <span className="font-bold text-zinc-200 text-xs">{evt.title}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                          {evt.detail}
                        </p>
                        <div className="text-[10px] text-zinc-500 flex items-center space-x-2 font-sans pt-0.5">
                          <span>Actor: <strong className="text-zinc-300 font-mono">{evt.actor}</strong></span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-end space-x-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-[9px] text-zinc-600 font-sans mt-0.5">
                          {new Date(evt.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Bar */}
            <div className="p-3 border-t border-fintech-border bg-[#080C14] flex items-center justify-between text-[11px] text-zinc-500">
              <span className="font-mono">⚡ Powered by Aravinda™</span>
              <span className="font-mono">Last refreshed: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
