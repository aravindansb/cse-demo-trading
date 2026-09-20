'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { formatLKR, formatPercent, formatNumber } from '../../lib/utils';
import api from '../../lib/api';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Eye, 
  X, 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight,
  Briefcase,
  Layers,
  Sparkles,
  FileText,
  Copy,
  Check,
  KeyRound,
  Trophy,
  Trash2,
  AlertTriangle,
  UserPlus
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectingUser, setInspectingUser] = useState<any>(null);
  const [isLoadingInspection, setIsLoadingInspection] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [isSubmittingTournament, setIsSubmittingTournament] = useState(false);
  const [newTournament, setNewTournament] = useState({
    title: '',
    description: '',
    category: 'CUSTOM',
    startDate: '',
    endDate: '',
    prizeDetails: ''
  });

  // Provision Admin State
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    securityPin: '1234',
    role: 'ADMIN' as 'ADMIN' | 'SUPER_ADMIN',
    authorizingPin: ''
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [createAdminError, setCreateAdminError] = useState<string | null>(null);
  const [adminCreatedToast, setAdminCreatedToast] = useState<string | null>(null);

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAdmin(true);
    setCreateAdminError(null);

    try {
      const res = await api.post('/admin/create-admin', adminForm);
      setAdminCreatedToast(res.data.message || `Admin '${adminForm.username}' created successfully.`);
      setShowCreateAdminModal(false);
      setAdminForm({
        username: '',
        email: '',
        password: '',
        securityPin: '1234',
        role: 'ADMIN',
        authorizingPin: ''
      });
      await fetchAdminData();
      setTimeout(() => setAdminCreatedToast(null), 5000);
    } catch (err: any) {
      setCreateAdminError(err.response?.data?.error || 'Failed to provision administrator');
    } finally {
      setIsCreatingAdmin(false);
    }
  };
  const [resetNotification, setResetNotification] = useState<{
    type: 'PWD' | 'PIN';
    username: string;
    value: string;
    copied: boolean;
  } | null>(null);

  // Deletion modal state
  const [deletingTrader, setDeletingTrader] = useState<any>(null);
  const [adminPin, setAdminPin] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  const handleDeleteTraderClick = (trader: any) => {
    setDeletingTrader(trader);
    setAdminPin('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingTrader) return;
    if (!adminPin || adminPin.trim().length !== 4) {
      setDeleteError('Please enter your 4-digit Administrator Security PIN.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await api.delete(`/admin/traders/${deletingTrader.id}`, {
        data: { pin: adminPin.trim() }
      });
      setDeleteSuccessToast(res.data.message || `Trader ${deletingTrader.username} permanently deleted.`);
      setDeletingTrader(null);
      setAdminPin('');
      await fetchAdminData();
      setTimeout(() => {
        setDeleteSuccessToast(null);
      }, 5000);
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete trader account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdminResetPassword = async (targetUser: any) => {
    if (!confirm(`Reset password for "${targetUser.username}" to the default "Password123!"?`)) {
      return;
    }
    setIsResetting(targetUser.id + '_pwd');
    try {
      const res = await api.post('/admin/reset-password', { targetUserId: targetUser.id });
      setResetNotification({
        type: 'PWD',
        username: targetUser.username,
        value: res.data.newPassword || 'Password123!',
        copied: false
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsResetting(null);
    }
  };

  const handleAdminResetPin = async (targetUser: any) => {
    if (!confirm(`Reset Security PIN for "${targetUser.username}" to the default "1234"?`)) {
      return;
    }
    setIsResetting(targetUser.id + '_pin');
    try {
      const res = await api.post('/admin/reset-pin', { targetUserId: targetUser.id });
      setResetNotification({
        type: 'PIN',
        username: targetUser.username,
        value: res.data.newPin || '1234',
        copied: false
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset Security PIN');
    } finally {
      setIsResetting(null);
    }
  };

  const fetchAdminData = async () => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get('/admin/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleInspectUser = async (userId: string) => {
    setIsLoadingInspection(true);
    try {
      const res = await api.get(`/admin/traders/${userId}`);
      setInspectingUser(res.data);
    } catch (err) {
      alert('Failed to inspect user ledger');
    } finally {
      setIsLoadingInspection(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="max-w-md mx-auto my-16 bg-fintech-card border border-fintech-border rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Restricted Administrator Area</h2>
          <p className="text-xs text-zinc-400 mt-1">
            You must be signed in with an <strong>ADMIN</strong> or <strong>SUPER_ADMIN</strong> role to view global exchange metrics and inspect user ledgers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Exchange Administrator Console</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            System-wide visibility over all retail portfolios, virtual capital allocation, and market depth.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="px-3.5 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-purple-400" />
            <span>Create Admin</span>
          </button>
          <button
            onClick={() => setShowCreateTournament(true)}
            className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Launch Tournament</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-fintech-card border border-fintech-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Capital Deployed</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
            {formatLKR(metrics?.overview?.totalCapitalDeployed || 0)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Across all active portfolios
          </div>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>System Trade Volume</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
            {formatLKR(metrics?.overview?.totalVolume || 0)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
            {metrics?.overview?.totalTrades || 0} executed trades
          </div>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>CSE Fees Generated (1.12%)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-400">
            {formatLKR(metrics?.overview?.totalFees || 0)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Brokerage, SEC, CDS & Levy
          </div>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Registered Traders</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
            {metrics?.overview?.totalUsers || 0}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Rs. 1,000,000 baseline each
          </div>
        </div>
      </div>

      {/* Most Traded Equities Section */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Most Traded CSE Equities (System Volume)</span>
        </h3>
        {metrics?.mostTradedEquities?.length === 0 ? (
          <div className="text-xs text-zinc-500 py-4 text-center">
            No trades executed yet. Equities will appear here once trading commences.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
            {metrics?.mostTradedEquities?.map((eq: any) => (
              <div key={eq.symbol} className="bg-fintech-panel border border-fintech-border rounded p-3">
                <div className="font-bold text-sm text-zinc-100">{eq.symbol}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Volume: {formatNumber(eq.totalShares)}
                </div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                  Turnover: {formatLKR(eq.totalTurnover)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {eq.tradeCount} trades
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Traders Leaderboard Table */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg flex flex-col overflow-hidden">
        <div className="p-3.5 border-b border-fintech-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-sm text-zinc-100 uppercase tracking-wide">
              Global Traders Leaderboard & Accounts
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {metrics?.allTraders?.length || 0} Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0D131F] text-[11px] text-zinc-400 border-b border-fintech-border font-medium">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Trader</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-right">Cash Available</th>
                <th className="py-2.5 px-3 text-right">Stock Valuation</th>
                <th className="py-2.5 px-3 text-right">Portfolio Total</th>
                <th className="py-2.5 px-3 text-right">P&L Return (%)</th>
                <th className="py-2.5 px-3 text-center">Trades</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/40 font-mono">
              {metrics?.allTraders?.map((trader: any, index: number) => {
                const isPositive = trader.totalReturn >= 0;
                return (
                  <tr key={trader.id} className="hover:bg-fintech-hover/60 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-400 font-bold">
                      #{index + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-zinc-200">{trader.username}</div>
                      <div className="text-[10px] font-sans text-zinc-500">{trader.email}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        trader.role === 'SUPER_ADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : trader.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {trader.role}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {formatLKR(trader.availableCash)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {formatLKR(trader.stockValue)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-zinc-100">
                      {formatLKR(trader.totalPortfolioValue)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className={`font-bold flex items-center justify-end space-x-0.5 ${
                        isPositive ? 'text-fintech-green' : 'text-fintech-red'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{formatPercent(trader.totalReturnPercent)}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {isPositive ? '+' : ''}{formatLKR(trader.totalReturn)}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center text-zinc-300">
                      {trader.tradeCount}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleInspectUser(trader.id)}
                          className="px-2 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs flex items-center space-x-1 transition-colors"
                          title="Quick ledger inspect"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <Link
                          href={`/reports?userId=${trader.id}`}
                          className="px-2 py-1 rounded bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-1 transition-colors"
                          title="Generate CDS statement & contract notes for this trader"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Statements</span>
                        </Link>
                        <button
                          onClick={() => handleAdminResetPassword(trader)}
                          disabled={isResetting === trader.id + '_pwd'}
                          className="px-2 py-1 rounded bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs flex items-center space-x-1 transition-colors"
                          title="Reset password to Password123!"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{isResetting === trader.id + '_pwd' ? '...' : 'Reset Pwd'}</span>
                        </button>
                        <button
                          onClick={() => handleAdminResetPin(trader)}
                          disabled={isResetting === trader.id + '_pin'}
                          className="px-2 py-1 rounded bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs flex items-center space-x-1 transition-colors"
                          title="Reset Security PIN to 1234"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{isResetting === trader.id + '_pin' ? '...' : 'Reset PIN'}</span>
                        </button>
                        {trader.role === 'ADMIN' || trader.role === 'SUPER_ADMIN' ? (
                          <button
                            disabled
                            className="px-2 py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-zinc-600 text-xs flex items-center space-x-1 cursor-not-allowed"
                            title="Administrator accounts cannot be deleted"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Protected</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteTraderClick(trader)}
                            className="px-2 py-1 rounded bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs flex items-center space-x-1 transition-colors"
                            title={`Permanently delete trader ${trader.username}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trader Deep Inspection Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-fintech-card border border-fintech-border rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-fintech-border bg-[#0D131F] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
                  <span>Trader Ledger Inspection:</span>
                  <span className="text-blue-400">{inspectingUser.user.username}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">{inspectingUser.user.email} (ID: {inspectingUser.user.id})</p>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-fintech-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* Balances */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-fintech-panel border border-fintech-border rounded p-3">
                  <div className="text-xs text-zinc-400">Available Virtual Cash</div>
                  <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
                    {formatLKR(inspectingUser.portfolio.wallet.availableCash)}
                  </div>
                </div>
                <div className="bg-fintech-panel border border-fintech-border rounded p-3">
                  <div className="text-xs text-zinc-400">Holdings Value</div>
                  <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
                    {formatLKR(inspectingUser.portfolio.summary.totalStockValue)}
                  </div>
                </div>
                <div className="bg-fintech-panel border border-fintech-border rounded p-3">
                  <div className="text-xs text-zinc-400">Total Portfolio Valuation</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    {formatLKR(inspectingUser.portfolio.summary.totalPortfolioValue)}
                  </div>
                </div>
              </div>

              {/* Holdings */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 uppercase mb-2">Current Stock Holdings</h4>
                <div className="bg-fintech-panel border border-fintech-border rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080C14] text-zinc-400 text-[11px] border-b border-fintech-border">
                      <tr>
                        <th className="p-2">Ticker</th>
                        <th className="p-2 text-right">Shares</th>
                        <th className="p-2 text-right">Avg Cost</th>
                        <th className="p-2 text-right">Market Price</th>
                        <th className="p-2 text-right">Unrealized P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fintech-border/30 font-mono">
                      {inspectingUser.portfolio.holdings.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-zinc-500 font-sans">No active holdings.</td></tr>
                      ) : (
                        inspectingUser.portfolio.holdings.map((h: any) => (
                          <tr key={h.ticker}>
                            <td className="p-2 font-bold text-zinc-200">{h.ticker}</td>
                            <td className="p-2 text-right">{formatNumber(h.shares)}</td>
                            <td className="p-2 text-right">Rs. {h.averageBuyPrice.toFixed(2)}</td>
                            <td className="p-2 text-right">Rs. {h.currentPrice.toFixed(2)}</td>
                            <td className={`p-2 text-right font-bold ${h.unrealizedPnL >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
                              {formatLKR(h.unrealizedPnL)} ({formatPercent(h.unrealizedPnLPercent)})
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Orders History */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 uppercase mb-2">Recent Orders & Queue</h4>
                <div className="bg-fintech-panel border border-fintech-border rounded overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080C14] text-zinc-400 text-[11px] border-b border-fintech-border">
                      <tr>
                        <th className="p-2">Ticker</th>
                        <th className="p-2">Side</th>
                        <th className="p-2">Type</th>
                        <th className="p-2 text-right">Shares</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fintech-border/30 font-mono">
                      {inspectingUser.orders.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-zinc-500 font-sans">No orders on record.</td></tr>
                      ) : (
                        inspectingUser.orders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="p-2 font-bold text-zinc-200">{o.ticker}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                o.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {o.side}
                              </span>
                            </td>
                            <td className="p-2 text-zinc-300">{o.orderType}</td>
                            <td className="p-2 text-right">{formatNumber(o.shares)}</td>
                            <td className="p-2 text-right">{formatLKR(o.totalCost)}</td>
                            <td className="p-2 text-center">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Immutable Trade Ledger */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 uppercase mb-2">Executed Trades Ledger (1.12% CSE Fees)</h4>
                <div className="bg-fintech-panel border border-fintech-border rounded overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080C14] text-zinc-400 text-[11px] border-b border-fintech-border">
                      <tr>
                        <th className="p-2">Ticker</th>
                        <th className="p-2">Side</th>
                        <th className="p-2 text-right">Shares</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">1.12% Fee</th>
                        <th className="p-2 text-right">Net Settle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fintech-border/30 font-mono">
                      {inspectingUser.trades.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-zinc-500 font-sans">No completed trades yet.</td></tr>
                      ) : (
                        inspectingUser.trades.map((t: any) => (
                          <tr key={t.id}>
                            <td className="p-2 font-bold text-zinc-200">{t.ticker}</td>
                            <td className="p-2 font-bold">{t.side}</td>
                            <td className="p-2 text-right">{formatNumber(t.shares)}</td>
                            <td className="p-2 text-right">Rs. {t.executedPrice.toFixed(2)}</td>
                            <td className="p-2 text-right text-amber-400">Rs. {t.feeAmount.toFixed(2)}</td>
                            <td className="p-2 text-right font-bold text-zinc-100">{formatLKR(t.netAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Reset Notification Toast */}
      {resetNotification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900/95 backdrop-blur-md border border-emerald-500/50 rounded-xl shadow-2xl flex items-center space-x-3 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <div>
            <div className="font-semibold text-zinc-100">
              {resetNotification.type === 'PWD' ? 'Password Reset Successful' : 'Security PIN Reset Successful'}
            </div>
            <div className="text-zinc-400 mt-0.5">
              Trader: <span className="text-zinc-200 font-mono font-bold">{resetNotification.username}</span> • Default {resetNotification.type === 'PWD' ? 'Password' : 'PIN'}:{' '}
              <span className="text-emerald-400 font-mono font-bold bg-zinc-800 px-1.5 py-0.5 rounded ml-1 border border-zinc-700">
                {resetNotification.value}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(resetNotification.value);
              setResetNotification({ ...resetNotification, copied: true });
              setTimeout(() => setResetNotification(null), 3000);
            }}
            className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-1 transition-colors ml-2 shadow-sm"
          >
            {resetNotification.copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{resetNotification.copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={() => setResetNotification(null)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Trader Confirmation Modal */}
      {deletingTrader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-fintech-card border border-red-500/40 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-red-500/20 bg-red-950/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center space-x-2">
                    <span>Permanently Delete Trader</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      DANGER
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Irreversible exchange account removal</p>
                </div>
              </div>
              <button
                onClick={() => { setDeletingTrader(null); setDeleteError(null); setAdminPin(''); }}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Warning Callout */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-3.5 flex items-start space-x-3 text-red-300 text-xs">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-200">Permanent Hard Delete Warning</div>
                  <div className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    You are about to permanently delete <strong className="text-white font-mono">{deletingTrader.username}</strong> (<span className="text-zinc-400">{deletingTrader.email}</span>). All wallet cash, stock portfolios, open limit orders, trade history, and tournament entries will be permanently wiped.
                  </div>
                </div>
              </div>

              {/* Position Audit Breakdown */}
              <div className="bg-[#0D131F] border border-fintech-border rounded-lg p-3.5 space-y-2.5 font-mono">
                <div className="text-[10px] uppercase font-sans font-bold text-zinc-400 tracking-wider flex items-center justify-between">
                  <span>Positions & Assets Audit</span>
                  <span className="text-zinc-500">CDS: {deletingTrader.username.toUpperCase()}-CDS</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-fintech-panel/70 p-2.5 rounded border border-fintech-border/40">
                    <div className="text-[10px] text-zinc-500 font-sans">Available Cash</div>
                    <div className="font-bold text-zinc-200 mt-0.5">{formatLKR(deletingTrader.availableCash)}</div>
                  </div>
                  <div className="bg-fintech-panel/70 p-2.5 rounded border border-fintech-border/40">
                    <div className="text-[10px] text-zinc-500 font-sans">Stock Valuation</div>
                    <div className="font-bold text-zinc-200 mt-0.5">{formatLKR(deletingTrader.stockValue)}</div>
                  </div>
                  <div className="bg-fintech-panel/70 p-2.5 rounded border border-fintech-border/40">
                    <div className="text-[10px] text-zinc-500 font-sans">Total Net Equity</div>
                    <div className="font-bold text-amber-400 mt-0.5">{formatLKR(deletingTrader.totalPortfolioValue)}</div>
                  </div>
                  <div className="bg-fintech-panel/70 p-2.5 rounded border border-fintech-border/40">
                    <div className="text-[10px] text-zinc-500 font-sans">Total Executed Trades</div>
                    <div className="font-bold text-blue-400 mt-0.5">{deletingTrader.tradeCount} trades</div>
                  </div>
                </div>
              </div>

              {/* Error banner */}
              {deleteError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-xs text-red-300 font-mono">
                  ⚠️ {deleteError}
                </div>
              )}

              {/* PIN Input & Form */}
              <form onSubmit={handleConfirmDelete} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Admin Security PIN Authorization
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-2">
                    Enter your 4-digit Exchange Administrator PIN to authorize this purge:
                  </p>
                  <div className="relative max-w-xs">
                    <input
                      type="password"
                      maxLength={4}
                      autoFocus
                      placeholder="• • • •"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0B0F17] border border-fintech-border focus:border-red-500 rounded-lg py-2 px-3 text-center text-lg tracking-[0.4em] font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-3 border-t border-fintech-border flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">⚡ Powered by Aravinda™</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => { setDeletingTrader(null); setDeleteError(null); setAdminPin(''); }}
                      className="px-3 py-1.5 rounded-lg border border-fintech-border text-xs text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adminPin.length !== 4 || isDeleting}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        adminPin.length === 4 && !isDeleting
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 cursor-pointer'
                          : 'bg-red-950/40 text-zinc-500 border border-red-900/40 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Purging Trader...' : 'Permanently Delete'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Toast */}
      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900/95 backdrop-blur-md border border-red-500/40 rounded-xl shadow-2xl flex items-center space-x-3 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-zinc-100">Trader Purged</div>
            <div className="text-zinc-400 mt-0.5">{deleteSuccessToast}</div>
          </div>
          <button
            onClick={() => setDeleteSuccessToast(null)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-fintech-card border border-fintech-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-fintech-border bg-[#0D131F] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-zinc-100">Launch Trading Tournament</h3>
              </div>
              <button
                onClick={() => setShowCreateTournament(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-fintech-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingTournament(true);
                try {
                  await api.post('/leaderboard/tournaments', newTournament);
                  alert('Tournament launched successfully!');
                  setShowCreateTournament(false);
                  setNewTournament({ title: '', description: '', category: 'CUSTOM', startDate: '', endDate: '', prizeDetails: '' });
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Failed to create tournament');
                } finally {
                  setIsSubmittingTournament(false);
                }
              }}
              className="p-4 space-y-3.5 text-xs font-sans"
            >
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Tournament Title *</label>
                <input
                  type="text"
                  placeholder="e.g. October Colombo Bull Challenge"
                  value={newTournament.title}
                  onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })}
                  className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description</label>
                <textarea
                  placeholder="Rules, participation criteria, and challenge summary..."
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 h-20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={newTournament.startDate}
                    onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                    className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    value={newTournament.endDate}
                    onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                    className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Prize / Award Details</label>
                <input
                  type="text"
                  placeholder="e.g. 🥇 Gold Podium Trophy • Official Certificate"
                  value={newTournament.prizeDetails}
                  onChange={(e) => setNewTournament({ ...newTournament, prizeDetails: e.target.value })}
                  className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTournament(false)}
                  className="px-4 py-2 rounded-lg bg-fintech-panel border border-fintech-border text-zinc-300 hover:bg-fintech-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTournament}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors shadow-lg shadow-amber-950/40"
                >
                  {isSubmittingTournament ? 'Publishing...' : 'Publish Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Administrator Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-fintech-card border border-purple-500/40 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-purple-500/20 bg-[#0D111D] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center space-x-1.5">
                    <span>Provision Administrator</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      PRIVILEGED
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Create new staff account with exchange privileges</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateAdminModal(false);
                  setCreateAdminError(null);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-fintech-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="p-5 space-y-3.5 text-xs">
              {createAdminError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-xs text-red-300 font-mono">
                  ⚠️ {createAdminError}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Administrator Username *</label>
                <input
                  type="text"
                  placeholder="e.g. admin_colombo"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs font-mono"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Official Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. admin@cse.lk"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs"
                  required
                />
              </div>

              {/* Temporary Password & New Admin Security PIN */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 chars"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Admin PIN (4 Digits) *</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={adminForm.securityPin}
                    onChange={(e) => setAdminForm({ ...adminForm, securityPin: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-fintech-panel border border-fintech-border rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs font-mono tracking-widest text-center"
                    required
                  />
                </div>
              </div>

              {/* Admin Tier Role Selector */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Administrative Tier</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminForm({ ...adminForm, role: 'ADMIN' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                      adminForm.role === 'ADMIN'
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500 font-bold'
                        : 'bg-fintech-panel text-zinc-400 border-fintech-border'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Exchange Admin</span>
                  </button>

                  {user?.role === 'SUPER_ADMIN' ? (
                    <button
                      type="button"
                      onClick={() => setAdminForm({ ...adminForm, role: 'SUPER_ADMIN' })}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                        adminForm.role === 'SUPER_ADMIN'
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500 font-bold'
                          : 'bg-fintech-panel text-zinc-400 border-fintech-border'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="py-1.5 px-3 rounded-lg text-xs font-medium border bg-zinc-800/40 text-zinc-600 border-zinc-700/30 cursor-not-allowed flex items-center justify-center space-x-1"
                      title="Only Super Admins can create other Super Admins"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Super Admin</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Authorizing PIN Input */}
              <div className="pt-2 border-t border-fintech-border">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Your Security PIN (Authorization) *
                </label>
                <p className="text-[11px] text-zinc-500 mb-1.5">
                  Enter your current Administrator PIN to authorize this account creation:
                </p>
                <div className="relative max-w-xs">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="• • • •"
                    value={adminForm.authorizingPin}
                    onChange={(e) => setAdminForm({ ...adminForm, authorizingPin: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-[#0B0F17] border border-fintech-border focus:border-purple-500 rounded-lg py-2 px-3 text-center text-base tracking-[0.4em] font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                  <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-fintech-border flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-mono">⚡ Powered by Aravinda™</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateAdminModal(false);
                      setCreateAdminError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-fintech-panel border border-fintech-border text-zinc-300 hover:bg-fintech-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAdmin || adminForm.authorizingPin.length !== 4}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      adminForm.authorizingPin.length === 4 && !isCreatingAdmin
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 cursor-pointer'
                        : 'bg-purple-950/40 text-zinc-500 border border-purple-900/40 cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isCreatingAdmin ? 'Provisioning...' : 'Provision Admin'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Created Toast */}
      {adminCreatedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900/95 backdrop-blur-md border border-purple-500/50 rounded-xl shadow-2xl flex items-center space-x-3 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-zinc-100">Administrator Provisioned</div>
            <div className="text-zinc-400 mt-0.5">{adminCreatedToast}</div>
          </div>
          <button
            onClick={() => setAdminCreatedToast(null)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
