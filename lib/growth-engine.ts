import { Timeframe, LookbackMetric, AssetPerformance, Asset, AssetSnapshot, Platform, AssetClass, PortfolioSummary } from './types';

export const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '3Y': 1095,
  '5Y': 1825,
};

/**
 * Calculates growth metrics for a given asset given its full snapshot history.
 */
export function calculateAssetPerformance(
  asset: Asset,
  platform: Platform | undefined,
  assetClass: AssetClass | undefined,
  snapshots: AssetSnapshot[],
  refDateStr?: string
): AssetPerformance {
  const refDate = refDateStr ? new Date(refDateStr) : new Date();

  // Sort snapshots ascending by date
  const sortedSnapshots = [...snapshots]
    .filter((s) => s.asset_id === asset.id && new Date(s.snapshot_date) <= refDate)
    .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());

  if (sortedSnapshots.length === 0) {
    return {
      asset_id: asset.id,
      asset_name: asset.name,
      platform_name: platform?.name || 'Unknown',
      asset_class_name: assetClass?.name || 'Unclassified',
      currency: asset.currency || 'USD',
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
    '3M': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['3M']),
    '6M': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['6M']),
    '1Y': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['1Y']),
    '3Y': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['3Y']),
    '5Y': calculateLookback(sortedSnapshots, currentValue, refDate, TIMEFRAME_DAYS['5Y']),
  };

  return {
    asset_id: asset.id,
    asset_name: asset.name,
    platform_name: platform?.name || 'Unknown',
    asset_class_name: assetClass?.name || 'Unclassified',
    currency: asset.currency || 'USD',
    current_value: currentValue,
    current_date: latestSnapshot.snapshot_date,
    metrics,
  };
}

/**
 * Finds the closest snapshot on or before target date (refDate - lookbackDays)
 */
function calculateLookback(
  snapshots: AssetSnapshot[],
  currentValue: number,
  refDate: Date,
  days: number
): LookbackMetric {
  const targetTime = refDate.getTime() - days * 24 * 60 * 60 * 1000;

  // Filter snapshots on or before the target date
  const pastSnapshots = snapshots.filter(
    (s) => new Date(s.snapshot_date).getTime() <= targetTime
  );

  if (pastSnapshots.length === 0) {
    return { past_value: null, gain: null, percentage: null };
  }

  // The last element in pastSnapshots is the closest on or before target date
  const closestPast = pastSnapshots[pastSnapshots.length - 1];
  const pastValue = Number(closestPast.value);

  const gain = currentValue - pastValue;
  const percentage = pastValue > 0 ? (gain / pastValue) * 100 : 0;

  return {
    past_value: pastValue,
    gain: Math.round(gain * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Calculates portfolio summary metrics for hero cards based on selected timeframe
 */
export function calculatePortfolioSummary(
  performances: AssetPerformance[],
  timeframe: Timeframe
): PortfolioSummary {
  const totalNetWorth = performances.reduce((acc, p) => acc + p.current_value, 0);
  
  let previousTotal: number | null = 0;
  let hasValidLookback = false;

  for (const perf of performances) {
    const metric = perf.metrics[timeframe];
    if (metric.past_value !== null) {
      previousTotal! += metric.past_value;
      hasValidLookback = true;
    } else {
      // If an asset didn't exist at the past date, assume 0 or exclude
      // We still include its current value in net worth calculation
    }
  }

  if (!hasValidLookback || previousTotal === null) {
    return {
      total_net_worth: totalNetWorth,
      timeframe,
      previous_value: null,
      absolute_change: null,
      percentage_change: null,
      asset_count: performances.length,
      platform_count: new Set(performances.map((p) => p.platform_name)).size,
    };
  }

  const absoluteChange = totalNetWorth - previousTotal;
  const percentageChange = previousTotal > 0 ? (absoluteChange / previousTotal) * 100 : 0;

  return {
    total_net_worth: totalNetWorth,
    timeframe,
    previous_value: Math.round(previousTotal * 100) / 100,
    absolute_change: Math.round(absoluteChange * 100) / 100,
    percentage_change: Math.round(percentageChange * 100) / 100,
    asset_count: performances.length,
    platform_count: new Set(performances.map((p) => p.platform_name)).size,
  };
}
