'use client';

import React, { useState } from 'react';
import { formatLKR } from '../../lib/utils';
import { exportToCsv, triggerPrintReport } from '../../lib/exportUtils';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt
} from 'lucide-react';
import { TrademarkBadge } from '../TrademarkBadge';

interface ContractNotesViewProps {
  data: any;
  loading: boolean;
}

export const ContractNotesView: React.FC<ContractNotesViewProps> = ({ data, loading }) => {
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [sideFilter, setSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 font-mono text-sm animate-pulse">
        Fetching Broker Bought/Sold Contract Notes...
      </div>
    );
  }

  if (!data || !data.contractNotes || !data.summary || !Array.isArray(data.contractNotes)) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-sm">
        No contract notes found for the selected criteria.
      </div>
    );
  }

  const { summary, contractNotes } = data;

  const filteredNotes = contractNotes.filter((n: any) => {
    if (sideFilter === 'ALL') return true;
    return n.side === sideFilter;
  });

  const handleExportCsv = () => {
    const csvRows = filteredNotes.map((n: any) => ({
      'Contract Note No': n.contractNoteNo,
      'Trade Date': n.tradeDate,
      'Settlement Date': n.settlementDate,
      'CDS Account': n.cdsAccountNumber,
      'Client Name': n.clientName,
      'Symbol': n.ticker,
      'Company Name': n.companyName,
      'Side': n.side,
      'Quantity': n.shares,
      'Price (LKR)': n.executedPrice,
      'Gross Amount (LKR)': n.grossAmount,
      'Brokerage (0.640%)': n.fees.breakdown.brokerage,
      'SEC Cess (0.072%)': n.fees.breakdown.secCess,
      'CDS Fee (0.024%)': n.fees.breakdown.cdsFee,
      'Share Levy (0.300%)': n.fees.breakdown.shareLevy,
      'Total Fees 1.12% (LKR)': n.fees.totalFee,
      'Net Consideration (LKR)': n.netAmount,
      'Settlement Status': n.status
    }));

    exportToCsv(`CSE_Contract_Notes_${new Date().toISOString().slice(0, 10)}`, csvRows);
  };

  return (
    <div className="space-y-4">
      {/* Top Metrics & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-zinc-500 mr-1.5 font-medium">Type:</span>
          {(['ALL', 'BUY', 'SELL'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                sideFilter === s
                  ? s === 'BUY'
                    ? 'bg-emerald-600 text-white'
                    : s === 'SELL'
                    ? 'bg-rose-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-fintech-panel hover:bg-fintech-hover text-zinc-300 border border-fintech-border'
              }`}
            >
              {s === 'ALL' ? 'All Notes' : s === 'BUY' ? 'Bought Notes' : 'Sold Notes'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Contract Notes CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Total Notes</span>
          <span className="text-lg font-bold text-zinc-100 mt-1 block">{summary.totalNotes}</span>
          <span className="text-[11px] text-zinc-400">Executed Transactions</span>
        </div>

        <div className="p-3 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Total Purchases (Gross)</span>
          <span className="text-lg font-bold text-emerald-400 mt-1 block">{formatLKR(summary.totalBoughtValue)}</span>
          <span className="text-[11px] text-zinc-400">Equities Acquired</span>
        </div>

        <div className="p-3 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Total Sales (Gross)</span>
          <span className="text-lg font-bold text-rose-400 mt-1 block">{formatLKR(summary.totalSoldValue)}</span>
          <span className="text-[11px] text-zinc-400">Equities Liquidated</span>
        </div>

        <div className="p-3 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Total CSE Fees (1.12%)</span>
          <span className="text-lg font-bold text-amber-400 mt-1 block">{formatLKR(summary.totalFeesPaid)}</span>
          <span className="text-[11px] text-zinc-400">Statutory & Brokerage Charges</span>
        </div>
      </div>

      {/* Contract Notes Table */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-fintech-panel/80 text-zinc-400 font-semibold border-b border-fintech-border text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Contract Note Ref</th>
                <th className="py-2.5 px-3">Date / T+2 Settlement</th>
                <th className="py-2.5 px-3">Security</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3 text-right font-mono">Shares</th>
                <th className="py-2.5 px-3 text-right font-mono">Price (LKR)</th>
                <th className="py-2.5 px-3 text-right font-mono">Gross (LKR)</th>
                <th className="py-2.5 px-3 text-right font-mono">1.12% Fees</th>
                <th className="py-2.5 px-3 text-right font-mono">Net Total (LKR)</th>
                <th className="py-2.5 px-3 text-center">Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/50">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500 font-mono">
                    No contract notes matching criteria.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((n: any) => {
                  const isBuy = n.side === 'BUY';
                  return (
                    <tr key={n.id} className="hover:bg-fintech-hover/50 transition-colors font-mono">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-blue-400">{n.contractNoteNo}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <div className="text-zinc-300 font-sans">{new Date(n.tradeDate).toLocaleDateString()}</div>
                        <div className="text-zinc-500">Settles: {n.settlementDate} (T+2)</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-zinc-100">{n.ticker}</span>
                        <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">{n.companyName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {n.sideLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-300">
                        {(n.shares ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-300">
                        {Number(n.executedPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-200">
                        {formatLKR(n.grossAmount || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400" title={`Broker: ${n.fees?.breakdown?.brokerage || 0}, SEC: ${n.fees?.breakdown?.secCess || 0}, CDS: ${n.fees?.breakdown?.cdsFee || 0}, Levy: ${n.fees?.breakdown?.shareLevy || 0}`}>
                        {formatLKR(n.fees?.totalFee || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-100">
                        {formatLKR(n.netAmount || 0)}
                        <span className="block text-[10px] text-zinc-500 font-normal">
                          {isBuy ? 'Payable' : 'Receivable'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <button
                          onClick={() => setSelectedNote(n)}
                          className="px-2 py-1 rounded bg-fintech-panel hover:bg-fintech-hover border border-fintech-border text-zinc-300 hover:text-white text-[11px] inline-flex items-center space-x-1 transition-colors"
                        >
                          <Receipt className="w-3 h-3 text-blue-400" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Note Modal Voucher */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-fintech-card border border-fintech-border rounded-xl max-w-2xl w-full p-6 shadow-2xl relative font-sans text-xs">
            {/* Close Button */}
            <button
              onClick={() => setSelectedNote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-fintech-panel text-zinc-400 hover:text-white border border-fintech-border transition-colors no-print"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Printable Voucher Content */}
            <div id="printable-voucher" className="space-y-4">
              {/* Header */}
              <div className="border-b border-fintech-border pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                        {selectedNote.broker.name}
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        {selectedNote.broker.memberOf} • Participant: {selectedNote.broker.cdsParticipantCode}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {selectedNote.broker.address} • Tel: {selectedNote.broker.telephone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-blue-400 font-mono">
                      CONTRACT NOTE
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      {selectedNote.contractNoteNo}
                    </div>
                    <div className="mt-1 flex justify-end">
                      <TrademarkBadge size="xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Client & Settlement Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-fintech-panel rounded border border-fintech-border font-mono text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Client Name / CDS Account</span>
                  <span className="font-bold text-zinc-100">{selectedNote.clientName}</span>
                  <div className="text-blue-400 font-semibold">{selectedNote.cdsAccountNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase block">Trade & Settlement Date</span>
                  <span className="text-zinc-200">{new Date(selectedNote.tradeDate).toLocaleString()}</span>
                  <div className="text-emerald-400 font-semibold">Settlement: {selectedNote.settlementDate} (T+2)</div>
                </div>
              </div>

              {/* Transaction Consideration Details */}
              <div className="border border-fintech-border rounded-lg overflow-hidden font-mono">
                <div className="bg-fintech-panel px-3 py-2 border-b border-fintech-border flex justify-between items-center text-xs">
                  <span className="font-sans font-bold text-zinc-200">
                    {selectedNote.side === 'BUY' ? 'BOUGHT ON ACCOUNT OF CLIENT' : 'SOLD ON ACCOUNT OF CLIENT'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedNote.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {selectedNote.side}
                  </span>
                </div>

                <div className="p-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-fintech-border/50">
                    <span className="text-zinc-400 font-sans">Security Description</span>
                    <span className="font-bold text-zinc-100">{selectedNote.ticker} — {selectedNote.companyName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-fintech-border/50">
                    <span className="text-zinc-400 font-sans">Quantity of Shares</span>
                    <span className="font-bold text-zinc-100">{selectedNote.shares.toLocaleString()} Shares</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-fintech-border/50">
                    <span className="text-zinc-400 font-sans">Execution Price per Share</span>
                    <span className="font-bold text-zinc-100">LKR {selectedNote.executedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-zinc-200 bg-fintech-panel/50 px-2 rounded">
                    <span className="font-sans">Gross Consideration</span>
                    <span>{formatLKR(selectedNote.grossAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Exact 4-Way 1.12% CSE Fee Breakdown */}
              <div className="border border-fintech-border rounded-lg p-3 bg-fintech-panel/40 font-mono text-xs">
                <div className="font-sans font-semibold text-zinc-300 mb-2 flex justify-between">
                  <span>Colombo Stock Exchange Composite Fee Breakdown (1.120%)</span>
                  <span className="text-amber-400 font-bold">{formatLKR(selectedNote.fees.totalFee)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>1. Brokerage Commission (0.640%):</span>
                    <span className="text-zinc-200">{formatLKR(selectedNote.fees.breakdown.brokerage)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>2. SEC Statutory Cess (0.072%):</span>
                    <span className="text-zinc-200">{formatLKR(selectedNote.fees.breakdown.secCess)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>3. CDS Clearance Fee (0.024%):</span>
                    <span className="text-zinc-200">{formatLKR(selectedNote.fees.breakdown.cdsFee)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>4. Share Transaction Levy (0.300%):</span>
                    <span className="text-zinc-200">{formatLKR(selectedNote.fees.breakdown.shareLevy)}</span>
                  </div>
                </div>
              </div>

              {/* Final Net Consideration */}
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg flex justify-between items-center font-mono">
                <div>
                  <span className="font-sans font-bold text-xs uppercase tracking-wide text-zinc-200 block">
                    {selectedNote.side === 'BUY' ? 'Net Amount Payable by Client' : 'Net Proceeds Receivable by Client'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    Due for settlement on or before {selectedNote.settlementDate}
                  </span>
                </div>
                <div className="text-lg font-extrabold text-blue-300">
                  {formatLKR(selectedNote.netAmount)}
                </div>
              </div>

              {/* Signatory & Stamp Section */}
              <div className="pt-3 border-t border-fintech-border/50 flex justify-between items-end text-[10px] text-zinc-500">
                <div>
                  <div className="text-zinc-400 font-semibold mb-1">Status: Electronic Confirmation</div>
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Validated under CSE ATS Engine • Powered by Aravinda™</span>
                  </div>
                </div>
                <div className="text-right border-t border-zinc-700 pt-1 w-44">
                  <span>Authorized Signatory</span>
                  <div className="font-mono text-zinc-400">Colombo Demo Stockbrokers</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex justify-end space-x-2 no-print border-t border-fintech-border pt-4">
              <button
                onClick={triggerPrintReport}
                className="px-4 py-2 rounded bg-fintech-panel hover:bg-fintech-hover border border-fintech-border text-zinc-200 flex items-center space-x-1.5 text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
