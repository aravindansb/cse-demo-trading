'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { MarketStatusBar } from './MarketStatusBar';
import { AuthModal } from './AuthModal';
import { BottomNav } from './BottomNav';
import { TrademarkBadge } from './TrademarkBadge';
import { useMarket } from '../context/SocketContext';
import { Bell, X } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { lastExecutionNotification, clearNotification } = useMarket();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />
      <MarketStatusBar />

      {/* Floating real-time execution toast */}
      {lastExecutionNotification && (
        <div className="fixed bottom-16 md:bottom-5 right-5 z-50 max-w-sm p-4 rounded-lg bg-[#0F172A] border border-blue-500/40 shadow-2xl flex items-start space-x-3 animate-in slide-in-from-bottom-4">
          <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-400 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-zinc-100">Trade Execution Alert</div>
            <p className="text-zinc-300 mt-0.5">{lastExecutionNotification}</p>
          </div>
          <button
            onClick={clearNotification}
            className="text-zinc-400 hover:text-zinc-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 p-4 pb-20 md:pb-4 max-w-[1600px] w-full mx-auto">
        {children}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <BottomNav />

      {/* Institutional System Footer */}
      <footer className="mt-auto border-t border-fintech-border/60 bg-[#080C14] px-4 py-4 text-xs font-sans text-zinc-500 no-print">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="font-medium text-zinc-400">
              Colombo Stock Exchange (CSE) Demo Stock Trading Platform
            </div>
            <span className="hidden md:inline text-zinc-700">•</span>
            <div className="hidden md:inline text-[11px] text-zinc-500">
              All 285 Listed Equities • Real-Time Automated Trading System (ATS)
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <TrademarkBadge size="sm" />
            <span className="text-[11px] text-zinc-600 font-mono">
              © {new Date().getFullYear()} Aravinda™. All Rights Reserved.
            </span>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};
