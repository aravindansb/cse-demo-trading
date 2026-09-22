'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/SocketContext';
import { formatPercent, formatLKR } from '../lib/utils';
import { 
  TrendingUp, 
  Clock, 
  Shield, 
  LayoutDashboard, 
  History, 
  LogOut, 
  User as UserIcon, 
  RefreshCw,
  CheckCircle2,
  FileText,
  Trophy,
  Activity,
  KeyRound
} from 'lucide-react';
import { UserSecurityModal } from './UserSecurityModal';

export const Navbar: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { indices, marketStatus, syncCseData, isSyncingCse } = useMarket();
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  return (
    <header className="border-b border-fintech-border bg-fintech-card sticky top-0 z-40">
      {/* Top Bar: Official CSE Indices & Live SLT Clock */}
      <div className="px-4 py-1.5 bg-[#080C14] border-b border-fintech-border/50 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center space-x-6 overflow-x-auto py-0.5">
          <div className="flex items-center space-x-1.5 text-zinc-300 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-zinc-100 uppercase tracking-wider text-[11px]">CSE LIVE FEED</span>
          </div>

          {indices.map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div key={idx.name} className="flex items-center space-x-2 font-mono">
                <span className="text-zinc-400 font-sans font-medium">{idx.name}:</span>
                <span className="font-bold text-zinc-100">{idx.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className={`flex items-center font-semibold text-xs ${isPos ? 'text-fintech-green' : 'text-fintech-red'}`}>
                  {isPos ? `+${idx.change.toFixed(2)}` : idx.change.toFixed(2)} ({formatPercent(idx.changePercent)})
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center space-x-3 text-zinc-400">
          {/* Direct CSE Sync Button */}
          <button
            onClick={syncCseData}
            disabled={isSyncingCse}
            className="px-2 py-0.5 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center space-x-1 text-[11px] font-sans font-medium transition-colors"
            title="Fetch latest official trades & indices directly from CSE API"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingCse ? 'animate-spin' : ''}`} />
            <span>{isSyncingCse ? 'Syncing...' : 'Sync CSE Live'}</span>
          </button>

          <div className="flex items-center space-x-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{marketStatus?.formattedTime || 'Loading SLT...'}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">Status:</span>
            {marketStatus?.isOpen ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MARKET OPEN
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                MARKET CLOSED (QUEUING)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/terminal" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-100 tracking-wide flex items-center space-x-2">
                <span>COLOMBO STOCK EXCHANGE</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  DEMO TRADING
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center space-x-1.5">
                <span>All 285 Listed Equities • Real-Time CSE Feeds</span>
                <span className="hidden sm:inline text-zinc-600">•</span>
                <span className="hidden sm:inline text-cyan-400 font-medium">Powered by Aravinda™</span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/terminal"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                pathname === '/terminal' || pathname === '/'
                  ? 'bg-fintech-panel text-blue-400 border border-fintech-border'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Trading Terminal</span>
            </Link>

            <Link
              href="/orders"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                pathname === '/orders'
                  ? 'bg-fintech-panel text-blue-400 border border-fintech-border'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Orders & Trades</span>
            </Link>

            <Link
              href="/leaderboard"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                pathname === '/leaderboard'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Leaderboard</span>
            </Link>

            <Link
              href="/reports"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                pathname === '/reports'
                  ? 'bg-fintech-panel text-blue-400 border border-fintech-border'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports & Statements</span>
            </Link>

            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  pathname === '/admin'
                    ? 'bg-fintech-panel text-amber-400 border border-amber-500/30'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            )}

            {user?.role === 'SUPER_ADMIN' && (
              <Link
                href="/superuser"
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  pathname === '/superuser'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-950/40'
                    : 'text-purple-400 hover:text-purple-200 hover:bg-purple-500/10 border border-purple-500/30'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Command Center ⚡</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: User Profile / Auth State */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-zinc-200 flex items-center justify-end space-x-1.5">
                  <span>{user.username}</span>
                  {user.role === 'SUPER_ADMIN' ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/40">
                      SUPER ADMIN
                    </span>
                  ) : user.role === 'ADMIN' ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30">
                      ADMIN
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] font-mono text-emerald-400">
                  {formatLKR(user.balance)}
                </div>
              </div>

              {/* Change Password & PIN Security Settings */}
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                title="Change Password & Security PIN"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Authenticated Change Password & PIN Modal */}
      <UserSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </header>
  );
};
