'use client';

import React from 'react';
import { formatLKR, formatPercent } from '../../lib/utils';
import { exportToCsv, triggerPrintReport } from '../../lib/exportUtils';
import { Printer, Download, Landmark, ShieldCheck, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TrademarkBadge } from '../TrademarkBadge';

interface CdsStatementViewProps {
  data: any;
  loading: boolean;
}

export const CdsStatementView: React.FC<CdsStatementViewProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 font-mono text-sm animate-pulse">
        Generating official CDS Account Statement...
      </div>
    );
  }

  if (!data || !data.statementInfo || !data.portfolioSummary || !Array.isArray(data.holdings)) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-sm">
        No statement data available for the selected period.
      </div>
    );
  }

  const { statementInfo, portfolioSummary, holdings } = data;

  const handleExportCsv = () => {
    const csvRows = holdings.map((h: any) => ({
      'CDS Account': statementInfo.cdsAccountNumber,
      'Symbol': h.symbol,
      'Company Name': h.name,
      'Sector': h.sector,
      'Opening Shares': h.openingShares,
      'Bought In Period': h.periodBought,
      'Sold In Period': h.periodSold,
      'Closing Shares': h.closingShares,
      'Available Shares': h.availableShares,
      'Locked Shares': h.lockedShares,
      'Avg Cost Price (LKR)': h.avgCostPrice,
      'Cost Basis (LKR)': h.costBasis,
      'Market Price (LKR)': h.marketPrice,
      'Valuation (LKR)': h.valuation,
      'Unrealized P&L (LKR)': h.unrealizedPnL,
      'Unrealized P&L (%)': h.unrealizedPnLPercent
    }));

    exportToCsv(`CDS_Statement_${statementInfo.cdsAccountNumber}_${statementInfo.statementPeriod.to}`, csvRows);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Buttons */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Central Depository Systems Statement</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={triggerPrintReport}
            className="px-3 py-1.5 rounded bg-fintech-panel hover:bg-fintech-hover border border-fintech-border text-xs text-zinc-200 flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Printable Statement Container */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg p-6 font-sans print:p-0 print:border-none print:bg-white print:text-black">
        {/* Statement Header */}
        <div className="border-b border-fintech-border pb-5 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 print:text-blue-900">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wide text-zinc-100 uppercase print:text-black">
                  CENTRAL DEPOSITORY SYSTEMS (PVT) LIMITED
                </h1>
                <p className="text-xs text-zinc-400 font-medium print:text-zinc-600">
                  Subsidiary of the Colombo Stock Exchange • Account Movement & Holdings Statement
                </p>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Member Firm: {statementInfo.broker.name} ({statementInfo.broker.cdsParticipantCode})
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs space-y-1">
              <div className="inline-block px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 font-bold print:border-black print:text-black">
                {statementInfo.cdsAccountNumber}
              </div>
              <div className="text-zinc-400 text-[11px] print:text-zinc-700">
                Ref: <span className="text-zinc-200 print:text-black">{statementInfo.statementNumber}</span>
              </div>
              <div className="text-zinc-400 text-[11px] print:text-zinc-700">
                Period: <span className="text-zinc-200 print:text-black">{statementInfo.statementPeriod.from}</span> to{' '}
                <span className="text-zinc-200 print:text-black">{statementInfo.statementPeriod.to}</span>
              </div>
            </div>
          </div>

          {/* Account Details Banner */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded bg-fintech-panel/60 border border-fintech-border/50 text-xs font-mono print:bg-zinc-100 print:border-zinc-300">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Account Holder</span>
              <span className="font-bold text-zinc-200 print:text-black">{statementInfo.accountHolderName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Registered Email</span>
              <span className="text-zinc-300 print:text-black">{statementInfo.email}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Clearing Cycle</span>
              <span className="text-emerald-400 font-bold print:text-black">T+2 Delivery Versus Payment (DVP)</span>
            </div>
          </div>
        </div>

        {/* Portfolio Valuation Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 font-mono">
          <div className="p-3 bg-fintech-panel border border-fintech-border rounded-lg print:border-zinc-300">
            <span className="text-[11px] text-zinc-500 uppercase block font-sans">Net Asset Value (NAV)</span>
            <div className="text-lg font-bold text-zinc-100 mt-1 print:text-black">
              {formatLKR(portfolioSummary.netAssetValue)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Return: <span className={portfolioSummary.totalReturn >= 0 ? 'text-fintech-green font-semibold' : 'text-fintech-red font-semibold'}>
                {portfolioSummary.totalReturn >= 0 ? '+' : ''}{formatLKR(portfolioSummary.totalReturn)} ({formatPercent(portfolioSummary.totalReturnPercent)})
              </span>
            </div>
          </div>

          <div className="p-3 bg-fintech-panel border border-fintech-border rounded-lg print:border-zinc-300">
            <span className="text-[11px] text-zinc-500 uppercase block font-sans">Equities Valuation</span>
            <div className="text-lg font-bold text-blue-400 mt-1 print:text-blue-900">
              {formatLKR(portfolioSummary.totalStockValuation)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Cost: {formatLKR(portfolioSummary.totalStockCost)}
            </div>
          </div>

          <div className="p-3 bg-fintech-panel border border-fintech-border rounded-lg print:border-zinc-300">
            <span className="text-[11px] text-zinc-500 uppercase block font-sans">Available Cash</span>
            <div className="text-lg font-bold text-emerald-400 mt-1 print:text-emerald-900">
              {formatLKR(portfolioSummary.availableCash)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Locked: {formatLKR(portfolioSummary.lockedCash)}
            </div>
          </div>

          <div className="p-3 bg-fintech-panel border border-fintech-border rounded-lg print:border-zinc-300">
            <span className="text-[11px] text-zinc-500 uppercase block font-sans">Unrealized P&L</span>
            <div className={`text-lg font-bold mt-1 ${portfolioSummary.totalUnrealizedGainLoss >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
              {portfolioSummary.totalUnrealizedGainLoss >= 0 ? '+' : ''}{formatLKR(portfolioSummary.totalUnrealizedGainLoss)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Active Holdings: {holdings.length}
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="overflow-x-auto border border-fintech-border rounded-lg print:border-zinc-400">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-fintech-panel/80 text-zinc-400 font-semibold border-b border-fintech-border text-[11px] uppercase tracking-wider print:bg-zinc-200 print:text-black">
                <th className="py-2.5 px-3">Security / Sector</th>
                <th className="py-2.5 px-3 text-right font-mono">Opening</th>
                <th className="py-2.5 px-3 text-right font-mono text-emerald-400">Bought (+)</th>
                <th className="py-2.5 px-3 text-right font-mono text-rose-400">Sold (-)</th>
                <th className="py-2.5 px-3 text-right font-mono">Closing</th>
                <th className="py-2.5 px-3 text-right font-mono">Avg Price</th>
                <th className="py-2.5 px-3 text-right font-mono">Market Price</th>
                <th className="py-2.5 px-3 text-right font-mono">Market Valuation</th>
                <th className="py-2.5 px-3 text-right font-mono">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/50 print:divide-zinc-300">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-mono">
                    No share transactions or open holdings recorded in this period.
                  </td>
                </tr>
              ) : (
                holdings.map((h: any) => {
                  const isProfit = h.unrealizedPnL >= 0;
                  return (
                    <tr key={h.symbol} className="hover:bg-fintech-hover/50 transition-colors font-mono">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-zinc-100 flex items-center space-x-1.5 print:text-black">
                          <span>{h.symbol}</span>
                          <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 print:border print:border-zinc-300">
                            {h.sector}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs print:text-zinc-600">
                          {h.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-400">
                        {(h.openingShares ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                        {(h.periodBought ?? 0) > 0 ? `+${(h.periodBought ?? 0).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                        {(h.periodSold ?? 0) > 0 ? `-${(h.periodSold ?? 0).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-100 font-bold print:text-black">
                        {(h.closingShares ?? 0).toLocaleString()}
                        {(h.lockedShares ?? 0) > 0 && (
                          <span className="block text-[10px] text-amber-400 font-normal">
                            ({h.lockedShares} locked)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-300">
                        {Number(h.avgCostPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-100 font-medium print:text-black">
                        {Number(h.marketPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-100 print:text-black">
                        {formatLKR(h.valuation || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        <span className={isProfit ? 'text-fintech-green font-semibold' : 'text-fintech-red font-semibold'}>
                          {isProfit ? '+' : ''}{formatLKR(h.unrealizedPnL)}
                        </span>
                        <span className="block text-[10px] text-zinc-400">
                          ({formatPercent(h.unrealizedPnLPercent)})
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {holdings.length > 0 && (
              <tfoot>
                <tr className="bg-fintech-panel font-mono font-bold text-xs border-t-2 border-fintech-border print:bg-zinc-200 print:text-black">
                  <td colSpan={7} className="py-2.5 px-3 uppercase text-zinc-300 font-sans print:text-black">
                    Total Equities Valuation
                  </td>
                  <td className="py-2.5 px-3 text-right text-blue-400 print:text-blue-900">
                    {formatLKR(portfolioSummary.totalStockValuation)}
                  </td>
                  <td className={`py-2.5 px-3 text-right ${portfolioSummary.totalUnrealizedGainLoss >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
                    {portfolioSummary.totalUnrealizedGainLoss >= 0 ? '+' : ''}{formatLKR(portfolioSummary.totalUnrealizedGainLoss)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer Notes & Statutory Disclaimer */}
        <div className="mt-6 pt-4 border-t border-fintech-border/50 text-[11px] text-zinc-500 space-y-1.5 font-sans print:text-zinc-600">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <p className="font-semibold text-zinc-400 print:text-black">
              Notes & Central Depository Regulations:
            </p>
            <TrademarkBadge size="xs" />
          </div>
          <p>
            1. Securities balances shown above reflect depository records as of the stated date. Valuation is computed on closing trade prices reported by the Colombo Stock Exchange.
          </p>
          <p>
            2. Equities transactions are settled under the Central Depository Systems T+2 settlement cycle.
          </p>
          <p>
            3. This document is an official certified statement issued on the Colombo Stock Exchange Demo Stock Trading System • Powered by Aravinda™ ATS Engine.
          </p>
        </div>
      </div>
    </div>
  );
};
