'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { ReportDateFilter, DateFilterState } from '../../components/reports/ReportDateFilter';
import { CdsStatementView } from '../../components/reports/CdsStatementView';
import { ContractNotesView } from '../../components/reports/ContractNotesView';
import { CapitalGainsView } from '../../components/reports/CapitalGainsView';
import { CashLedgerView } from '../../components/reports/CashLedgerView';
import { 
  Landmark, 
  Receipt, 
  TrendingUp, 
  Wallet, 
  FileText, 
  AlertCircle, 
  RefreshCw,
  UserCheck
} from 'lucide-react';

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'cds';
  const targetUserId = searchParams.get('userId') || '';

  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const isAdminOrSuper = Boolean(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));
  const effectiveTargetUserId = (targetUserId && isAdminOrSuper) ? targetUserId : '';

  const [activeTab, setActiveTab] = useState<'cds' | 'contract-notes' | 'pnl' | 'ledger'>(initialTab);
  const [loadedTab, setLoadedTab] = useState<string>('');
  const [filter, setFilter] = useState<DateFilterState>({
    preset: 'ALL',
    startDate: '',
    endDate: '',
    ticker: ''
  });

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: 'cds' | 'contract-notes' | 'pnl' | 'ledger') => {
    setActiveTab(tab);
    setData(null);
    setLoadedTab('');
  };

  const fetchReportData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.ticker) params.append('ticker', filter.ticker);
      if (effectiveTargetUserId) params.append('userId', effectiveTargetUserId);

      const qs = params.toString() ? `?${params.toString()}` : '';

      let endpoint = '';
      if (activeTab === 'cds') endpoint = `/reports/cds-statement${qs}`;
      else if (activeTab === 'contract-notes') endpoint = `/reports/contract-notes${qs}`;
      else if (activeTab === 'pnl') endpoint = `/reports/capital-gains${qs}`;
      else if (activeTab === 'ledger') endpoint = `/reports/cash-ledger${qs}`;

      const res = await api.get(endpoint);
      if (res.data?.success) {
        setData(res.data.data);
        setLoadedTab(activeTab);
      } else {
        setError(res.data?.error || 'Failed to load report data');
      }
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.error || 'Unable to retrieve statement data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReportData();
    }
  }, [isAuthenticated, activeTab, filter, targetUserId]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-fintech-card border border-fintech-border rounded-xl text-center font-sans">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-zinc-100 mb-1">Authentication Required</h2>
        <p className="text-xs text-zinc-400 mb-4">
          Please log in to view and download your Central Depository Systems (CDS) statements and contract notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-fintech-card border border-fintech-border rounded-xl p-5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-bold text-zinc-100 tracking-wide">
                PORTFOLIO REPORTS & STATEMENTS
              </h1>
              {effectiveTargetUserId && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Admin Auditing Mode</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Colombo Stock Exchange certified statements, official broker contract notes with 1.12% fee schedules, and capital gains accounting.
            </p>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="flex items-center space-x-1.5 p-1 bg-fintech-panel border border-fintech-border rounded-lg text-xs font-medium">
            <button
              onClick={() => handleTabChange('cds')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                activeTab === 'cds'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>CDS Statement</span>
            </button>

            <button
              onClick={() => handleTabChange('contract-notes')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                activeTab === 'contract-notes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Contract Notes</span>
            </button>

            <button
              onClick={() => handleTabChange('pnl')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                activeTab === 'pnl'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Capital Gains & P&L</span>
            </button>

            <button
              onClick={() => handleTabChange('ledger')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Cash Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter Bar (Hidden when printing) */}
      <div className="no-print">
        <ReportDateFilter
          filter={filter}
          onChange={setFilter}
          showTickerFilter={activeTab === 'contract-notes'}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === 'cds' && (
        <CdsStatementView data={loadedTab === 'cds' ? data : null} loading={loading} />
      )}

      {activeTab === 'contract-notes' && (
        <ContractNotesView data={loadedTab === 'contract-notes' ? data : null} loading={loading} />
      )}

      {activeTab === 'pnl' && (
        <CapitalGainsView data={loadedTab === 'pnl' ? data : null} loading={loading} />
      )}

      {activeTab === 'ledger' && (
        <CashLedgerView data={loadedTab === 'ledger' ? data : null} loading={loading} />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
