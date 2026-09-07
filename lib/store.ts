import { Platform, AssetClass, Asset, AssetSnapshot } from './types';
import { supabase } from './supabase';

// Default initial platforms if none exist
export const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'p-1', name: 'Fidelity', created_at: new Date().toISOString() },
  { id: 'p-2', name: 'Coinbase', created_at: new Date().toISOString() },
  { id: 'p-3', name: 'Vanguard', created_at: new Date().toISOString() },
  { id: 'p-4', name: 'Binance', created_at: new Date().toISOString() },
  { id: 'p-5', name: 'Bank of America', created_at: new Date().toISOString() },
];

// Default initial asset classes
export const DEFAULT_ASSET_CLASSES: AssetClass[] = [
  { id: 'ac-1', name: 'Equities', created_at: new Date().toISOString() },
  { id: 'ac-2', name: 'Crypto', created_at: new Date().toISOString() },
  { id: 'ac-3', name: 'Cash & Equivalents', created_at: new Date().toISOString() },
  { id: 'ac-4', name: 'Real Estate', created_at: new Date().toISOString() },
  { id: 'ac-5', name: 'Fixed Income', created_at: new Date().toISOString() },
];

// Default initial assets
export const DEFAULT_ASSETS: Asset[] = [
  { id: 'a-1', platform_id: 'p-1', asset_class_id: 'ac-1', name: 'US Tech Index (S&P 500)', currency: 'USD', is_active: true },
  { id: 'a-2', platform_id: 'p-1', asset_class_id: 'ac-1', name: 'Apple Inc (AAPL)', currency: 'USD', is_active: true },
  { id: 'a-3', platform_id: 'p-2', asset_class_id: 'ac-2', name: 'Bitcoin (BTC)', currency: 'USD', is_active: true },
  { id: 'a-4', platform_id: 'p-2', asset_class_id: 'ac-2', name: 'Ethereum (ETH)', currency: 'USD', is_active: true },
  { id: 'a-5', platform_id: 'p-3', asset_class_id: 'ac-1', name: 'Vanguard Total Stock (VTI)', currency: 'USD', is_active: true },
  { id: 'a-6', platform_id: 'p-3', asset_class_id: 'ac-5', name: 'Vanguard Total Bond (BND)', currency: 'USD', is_active: true },
  { id: 'a-7', platform_id: 'p-4', asset_class_id: 'ac-2', name: 'Solana (SOL)', currency: 'USD', is_active: true },
  { id: 'a-8', platform_id: 'p-5', asset_class_id: 'ac-3', name: 'High Yield Savings Account', currency: 'USD', is_active: true },
];

/**
 * Generates historical snapshots stretching back 5 years (up to 60 monthly data points)
 * to demonstrate full 3M, 6M, 1Y, 3Y, 5Y growth lookback functionality.
 */
export function generateDemoSnapshots(assets: Asset[]): AssetSnapshot[] {
  const snapshots: AssetSnapshot[] = [];
  const now = new Date();
  
  // Create monthly snapshots for past 60 months
  for (let m = 60; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 15);
    const dateStr = d.toISOString().split('T')[0];

    assets.forEach((asset) => {
      let baseVal = 10000;
      let monthlyRate = 0.008; // ~10% annual base

      if (asset.name.includes('BTC') || asset.name.includes('Bitcoin')) {
        baseVal = 15000;
        monthlyRate = 0.025;
      } else if (asset.name.includes('ETH')) {
        baseVal = 8000;
        monthlyRate = 0.022;
      } else if (asset.name.includes('SOL')) {
        baseVal = 2000;
        monthlyRate = 0.035;
      } else if (asset.name.includes('Savings')) {
        baseVal = 25000;
        monthlyRate = 0.003;
      } else if (asset.name.includes('AAPL')) {
        baseVal = 12000;
        monthlyRate = 0.015;
      } else if (asset.name.includes('VTI') || asset.name.includes('S&P')) {
        baseVal = 30000;
        monthlyRate = 0.010;
      } else if (asset.name.includes('BND')) {
        baseVal = 10000;
        monthlyRate = 0.002;
      }

      // Add realistic historical progression with compound growth and slight noise
      const monthsElapsed = 60 - m;
      const noise = (Math.sin(monthsElapsed * 0.7) * 0.05) + (Math.cos(monthsElapsed * 1.3) * 0.04);
      const val = Math.round(baseVal * Math.pow(1 + monthlyRate + noise, monthsElapsed));

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
