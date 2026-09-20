'use client';

import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

export interface DateFilterState {
  preset: 'ALL' | 'TODAY' | '7D' | 'MTD' | 'YTD' | 'CUSTOM';
  startDate: string;
  endDate: string;
  ticker: string;
}

interface ReportDateFilterProps {
  filter: DateFilterState;
  onChange: (newFilter: DateFilterState) => void;
  showTickerFilter?: boolean;
}

export const ReportDateFilter: React.FC<ReportDateFilterProps> = ({
  filter,
  onChange,
  showTickerFilter = true
}) => {
  const handlePresetChange = (preset: DateFilterState['preset']) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === 'ALL') {
      onChange({ preset: 'ALL', startDate: '', endDate: '', ticker: filter.ticker });
    } else if (preset === 'TODAY') {
      onChange({ preset: 'TODAY', startDate: todayStr, endDate: todayStr, ticker: filter.ticker });
    } else if (preset === '7D') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      onChange({ preset: '7D', startDate: past.toISOString().slice(0, 10), endDate: todayStr, ticker: filter.ticker });
    } else if (preset === 'MTD') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      onChange({ preset: 'MTD', startDate: startOfMonth.toISOString().slice(0, 10), endDate: todayStr, ticker: filter.ticker });
    } else if (preset === 'YTD') {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      onChange({ preset: 'YTD', startDate: startOfYear.toISOString().slice(0, 10), endDate: todayStr, ticker: filter.ticker });
    }
  };

  const handleCustomDate = (field: 'startDate' | 'endDate', value: string) => {
    onChange({
      ...filter,
      preset: 'CUSTOM',
      [field]: value
    });
  };

  const handleReset = () => {
    onChange({
      preset: 'ALL',
      startDate: '',
      endDate: '',
      ticker: ''
    });
  };

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-lg p-3.5 mb-4 text-xs font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-zinc-500 font-medium mr-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Period:
          </span>
          {(['ALL', 'TODAY', '7D', 'MTD', 'YTD'] as const).map((p) => {
            const labels = {
              ALL: 'All Time',
              TODAY: 'Today',
              '7D': 'Last 7 Days',
              MTD: 'Month-to-Date',
              YTD: 'Year-to-Date'
            };
            const isActive = filter.preset === p;
            return (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-fintech-panel hover:bg-fintech-hover text-zinc-300 border border-fintech-border'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers & Ticker Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">From:</span>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => handleCustomDate('startDate', e.target.value)}
              className="bg-fintech-panel border border-fintech-border rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">To:</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => handleCustomDate('endDate', e.target.value)}
              className="bg-fintech-panel border border-fintech-border rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {showTickerFilter && (
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Ticker (e.g. COMB)"
                value={filter.ticker}
                onChange={(e) => onChange({ ...filter, ticker: e.target.value.toUpperCase() })}
                className="w-28 bg-fintech-panel border border-fintech-border rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          <button
            onClick={handleReset}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-fintech-hover rounded border border-fintech-border transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
