'use client';

import { useState, useMemo } from 'react';
import { AssetPerformance, Timeframe } from '@/lib/types';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { usePrivacy } from '@/context/privacy-context';

interface AssetTableProps {
  performances: AssetPerformance[];
  selectedTimeframe: Timeframe;
}

export function AssetTable({ performances, selectedTimeframe }: AssetTableProps) {
  const { formatCurrency } = usePrivacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'ASSET' | 'LIABILITY'>('ALL');
  const [sortField, setSortField] = useState<'name' | 'value' | 'selected_pct'>('value');
  const [sortAsc, setSortAsc] = useState(false);

  const platforms = useMemo(
    () => Array.from(new Set(performances.map((p) => p.platform_name))).sort(),
    [performances]
  );
  const classes = useMemo(
    () => Array.from(new Set(performances.map((p) => p.asset_class_name))).sort(),
    [performances]
  );

  const filteredAssets = useMemo(() => {
    return performances
      .filter((p) => {
        const matchesSearch =
          p.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.asset_class_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = selectedPlatform === 'ALL' || p.platform_name === selectedPlatform;
        const matchesClass = selectedClass === 'ALL' || p.asset_class_name === selectedClass;
        const matchesType = selectedType === 'ALL' || p.type === selectedType;
        return matchesSearch && matchesPlatform && matchesClass && matchesType;
      })
      .sort((a, b) => {
        let valA: any = a.current_value;
        let valB: any = b.current_value;

        if (sortField === 'name') {
          valA = a.asset_name.toLowerCase();
          valB = b.asset_name.toLowerCase();
        } else if (sortField === 'selected_pct') {
          valA = a.metrics[selectedTimeframe].percentage ?? -99999;
          valB = b.metrics[selectedTimeframe].percentage ?? -99999;
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [performances, searchTerm, selectedPlatform, selectedClass, selectedType, sortField, sortAsc, selectedTimeframe]);

  const handleSort = (field: 'name' | 'value' | 'selected_pct') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const renderPctBadge = (pct: number | null) => {
    if (pct === null) {
      return <span className="badge-neutral px-2 py-0.5 rounded text-xs font-mono">—</span>;
    }
    const isPos = pct >= 0;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${isPos ? 'badge-gain' : 'badge-loss'}`}>
        {isPos ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Assets & Liabilities Breakdown
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual asset valuations and liability balance progression
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            {(['ALL', 'ASSET', 'LIABILITY'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedType === t
                    ? t === 'LIABILITY'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : t === 'ASSET'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All Accounts' : t === 'ASSET' ? 'Assets Only' : 'Liabilities Only'}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  Account Name & Platform
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">Type & Class</th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => handleSort('value')}
                  className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
                >
                  Current Balance
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 text-center">3M %</th>
              <th className="py-3 px-4 text-center">6M %</th>
              <th className="py-3 px-4 text-center">1Y %</th>
              <th className="py-3 px-4 text-center">3Y %</th>
              <th className="py-3 px-4 text-center">5Y %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No matching accounts found.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const isLiability = asset.type === 'LIABILITY';
                return (
                  <tr
                    key={asset.asset_id}
                    className="hover:bg-slate-900/60 transition-colors group"
                  >
                    {/* Name & Platform */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {asset.asset_name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {asset.platform_name}
                        </span>
                      </div>
                    </td>

                    {/* Type & Class */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${isLiability ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                          {isLiability ? 'LIABILITY' : 'ASSET'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {asset.asset_class_name}
                        </span>
                      </div>
                    </td>

                    {/* Current Balance */}
                    <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${isLiability ? 'text-rose-400' : 'text-white'}`}>
                      {formatCurrency(asset.current_value)}
                    </td>

                    {/* Timeframe Columns */}
                    <td className="py-3.5 px-4 text-center">
                      {renderPctBadge(asset.metrics['3M'].percentage)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderPctBadge(asset.metrics['6M'].percentage)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderPctBadge(asset.metrics['1Y'].percentage)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderPctBadge(asset.metrics['3Y'].percentage)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderPctBadge(asset.metrics['5Y'].percentage)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
