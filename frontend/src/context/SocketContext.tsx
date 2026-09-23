'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api, { getSocketUrl } from '../lib/api';
import { useAuth } from './AuthContext';

export interface MarketTicker {
  symbol: string;
  name: string;
  sector: string;
  lastTradedPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
  updatedAt: string;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MarketStatus {
  isOpen: boolean;
  reason: string;
  isOverridden: boolean;
  overrideStatus?: string;
  sltTime: string;
  formattedTime: string;
  nextSessionText: string;
}

interface SocketContextType {
  socket: Socket | null;
  tickers: MarketTicker[];
  indices: MarketIndex[];
  selectedTicker: MarketTicker | null;
  setSelectedTicker: (ticker: MarketTicker) => void;
  marketStatus: MarketStatus | null;
  tickFlashes: Record<string, 'up' | 'down'>;
  isSyncingCse: boolean;
  refreshMarketStatus: () => Promise<void>;
  simulateTick: () => Promise<void>;
  syncCseData: () => Promise<void>;
  toggleMarketSessionOverride: (isOpen: boolean, isOverrideActive: boolean) => Promise<void>;
  lastExecutionNotification: string | null;
  clearNotification: () => void;
  orderRefreshTick: number;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<MarketTicker | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [tickFlashes, setTickFlashes] = useState<Record<string, 'up' | 'down'>>({});
  const [lastExecutionNotification, setLastExecutionNotification] = useState<string | null>(null);
  const [orderRefreshTick, setOrderRefreshTick] = useState<number>(0);
  const [isSyncingCse, setIsSyncingCse] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [tickersRes, indicesRes, statusRes] = await Promise.all([
        api.get('/market/tickers'),
        api.get('/market/indices'),
        api.get('/market/status'),
      ]);

      setTickers(tickersRes.data);
      if (tickersRes.data.length > 0 && !selectedTicker) {
        // Default to a blue-chip stock like JKH or COMB if present, else first
        const jkh = tickersRes.data.find((t: MarketTicker) => t.symbol === 'JKH.N0000') || tickersRes.data[0];
        setSelectedTicker(jkh);
      }
      setIndices(indicesRes.data);
      setMarketStatus(statusRes.data);
    } catch (err) {
      console.error('Error fetching initial market data:', err);
    }
  };

  const syncCseData = async () => {
    setIsSyncingCse(true);
    try {
      const res = await api.post('/market/sync-cse');
      if (res.data?.result) {
        if (res.data.result.aspi && res.data.result.spSl20) {
          setIndices([res.data.result.aspi, res.data.result.spSl20]);
        }
        const updatedTickers = await api.get('/market/tickers');
        setTickers(updatedTickers.data);
      }
    } catch (err) {
      console.error('Failed to sync CSE live data:', err);
    } finally {
      setIsSyncingCse(false);
    }
  };

  const refreshMarketStatus = async () => {
    try {
      const res = await api.get('/market/status');
      setMarketStatus(res.data);
    } catch (err) {
      console.error('Failed to refresh market status:', err);
    }
  };

  const simulateTick = async () => {
    try {
      await api.post('/market/simulate-tick');
    } catch (err) {
      console.error('Failed to simulate tick:', err);
    }
  };

  const toggleMarketSessionOverride = async (isOpen: boolean, isOverrideActive: boolean) => {
    try {
      await api.post('/market/override-session', { isOpen, isOverrideActive });
      await refreshMarketStatus();
    } catch (err) {
      console.error('Failed to override market session:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const socketUrl = getSocketUrl();
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    setSocket(s);

    if (user?.id) {
      s.emit('join-user-room', user.id);
    }

    s.on('market:ticks', (data: { tickers: MarketTicker[]; indices: MarketIndex[] }) => {
      if (data.tickers && Array.isArray(data.tickers)) {
        setTickers((prev) => {
          // If previous is empty or incoming is the full list (>= 200 stocks), replace directly
          if (prev.length === 0 || data.tickers.length >= 200) {
            return data.tickers;
          }

          // Otherwise, merge delta tickers into existing 285 tickers (saves 98% bandwidth!)
          const flashes: Record<string, 'up' | 'down'> = {};
          const indexMap = new Map<string, number>();
          prev.forEach((t, i) => indexMap.set(t.symbol, i));

          const next = [...prev];

          for (const newT of data.tickers) {
            const existingIdx = indexMap.get(newT.symbol);
            if (existingIdx !== undefined) {
              const oldPrice = next[existingIdx].lastTradedPrice;
              if (oldPrice !== undefined && oldPrice !== newT.lastTradedPrice) {
                flashes[newT.symbol] = newT.lastTradedPrice > oldPrice ? 'up' : 'down';
              }
              next[existingIdx] = newT;
            } else {
              next.push(newT);
            }
          }

          if (Object.keys(flashes).length > 0) {
            setTickFlashes((f) => ({ ...f, ...flashes }));
            setTimeout(() => {
              setTickFlashes((f) => {
                const copy = { ...f };
                for (const k in flashes) {
                  delete copy[k];
                }
                return copy;
              });
            }, 1000);
          }

          // Also update currently selected ticker if its price changed
          setSelectedTicker((cur) => {
            if (!cur) return cur;
            const updated = data.tickers.find((t) => t.symbol === cur.symbol);
            return updated || cur;
          });

          return next;
        });
      }

      if (data.indices) {
        setIndices(data.indices);
      }
    });

    s.on('market:session', (status: MarketStatus) => {
      setMarketStatus(status);
    });

    s.on('order:executed', (data: { order: any; message: string }) => {
      setLastExecutionNotification(data.message);
      setOrderRefreshTick((prev) => prev + 1);
    });

    s.on('order:activated', (data: { order: any; message: string }) => {
      setLastExecutionNotification(data.message);
      setOrderRefreshTick((prev) => prev + 1);
    });

    s.on('market:orders-updated', () => {
      setOrderRefreshTick((prev) => prev + 1);
    });

    // Inactivity / Tab Visibility listener: When student returns to tab, refresh fresh snapshot
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInitialData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      s.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        tickers,
        indices,
        selectedTicker,
        setSelectedTicker,
        marketStatus,
        tickFlashes,
        isSyncingCse,
        refreshMarketStatus,
        simulateTick,
        syncCseData,
        toggleMarketSessionOverride,
        lastExecutionNotification,
        clearNotification: () => setLastExecutionNotification(null),
        orderRefreshTick,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useMarket must be used within a SocketProvider');
  }
  return context;
};
