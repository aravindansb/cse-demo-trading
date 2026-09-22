'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, History, Trophy, FileText, Shield, Activity } from 'lucide-react';

export const BottomNav: React.FC<{ onOpenSecurity?: () => void }> = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isTerminal = pathname === '/terminal' || pathname === '/';
  const isOrders = pathname === '/orders';
  const isLeaderboard = pathname === '/leaderboard';
  const isReports = pathname === '/reports';
  const isAdmin = pathname === '/admin';
  const isSuperUser = pathname === '/superuser';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/95 backdrop-blur-md border-t border-fintech-border/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      <Link
        href="/terminal"
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
          isTerminal ? 'text-blue-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 mb-0.5 ${isTerminal ? 'text-blue-400' : 'text-zinc-400'}`} />
        <span>Terminal</span>
      </Link>

      <Link
        href="/orders"
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
          isOrders ? 'text-blue-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <History className={`w-5 h-5 mb-0.5 ${isOrders ? 'text-blue-400' : 'text-zinc-400'}`} />
        <span>Orders</span>
      </Link>

      <Link
        href="/leaderboard"
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
          isLeaderboard ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Trophy className={`w-5 h-5 mb-0.5 ${isLeaderboard ? 'text-amber-400' : 'text-zinc-400'}`} />
        <span>Ranks</span>
      </Link>

      <Link
        href="/reports"
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
          isReports ? 'text-blue-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <FileText className={`w-5 h-5 mb-0.5 ${isReports ? 'text-blue-400' : 'text-zinc-400'}`} />
        <span>Reports</span>
      </Link>

      {user?.role === 'SUPER_ADMIN' ? (
        <Link
          href="/superuser"
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
            isSuperUser ? 'text-purple-400 font-bold' : 'text-purple-400/70 hover:text-purple-300'
          }`}
        >
          <Activity className={`w-5 h-5 mb-0.5 ${isSuperUser ? 'text-purple-400 animate-pulse' : 'text-purple-400/70'}`} />
          <span>Command</span>
        </Link>
      ) : user?.role === 'ADMIN' ? (
        <Link
          href="/admin"
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
            isAdmin ? 'text-amber-400 font-bold' : 'text-amber-400/70 hover:text-amber-300'
          }`}
        >
          <Shield className={`w-5 h-5 mb-0.5 ${isAdmin ? 'text-amber-400' : 'text-amber-400/70'}`} />
          <span>Admin</span>
        </Link>
      ) : null}
    </div>
  );
};
