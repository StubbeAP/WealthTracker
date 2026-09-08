import { Platform, AssetClass, Asset, AssetSnapshot } from './types';

export const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'p-1', name: 'Fidelity', created_at: new Date().toISOString() },
  { id: 'p-2', name: 'Coinbase', created_at: new Date().toISOString() },
  { id: 'p-3', name: 'Vanguard', created_at: new Date().toISOString() },
  { id: 'p-4', name: 'Binance', created_at: new Date().toISOString() },
  { id: 'p-5', name: 'Capitec', created_at: new Date().toISOString() },
  { id: 'p-6', name: 'Allan Gray', created_at: new Date().toISOString() },
  { id: 'p-7', name: 'Easy Equities', created_at: new Date().toISOString() },
  { id: 'p-8', name: 'SA Home Loans', created_at: new Date().toISOString() },
];

export const DEFAULT_ASSET_CLASSES: AssetClass[] = [
  // Assets
  { id: 'ac-1', name: 'Equities', type: 'ASSET', created_at: new Date().toISOString() },
  { id: 'ac-2', name: 'Crypto', type: 'ASSET', created_at: new Date().toISOString() },
  { id: 'ac-3', name: 'Cash & Savings', type: 'ASSET', created_at: new Date().toISOString() },
  { id: 'ac-4', name: 'Real Estate', type: 'ASSET', created_at: new Date().toISOString() },
  { id: 'ac-5', name: 'Fixed Income', type: 'ASSET', created_at: new Date().toISOString() },
  
  // Liabilities
  { id: 'ac-6', name: 'Credit Cards', type: 'LIABILITY', created_at: new Date().toISOString() },
  { id: 'ac-7', name: 'Personal Loans', type: 'LIABILITY', created_at: new Date().toISOString() },
  { id: 'ac-8', name: 'Mortgages', type: 'LIABILITY', created_at: new Date().toISOString() },
  { id: 'ac-9', name: 'Vehicle Financing', type: 'LIABILITY', created_at: new Date().toISOString() },
];

export const DEFAULT_ASSETS: Asset[] = [
  // Assets
  { id: 'a-1', platform_id: 'p-1', asset_class_id: 'ac-1', name: 'US Tech Index (S&P 500)', currency: 'ZAR', is_active: true },
  { id: 'a-2', platform_id: 'p-1', asset_class_id: 'ac-1', name: 'Apple Inc (AAPL)', currency: 'ZAR', is_active: true },
  { id: 'a-3', platform_id: 'p-2', asset_class_id: 'ac-2', name: 'Bitcoin (BTC)', currency: 'ZAR', is_active: true },
  { id: 'a-4', platform_id: 'p-2', asset_class_id: 'ac-2', name: 'Ethereum (ETH)', currency: 'ZAR', is_active: true },
  { id: 'a-5', platform_id: 'p-3', asset_class_id: 'ac-1', name: 'Vanguard Total Stock (VTI)', currency: 'ZAR', is_active: true },
  { id: 'a-6', platform_id: 'p-5', asset_class_id: 'ac-3', name: 'Capitec Savings Account', currency: 'ZAR', is_active: true },
  
  // Liabilities
  { id: 'a-7', platform_id: 'p-5', asset_class_id: 'ac-6', name: 'Capitec Credit Card', currency: 'ZAR', is_active: true },
  { id: 'a-8', platform_id: 'p-8', asset_class_id: 'ac-8', name: 'Primary Home Mortgage', currency: 'ZAR', is_active: true },
];

export function generateDemoSnapshots(assets: Asset[]): AssetSnapshot[] {
  const snapshots: AssetSnapshot[] = [];
  const now = new Date();
  
  for (let m = 60; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 15);
    const dateStr = d.toISOString().split('T')[0];

    assets.forEach((asset) => {
      let baseVal = 100000;
      let monthlyRate = 0.008;

      if (asset.name.includes('BTC') || asset.name.includes('Bitcoin')) {
        baseVal = 250000;
        monthlyRate = 0.025;
      } else if (asset.name.includes('ETH')) {
        baseVal = 120000;
        monthlyRate = 0.022;
      } else if (asset.name.includes('Savings')) {
        baseVal = 300000;
        monthlyRate = 0.005;
      } else if (asset.name.includes('Credit Card')) {
        baseVal = 45000;
        monthlyRate = -0.012; // Paying down credit card balance
      } else if (asset.name.includes('Mortgage')) {
        baseVal = 850000;
        monthlyRate = -0.006; // Paying down mortgage principal
      } else if (asset.name.includes('VTI') || asset.name.includes('S&P')) {
        baseVal = 500000;
        monthlyRate = 0.010;
      }

      const monthsElapsed = 60 - m;
      const noise = (Math.sin(monthsElapsed * 0.7) * 0.03) + (Math.cos(monthsElapsed * 1.3) * 0.02);
      const val = Math.max(0, Math.round(baseVal * Math.pow(1 + monthlyRate + noise, monthsElapsed)));

      snapshots.push({
        id: `snap-${asset.id}-${dateStr}`,
        asset_id: asset.id,
        snapshot_date: dateStr,
        value: val,
        notes: m === 0 ? 'Latest monthly update' : null,
        created_at: d.toISOString(),
      });
    });
  }

  return snapshots;
}
