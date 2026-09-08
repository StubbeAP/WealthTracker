'use client';

import { Timeframe, PortfolioSummary } from '@/lib/types';
import { TrendingUp, TrendingDown, DollarSign, Layers, PieChart, Calendar, Eye, EyeOff, ShieldAlert, Wallet } from 'lucide-react';
import { usePrivacy } from '@/context/privacy-context';

interface HeroCardsProps {
  summary: PortfolioSummary;
  selectedTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

const TIMEFRAMES: Timeframe[] = ['3M', '6M', '1Y', '3Y', '5Y'];

export function HeroCards({ summary, selectedTimeframe, onTimeframeChange }: HeroCardsProps) {
  const { isPrivacyMode, togglePrivacyMode, formatCurrency } = usePrivacy();
  const isPositive = (summary.absolute_change ?? 0) >= 0;
  const hasLookback = summary.absolute_change !== null && summary.percentage_change !== null;

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Net Worth Overview
            <button
              onClick={togglePrivacyMode}
              title="Toggle Privacy Blur"
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              {isPrivacyMode ? <EyeOff className="w-5 h-5 text-purple-400" /> : <Eye className="w-5 h-5" />}
            </button>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            True Net Worth = Total Assets - Total Liabilities (ZAR)
          </p>
        </div>

        {/* Timeframe Selector Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner self-start sm:self-auto">
          {TIMEFRAMES.map((tf) => {
            const isSelected = selectedTimeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of 4 Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total Net Worth */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net Worth</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono text-xs">
              ZAR
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatCurrency(summary.total_net_worth)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Assets minus Liabilities</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>

        {/* Card 2: Assets vs Liabilities Breakdown */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Assets vs Liabilities</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">Assets:</span>
              <span className="text-white font-extrabold">{formatCurrency(summary.total_assets)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-400 font-bold">Liabilities:</span>
              <span className="text-rose-300 font-extrabold">{formatCurrency(summary.total_liabilities)}</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Equity Ratio</span>
            <span className="font-mono text-slate-300">
              {summary.total_assets > 0
                ? `${(((summary.total_assets - summary.total_liabilities) / summary.total_assets) * 100).toFixed(0)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Nominal Net Worth Gain / Loss */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">{selectedTimeframe} Change (R)</span>
            <div className={`p-2 rounded-xl border ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${hasLookback ? (isPositive ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
            {hasLookback
              ? `${isPositive && !isPrivacyMode ? '+' : ''}${formatCurrency(summary.absolute_change)}`
              : '—'}
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>{selectedTimeframe} Growth (%)</span>
            <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.percentage_change !== null ? `${isPositive ? '+' : ''}${summary.percentage_change.toFixed(2)}%` : '—'}
            </span>
          </div>
        </div>

        {/* Card 4: Portfolio Structure */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Portfolio Structure</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{summary.asset_count + summary.liability_count}</span>
            <span className="text-xs text-slate-400">Total Accounts</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400">{summary.asset_count} Assets</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400">{summary.liability_count} Liabilities</span>
          </div>
        </div>

      </div>
    </div>
  );
}
