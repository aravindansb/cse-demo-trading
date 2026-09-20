'use client';

import React from 'react';
import { formatLKR, formatPercent } from '../../lib/utils';
import { exportToCsv, triggerPrintReport } from '../../lib/exportUtils';
import { Printer, Download, TrendingUp, TrendingDown, Percent, Award, AlertCircle } from 'lucide-react';

interface CapitalGainsViewProps {
  data: any;
  loading: boolean;
}

export const CapitalGainsView: React.FC<CapitalGainsViewProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 font-mono text-sm animate-pulse">
        Calculating Capital Gains, Realized P&L, and Tax Basis...
      </div>
    );
  }

  if (!data || !data.summary || !Array.isArray(data.closedPositions) || !Array.isArray(data.openPositions)) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-sm">
        No capital gains data available for the selected period.
      </div>
    );
  }

  const { summary, closedPositions, openPositions, cdsAccountNumber, clientName } = data;

  const handleExportCsv = () => {
    const csvRows = [
      ...closedPositions.map((c: any) => ({
        'Type': 'REALIZED_GAIN_LOSS',
        'Date': c.date,
        'Symbol': c.ticker,
        'Company Name': c.companyName,
        'Sector': c.sector,
        'Shares': c.shares,
        'Avg Cost (LKR)': c.avgBuyPrice,
        'Cost Basis (LKR)': c.costBasis,
        'Sell Price (LKR)': c.sellPrice,
        'Gross Proceeds (LKR)': c.grossProceeds,
        'Fee Paid (LKR)': c.feePaid,
        'Net Proceeds (LKR)': c.netProceeds,
        'Net Realized P&L (LKR)': c.netPnL,
        'P&L (%)': c.pnlPercent
      })),
      ...openPositions.map((o: any) => ({
        'Type': 'UNREALIZED_OPEN_POSITION',
        'Date': new Date().toISOString(),
        'Symbol': o.ticker,
        'Company Name': o.companyName,
        'Sector': o.sector,
        'Shares': o.shares,
        'Avg Cost (LKR)': o.avgBuyPrice,
        'Cost Basis (LKR)': o.costBasis,
        'Market Price (LKR)': o.marketPrice,
        'Gross Proceeds (LKR)': o.currentValuation,
        'Fee Paid (LKR)': 0,
        'Net Proceeds (LKR)': o.currentValuation,
        'Net Realized P&L (LKR)': o.unrealizedPnL,
        'P&L (%)': o.unrealizedPnLPercent
      }))
    ];

    exportToCsv(`Capital_Gains_Statement_${cdsAccountNumber}_${new Date().toISOString().slice(0, 10)}`, csvRows);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <div className="text-xs text-zinc-400 font-mono">
          Account: <span className="text-zinc-200 font-bold">{clientName}</span> ({cdsAccountNumber})
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Net Realized P&L</span>
          <div className={`text-lg font-bold mt-1 ${summary.netRealizedPnL >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
            {summary.netRealizedPnL >= 0 ? '+' : ''}{formatLKR(summary.netRealizedPnL)}
          </div>
          <span className="text-[11px] text-zinc-400">Closed Positions Net of Fees</span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Win Rate</span>
          <div className="text-lg font-bold text-zinc-100 mt-1 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>{Number(summary?.winRate || 0).toFixed(1)}%</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            {summary?.winCount || 0} Wins / {summary?.lossCount || 0} Losses ({summary?.totalClosedTrades || 0} Trades)
          </span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Total Fees Paid (1.12%)</span>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {formatLKR(summary.totalFeesPaid)}
          </div>
          <span className="text-[11px] text-zinc-400">CSE Composite Transaction Levy</span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Unrealized Gains / Losses</span>
          <div className={`text-lg font-bold mt-1 ${summary.totalUnrealizedGain >= 0 ? 'text-fintech-green' : 'text-fintech-red'}`}>
            {summary.totalUnrealizedGain >= 0 ? '+' : ''}{formatLKR(summary.totalUnrealizedGain)}
          </div>
          <span className="text-[11px] text-zinc-400">Open Equity Positions ({openPositions.length})</span>
        </div>
      </div>

      {/* Section 1: Realized Capital Gains & Losses (Closed Positions) */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg overflow-hidden">
        <div className="bg-fintech-panel/80 px-4 py-3 border-b border-fintech-border flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xs text-zinc-100 tracking-wide uppercase flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Realized Capital Gains & Losses (Closed Positions)</span>
            </h3>
            <p className="text-[11px] text-zinc-400">Computed net of entry/exit fees on executed sell trades</p>
          </div>
          <span className="font-mono text-xs font-bold text-zinc-300">
            {closedPositions.length} Closed Trades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-fintech-panel/40 text-zinc-400 font-semibold border-b border-fintech-border text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Security</th>
                <th className="py-2 px-3 text-right font-mono">Shares</th>
                <th className="py-2 px-3 text-right font-mono">Avg Cost (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Cost Basis (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Sell Price (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Net Proceeds (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Net Gain / Loss (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Return (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/50">
              {closedPositions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-mono">
                    No closed stock sales or realized gains recorded yet.
                  </td>
                </tr>
              ) : (
                closedPositions.map((c: any) => (
                  <tr key={c.id} className="hover:bg-fintech-hover/50 transition-colors font-mono">
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                      {new Date(c.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-bold text-zinc-100">{c.ticker}</span>
                      <span className="block text-[11px] text-zinc-400 truncate max-w-[130px]">{c.companyName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {(c.shares ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {Number(c.avgBuyPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {formatLKR(c.costBasis || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {Number(c.sellPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-zinc-200">
                      {formatLKR(c.netProceeds || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={c.isProfit ? 'text-fintech-green' : 'text-fintech-red'}>
                        {c.isProfit ? '+' : ''}{formatLKR(c.netPnL || 0)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      <span className={c.isProfit ? 'text-fintech-green' : 'text-fintech-red'}>
                        {formatPercent(c.pnlPercent)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Unrealized Capital Gains (Open Positions) */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg overflow-hidden">
        <div className="bg-fintech-panel/80 px-4 py-3 border-b border-fintech-border flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xs text-zinc-100 tracking-wide uppercase flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4 text-blue-400" />
              <span>Unrealized Capital Gains & Losses (Open Positions)</span>
            </h3>
            <p className="text-[11px] text-zinc-400">Mark-to-market valuation based on latest CSE trade prices</p>
          </div>
          <span className="font-mono text-xs font-bold text-zinc-300">
            {openPositions.length} Open Positions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-fintech-panel/40 text-zinc-400 font-semibold border-b border-fintech-border text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3">Security</th>
                <th className="py-2 px-3">Sector</th>
                <th className="py-2 px-3 text-right font-mono">Shares</th>
                <th className="py-2 px-3 text-right font-mono">Avg Cost (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Cost Basis (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Market Price (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Market Value (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Unrealized P&L (LKR)</th>
                <th className="py-2 px-3 text-right font-mono">Gain / Loss (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/50">
              {openPositions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-mono">
                    No active stock holdings currently in portfolio.
                  </td>
                </tr>
              ) : (
                openPositions.map((o: any) => (
                  <tr key={o.ticker} className="hover:bg-fintech-hover/50 transition-colors font-mono">
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-bold text-zinc-100">{o.ticker}</span>
                      <span className="block text-[11px] text-zinc-400 truncate max-w-[130px]">{o.companyName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-zinc-400 text-[11px]">
                      {o.sector}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {(o.shares ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {Number(o.avgBuyPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {formatLKR(o.costBasis || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-100 font-medium">
                      {Number(o.marketPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-100">
                      {formatLKR(o.currentValuation || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={o.isProfit ? 'text-fintech-green' : 'text-fintech-red'}>
                        {o.isProfit ? '+' : ''}{formatLKR(o.unrealizedPnL || 0)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      <span className={o.isProfit ? 'text-fintech-green' : 'text-fintech-red'}>
                        {formatPercent(o.unrealizedPnLPercent)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
