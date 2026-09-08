'use client';

import { useState, useTransition, useMemo } from 'react';
import { Asset, AssetSnapshot, Platform } from '@/lib/types';
import { saveBatchSnapshots } from '@/app/actions';
import { Calendar, Save, Copy, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { usePrivacy } from '@/context/privacy-context';

interface BulkEntryGridProps {
  assets: Asset[];
  snapshots: AssetSnapshot[];
  platforms: Platform[];
}

export function BulkEntryGrid({ assets, snapshots, platforms }: BulkEntryGridProps) {
  const { formatCurrency } = usePrivacy();
  const [snapshotDate, setSnapshotDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  const [values, setValues] = useState<Record<string, { value: string; notes: string }>>({});
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const groupedAssets = useMemo(() => {
    const activeAssets = assets.filter((a) => a.is_active);
    const map = new Map<string, Asset[]>();

    platforms.forEach((p) => map.set(p.name, []));

    activeAssets.forEach((asset) => {
      const pName = asset.platform?.name || 'Other';
      if (!map.has(pName)) map.set(pName, []);
      map.get(pName)!.push(asset);
    });

    return Array.from(map.entries()).filter(([_, list]) => list.length > 0);
  }, [assets, platforms]);

  const latestSnapshotMap = useMemo(() => {
    const map = new Map<string, AssetSnapshot>();
    snapshots.forEach((s) => {
      const existing = map.get(s.asset_id);
      if (!existing || new Date(s.snapshot_date) > new Date(existing.snapshot_date)) {
        map.set(s.asset_id, s);
      }
    });
    return map;
  }, [snapshots]);

  const handleValChange = (assetId: string, val: string) => {
    setValues((prev) => ({
      ...prev,
      [assetId]: {
        value: val,
        notes: prev[assetId]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (assetId: string, notes: string) => {
    setValues((prev) => ({
      ...prev,
      [assetId]: {
        value: prev[assetId]?.value || '',
        notes,
      },
    }));
  };

  const handleCopyLastValues = () => {
    const newVals: Record<string, { value: string; notes: string }> = {};
    assets.forEach((a) => {
      const latest = latestSnapshotMap.get(a.id);
      if (latest) {
        newVals[a.id] = {
          value: String(latest.value),
          notes: latest.notes || '',
        };
      }
    });
    setValues(newVals);
    setStatusMessage({ type: 'success', text: 'Copied last recorded snapshot values into fields!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveAll = () => {
    const entries: { asset_id: string; value: number; snapshot_date: string; notes?: string }[] = [];

    Object.entries(values).forEach(([assetId, data]) => {
      const numVal = parseFloat(data.value);
      if (!isNaN(numVal)) {
        entries.push({
          asset_id: assetId,
          snapshot_date: snapshotDate,
          value: numVal,
          notes: data.notes || undefined,
        });
      }
    });

    if (entries.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please enter at least one numeric snapshot value before saving.' });
      return;
    }

    startTransition(async () => {
      const res = await saveBatchSnapshots(entries);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully saved ${entries.length} asset snapshot(s) for ${snapshotDate}!`,
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to save snapshots.' });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Bulk Snapshot Entry (ZAR)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Record point-in-time valuations across all your active accounts for batch calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Snapshot Date:</span>
            <input
              type="date"
              value={snapshotDate}
              onChange={(e) => setSnapshotDate(e.target.value)}
              className="bg-transparent text-white text-xs font-mono focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCopyLastValues}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Last Values
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Saving...' : 'Save All Snapshots'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {groupedAssets.map(([platformName, platformAssets]) => (
          <div key={platformName} className="glass-card rounded-2xl overflow-hidden">
            <div className="bg-slate-900/90 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                {platformName}
              </span>
              <span className="text-xs text-slate-400 font-mono">{platformAssets.length} Assets</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {platformAssets.map((asset) => {
                const latest = latestSnapshotMap.get(asset.id);
                const currentInput = values[asset.id]?.value ?? '';
                const currentNotes = values[asset.id]?.notes ?? '';

                return (
                  <div
                    key={asset.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="sm:w-1/3">
                      <div className="font-semibold text-sm text-white">{asset.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{asset.asset_class?.name || 'Class'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono text-slate-400">
                          Last: {latest ? `${formatCurrency(latest.value)} (${latest.snapshot_date})` : 'None'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">R</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={latest ? String(latest.value) : '0.00'}
                          value={currentInput}
                          onChange={(e) => handleValChange(asset.id, e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={currentNotes}
                        onChange={(e) => handleNotesChange(asset.id, e.target.value)}
                        className="w-1/2 hidden md:block px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
