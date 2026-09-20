'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface TrademarkBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const TrademarkBadge: React.FC<TrademarkBadgeProps> = ({
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] space-x-1',
    sm: 'px-2.5 py-1 text-[11px] space-x-1.5',
    md: 'px-3.5 py-1.5 text-xs space-x-2'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-sans font-medium tracking-wide bg-gradient-to-r from-blue-950/80 via-[#0B1222] to-indigo-950/80 border border-blue-500/30 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)] select-none ${sizeClasses[size]} ${className}`}
      title="Colombo Stock Exchange Automated Trading System — Powered by Aravinda™"
    >
      <span className="relative flex items-center justify-center">
        <Zap className={`${iconSizes[size]} text-cyan-400 fill-cyan-400/30 animate-pulse`} />
      </span>
      <span className="font-semibold text-zinc-200">
        Powered by <span className="text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Aravinda™</span>
      </span>
    </div>
  );
};
