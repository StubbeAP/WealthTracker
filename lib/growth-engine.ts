import { Timeframe, LookbackMetric, AssetPerformance, Asset, AssetSnapshot, Platform, AssetClass, PortfolioSummary } from './types';

export const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '3Y': 1095,
  '5Y': 1825,
};

export function calculateAssetPerformance(
  asset: Asset,
  platform: Platform | undefined,
  assetClass: AssetClass | undefined,
  snapshots: AssetSnapshot[],
  refDateStr?: string
): AssetPerformance {
  const refDate = refDateStr ? new Date(refDateStr) : new Date();

  const sortedSnapshots = [...snapshots]
    .filter((s) => s.asset_id === asset.id && new Date(s.snapshot_date) <= refDate)
    .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());

  const isLiability = assetClass?.type === 'LIABILITY';

  if (sortedSnapshots.length === 0) {
    return {
      asset_id: asset.id,
      asset_name: asset.name,
      platform_name: platform?.name || 'Unknown',
      asset_class_name: assetClass?.name || 'Unclassified',
      type: assetClass?.type || 'ASSET',
      currency: asset.currency || 'ZAR',
      current_value: 0,
      current_date: null,
      metrics: {
        '3M': { past_value: null, gain: null, percentage: null },
        '6M': { past_value: null, gain: null, percentage: null },
        '1Y': { past_value: null, gain: null, percentage: null },
        '3Y': { past_value: null, gain: null, percentage: null },
        '5Y': { past_value: null, gain: null, percentage: null },
      },
    };
  }

  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const currentValue = Number(latestSnapshot.value);

  const metrics: Record<Timeframe, LookbackMetric> = {
    '3M': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['3M'], isLiability),
    '6M': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['6M'], isLiability),
    '1Y': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['1Y'], isLiability),
    '3Y': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['3Y'], isLiability),
    '5Y': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['5Y'], isLiability),
  };

  return {
    asset_id: asset.id,
    asset_name: asset.name,
    platform_name: platform?.name || 'Unknown',
    asset_class_name: assetClass?.name || 'Unclassified',
    type: assetClass?.type || 'ASSET',
    currency: asset.currency || 'ZAR',
    current_value: currentValue,
    current_date: latestSnapshot.snapshot_date,
    metrics,
  };
}

function calculateLookback(
  snapshots: AssetSnapshot[],
  currentValue: number,
  refDate: Date,
  days: number,
  isLiability: boolean = false
): LookbackMetric {
  const targetTime = refDate.getTime() - days * 24 * 60 * 60 * 1000;

  const pastSnapshots = snapshots.filter(
    (s) => new Date(s.snapshot_date).getTime() <= targetTime
  );

  if (pastSnapshots.length === 0) {
    return { past_value: null, gain: null, percentage: null };
  }

  const closestPast = pastSnapshots[pastSnapshots.length - 1];
  const pastValue = Number(closestPast.value);

  // For assets: current - past. For liabilities: paying down debt is a gain for net worth!
  const rawDiff = currentValue - pastValue;
  const gain = isLiability ? -rawDiff : rawDiff;
  const percentage = pastValue > 0 ? (gain / pastValue) * 100 : 0;

  return {
    past_value: pastValue,
    gain: Math.round(gain * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

export function calculatePortfolioSummary(
  performances: AssetPerformance[],
  timeframe: Timeframe
): PortfolioSummary {
  const assetPerfs = performances.filter((p) => p.type === 'ASSET');
  const liabilityPerfs = performances.filter((p) => p.type === 'LIABILITY');

  const totalAssets = assetPerfs.reduce((acc, p) => acc + p.current_value, 0);
  const totalLiabilities = liabilityPerfs.reduce((acc, p) => acc + p.current_value, 0);
  const totalNetWorth = totalAssets - totalLiabilities;

  let previousAssets: number | null = 0;
  let previousLiabilities: number | null = 0;
  let hasValidLookback = false;

  for (const perf of assetPerfs) {
    const metric = perf.metrics[timeframe];
    if (metric.past_value !== null) {
      previousAssets! += metric.past_value;
      hasValidLookback = true;
    }
  }

  for (const perf of liabilityPerfs) {
    const metric = perf.metrics[timeframe];
    if (metric.past_value !== null) {
      previousLiabilities! += metric.past_value;
      hasValidLookback = true;
    }
  }

  const previousNetWorth = previousAssets - previousLiabilities;

  if (!hasValidLookback) {
    return {
      total_net_worth: totalNetWorth,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      timeframe,
      previous_value: null,
      absolute_change: null,
      percentage_change: null,
      asset_count: assetPerfs.length,
      liability_count: liabilityPerfs.length,
      platform_count: new Set(performances.map((p) => p.platform_name)).size,
    };
  }

  const absoluteChange = totalNetWorth - previousNetWorth;
  const percentageChange = previousNetWorth > 0 ? (absoluteChange / previousNetWorth) * 100 : 0;

  return {
    total_net_worth: totalNetWorth,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    timeframe,
    previous_value: Math.round(previousNetWorth * 100) / 100,
    absolute_change: Math.round(absoluteChange * 100) / 100,
    percentage_change: Math.round(percentageChange * 100) / 100,
    asset_count: assetPerfs.length,
    liability_count: liabilityPerfs.length,
    platform_count: new Set(performances.map((p) => p.platform_name)).size,
  };
}
