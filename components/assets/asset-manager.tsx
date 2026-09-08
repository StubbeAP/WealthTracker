'use client';

import { useState, useTransition } from 'react';
import { Platform, AssetClass, Asset } from '@/lib/types';
import { createPlatform, createAssetClass, createAsset, toggleAssetActive } from '@/app/actions';
import { Plus, Settings, Layers, PieChart, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface AssetManagerProps {
  platforms: Platform[];
  assetClasses: AssetClass[];
  assets: Asset[];
}

export function AssetManager({ platforms, assetClasses, assets }: AssetManagerProps) {
  const [activeTab, setActiveTab] = useState<'assets' | 'platforms' | 'classes'>('assets');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassType, setNewClassType] = useState<'ASSET' | 'LIABILITY'>('ASSET');
  const [newAssetName, setNewAssetName] = useState('');
  const [selectedPlatformId, setSelectedPlatformId] = useState(platforms[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(assetClasses[0]?.id || '');

  // Add Platform Handler
  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;

    startTransition(async () => {
      const res = await createPlatform(newPlatformName.trim());
      if (res.success) {
        setNewPlatformName('');
        setStatusMessage({ type: 'success', text: 'Platform created successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to create platform' });
      }
    });
  };

  // Add Asset Class Handler
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    startTransition(async () => {
      const res = await createAssetClass(newClassName.trim(), newClassType);
      if (res.success) {
        setNewClassName('');
        setStatusMessage({ type: 'success', text: `${newClassType === 'LIABILITY' ? 'Liability' : 'Asset'} class created successfully!` });
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to create asset class' });
      }
    });
  };

  // Add Asset Handler
  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !selectedPlatformId || !selectedClassId) return;

    startTransition(async () => {
      const res = await createAsset({
        name: newAssetName.trim(),
        platform_id: selectedPlatformId,
        asset_class_id: selectedClassId,
        currency: 'ZAR',
      });
      if (res.success) {
        setNewAssetName('');
        setStatusMessage({ type: 'success', text: 'Asset created successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to create asset' });
      }
    });
  };

  // Toggle Active Handler
  const handleToggleActive = (assetId: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleAssetActive(assetId, !currentActive);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Asset status updated!' });
        setTimeout(() => setStatusMessage(null), 2500);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to update asset' });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            Asset & Platform Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure financial platforms, custom asset classes, and active tracking accounts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'assets'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'platforms'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Platforms ({platforms.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'classes'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Classes ({assetClasses.length})
          </button>
        </div>
      </div>

      {/* Status Message */}
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

      {/* Tab 1: Assets Management */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Asset Form */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-1 h-fit">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Add New Asset
            </h2>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. S&P 500 Index"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
                <select
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Asset Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  {assetClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Asset'}
              </button>
            </form>
          </div>

          {/* Assets List */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-2">
            <h2 className="text-sm font-bold text-white mb-4">Tracked Assets ({assets.length})</h2>
            <div className="divide-y divide-slate-800/80">
              {assets.map((asset) => (
                <div key={asset.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm text-white">{asset.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {asset.platform?.name || 'Platform'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{asset.asset_class?.name || 'Class'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(asset.id, asset.is_active)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                      asset.is_active
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 hover:bg-rose-950/80 hover:text-rose-400'
                        : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-emerald-400'
                    }`}
                  >
                    {asset.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Platforms Management */}
      {activeTab === 'platforms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl lg:col-span-1 h-fit">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Add Platform
            </h2>
            <form onSubmit={handleAddPlatform} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Platform Name</label>
                <input
                  type="text"
                  placeholder="e.g. Schwab, Kraken"
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Add Platform'}
              </button>
            </form>
          </div>

          <div className="glass-card p-6 rounded-2xl lg:col-span-2">
            <h2 className="text-sm font-bold text-white mb-4">Configured Platforms ({platforms.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">{p.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">ID: {p.id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Asset Classes Management */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl lg:col-span-1 h-fit">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Add Class / Category
            </h2>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Class Name</label>
                <input
                  type="text"
                  placeholder="e.g. Credit Cards, Equities, Crypto"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category Type</label>
                <select
                  value={newClassType}
                  onChange={(e) => setNewClassType(e.target.value as 'ASSET' | 'LIABILITY')}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ASSET">Asset (Adds to Net Worth)</option>
                  <option value="LIABILITY">Liability (Subtracts from Net Worth)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Add Class'}
              </button>
            </form>
          </div>

          <div className="glass-card p-6 rounded-2xl lg:col-span-2">
            <h2 className="text-sm font-bold text-white mb-4">Classes & Categories ({assetClasses.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assetClasses.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{c.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                        c.type === 'LIABILITY'
                          ? 'bg-rose-950/90 text-rose-400 border border-rose-800'
                          : 'bg-emerald-950/90 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {c.type === 'LIABILITY' ? 'LIABILITY' : 'ASSET'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">ID: {c.id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
