'use client';

import { AssetPerformance, AssetSnapshot } from '@/lib/types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

interface AllocationChartsProps {
  performances: AssetPerformance[];
  snapshots: AssetSnapshot[];
}

const CLASS_COLORS: Record<string, string> = {
  Equities: '#3b82f6',
  Crypto: '#8b5cf6',
  'Cash & Equivalents': '#10b981',
  'Real Estate': '#f59e0b',
  'Fixed Income': '#06b6d4',
};

const PLATFORM_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
];

export function AllocationCharts({ performances, snapshots }: AllocationChartsProps) {
  const classAllocation = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    performances.forEach((p) => {
      const cls = p.asset_class_name || 'Other';
      const val = p.current_value;
      map.set(cls, (map.get(cls) || 0) + val);
      total += val;
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: CLASS_COLORS[name] || '#94a3b8',
    }));
  }, [performances]);

  const platformAllocation = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    performances.forEach((p) => {
      const plat = p.platform_name || 'Other';
      const val = p.current_value;
      map.set(plat, (map.get(plat) || 0) + val);
      total += val;
    });

    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: PLATFORM_COLORS[idx % PLATFORM_COLORS.length],
    }));
  }, [performances]);

  const historicalTimeline = useMemo(() => {
    const dateMap = new Map<string, number>();

    snapshots.forEach((s) => {
      const date = s.snapshot_date;
      dateMap.set(date, (dateMap.get(date) || 0) + Number(s.value));
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, total_value]) => ({
        date: new Date(date).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }),
        fullDate: date,
        total_value,
      }));
  }, [snapshots]);

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs font-sans">
          <div className="font-bold text-white mb-1">{data.name || data.date || data.fullDate}</div>
          <div className="font-mono text-emerald-400 font-semibold">
            R {(data.value || data.total_value)?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          {data.percentage !== undefined && (
            <div className="text-slate-400 mt-0.5">{data.percentage.toFixed(1)}% of portfolio</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Historical Net Worth Timeline Chart */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Portfolio Net Worth Timeline (ZAR)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Historical point-in-time valuation progression</p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `R${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'k'}`}
              />
              <Tooltip content={renderTooltip} />
              <Area
                type="monotone"
                dataKey="total_value"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Allocation Donut Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                Allocation by Asset Class
              </h2>
              <span className="text-xs text-slate-400">{classAllocation.length} Classes</span>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {classAllocation.map((entry, index) => (
                      <Cell key={`cell-cls-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
            {classAllocation.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-mono text-slate-400">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Allocation by Platform
              </h2>
              <span className="text-xs text-slate-400">{platformAllocation.length} Platforms</span>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {platformAllocation.map((entry, index) => (
                      <Cell key={`cell-plat-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
            {platformAllocation.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-mono text-slate-400">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
