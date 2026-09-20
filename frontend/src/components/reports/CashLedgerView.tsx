'use client';

import React from 'react';
import { formatLKR } from '../../lib/utils';
import { exportToCsv, triggerPrintReport } from '../../lib/exportUtils';
import { Printer, Download, Wallet, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';

interface CashLedgerViewProps {
  data: any;
  loading: boolean;
}

export const CashLedgerView: React.FC<CashLedgerViewProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 font-mono text-sm animate-pulse">
        Retrieving Cash Movement Ledger...
      </div>
    );
  }

  if (!data || !data.ledger || !data.wallet || !Array.isArray(data.ledger)) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-sm">
        No cash ledger entries found.
      </div>
    );
  }

  const { ledger, wallet, cdsAccountNumber, clientName } = data;

  const handleExportCsv = () => {
    const csvRows = ledger.map((e: any) => ({
      'Date': e.date,
      'Transaction Type': e.type,
      'Reference': e.reference,
      'Description': e.description,
      'Debit (LKR)': e.debit,
      'Credit (LKR)': e.credit,
      'Running Balance (LKR)': e.balance
    }));

    exportToCsv(`Cash_Ledger_${cdsAccountNumber}_${new Date().toISOString().slice(0, 10)}`, csvRows);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <div className="text-xs text-zinc-400 font-mono">
          Virtual Cash Account: <span className="text-zinc-200 font-bold">{clientName}</span> ({cdsAccountNumber})
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

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Total Wallet Cash</span>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {formatLKR(wallet?.currentBalance || 0)}
          </div>
          <span className="text-[11px] text-zinc-400">Total Cleared Liquid Funds</span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Available for Trading</span>
          <div className="text-lg font-bold text-zinc-100 mt-1">
            {formatLKR(wallet?.availableBalance || 0)}
          </div>
          <span className="text-[11px] text-zinc-400">Net of Active Order Locks</span>
        </div>

        <div className="p-3.5 bg-fintech-card border border-fintech-border rounded-lg">
          <span className="text-zinc-500 font-sans uppercase block text-[11px]">Locked for Pending Orders</span>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {formatLKR(wallet?.lockedBalance || 0)}
          </div>
          <span className="text-[11px] text-zinc-400">Queued & Limit Buy Orders</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-fintech-card border border-fintech-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-fintech-panel/80 text-zinc-400 font-semibold border-b border-fintech-border text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Transaction Description</th>
                <th className="py-2.5 px-3 text-right font-mono text-rose-400">Debit (LKR)</th>
                <th className="py-2.5 px-3 text-right font-mono text-emerald-400">Credit (LKR)</th>
                <th className="py-2.5 px-3 text-right font-mono">Running Balance (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/50 font-mono">
              {ledger.map((e: any, idx: number) => {
                const isDebit = e.debit > 0;
                const isCredit = e.credit > 0;

                return (
                  <tr key={idx} className="hover:bg-fintech-hover/50 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                      {new Date(e.date).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-blue-400 font-bold">
                      {e.reference}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-zinc-200">
                      <div className="flex items-center space-x-1.5">
                        {isDebit ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        )}
                        <span>{e.description}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                      {isDebit ? `-${formatLKR(e.debit)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      {isCredit ? `+${formatLKR(e.credit)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-100">
                      {formatLKR(e.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
