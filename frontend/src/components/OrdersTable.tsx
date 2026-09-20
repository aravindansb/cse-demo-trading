'use client';

import React, { useState, useEffect } from 'react';
import { formatLKR, formatNumber } from '../lib/utils';
import api from '../lib/api';
import { Clock, CheckCircle, XCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';

interface OrderItem {
  id: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  status: 'QUEUED' | 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  targetLimitPrice?: number;
  executedPrice?: number;
  shares: number;
  executedShares: number;
  feeAmount: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
  executedAt?: string;
}

interface TradeItem {
  id: string;
  orderId: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  shares: number;
  executedPrice: number;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  createdAt: string;
}

export const OrdersTable: React.FC<{ refreshTrigger?: number; onOrderCancelled?: () => void }> = ({
  refreshTrigger,
  onOrderCancelled,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ALL' | 'TRADES'>('ACTIVE');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, tradesRes] = await Promise.all([
        api.get('/orders'),
        api.get('/orders/trades'),
      ]);
      setOrders(ordersRes.data);
      setTrades(tradesRes.data);
    } catch (err) {
      console.error('Failed to load orders/trades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      await fetchData();
      if (onOrderCancelled) onOrderCancelled();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const activeOrders = orders.filter((o) => o.status === 'QUEUED' || o.status === 'PENDING');
  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders : orders;

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-lg flex flex-col overflow-hidden">
      {/* Header and Tabs */}
      <div className="p-3 border-b border-fintech-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'ACTIVE'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active & Queued ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'ALL'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Order History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('TRADES')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'TRADES'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Trade Ledger ({trades.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-fintech-hover transition-colors"
          title="Refresh table"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Orders View */}
      {activeTab !== 'TRADES' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0D131F] text-[11px] text-zinc-400 border-b border-fintech-border font-medium">
              <tr>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Shares</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Total (LKR)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/40 font-mono">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-sans">
                    {activeTab === 'ACTIVE'
                      ? 'No active or queued orders.'
                      : 'No orders recorded in account.'}
                  </td>
                </tr>
              ) : (
                displayedOrders.map((o) => {
                  return (
                    <tr key={o.id} className="hover:bg-fintech-hover/60 transition-colors">
                      <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <div className="text-[10px] text-zinc-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-zinc-200">
                        {o.ticker}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {o.side}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-zinc-300">
                        {o.orderType}
                      </td>

                      <td className="py-2.5 px-3 text-right text-zinc-200">
                        {formatNumber(o.shares)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-zinc-300">
                        {o.executedPrice ? `Rs. ${o.executedPrice.toFixed(2)}` : o.targetLimitPrice ? `Limit: Rs. ${o.targetLimitPrice.toFixed(2)}` : 'Market'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-zinc-200">
                        {formatLKR(o.totalCost)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {o.status === 'QUEUED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold" title={o.notes}>
                            QUEUED
                          </span>
                        )}
                        {o.status === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                            PENDING
                          </span>
                        )}
                        {o.status === 'EXECUTED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            EXECUTED
                          </span>
                        )}
                        {o.status === 'CANCELLED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {(o.status === 'QUEUED' || o.status === 'PENDING') ? (
                          <button
                            onClick={() => handleCancelOrder(o.id)}
                            disabled={cancellingId === o.id}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Cancel order and unlock funds/shares"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Completed Trades Ledger View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0D131F] text-[11px] text-zinc-400 border-b border-fintech-border font-medium">
              <tr>
                <th className="py-2.5 px-3">Trade Time</th>
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3 text-right">Shares</th>
                <th className="py-2.5 px-3 text-right">Executed Price</th>
                <th className="py-2.5 px-3 text-right">Gross Amount</th>
                <th className="py-2.5 px-3 text-right">CSE Fee (1.12%)</th>
                <th className="py-2.5 px-3 text-right">Net Settle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/40 font-mono">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 font-sans">
                    No executed trades recorded yet.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="hover:bg-fintech-hover/60 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <div className="text-[10px] text-zinc-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-zinc-200">
                      {t.ticker}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {t.side}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {formatNumber(t.shares)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      Rs. {t.executedPrice.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {formatLKR(t.grossAmount)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-amber-400 font-semibold">
                      Rs. {t.feeAmount.toFixed(2)}
                    </td>

                    <td className={`py-2.5 px-3 text-right font-bold ${
                      t.side === 'BUY' ? 'text-zinc-100' : 'text-fintech-green'
                    }`}>
                      {formatLKR(t.netAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
