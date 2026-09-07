export type Timeframe = '3M' | '6M' | '1Y' | '3Y' | '5Y';

export interface Platform {
  id: string;
  name: string;
  created_at?: string;
}

export interface AssetClass {
  id: string;
  name: string;
  created_at?: string;
}

export interface Asset {
  id: string;
  platform_id: string;
  asset_class_id: string;
  name: string;
  currency: string;
  is_active: boolean;
  created_at?: string;
  platform?: Platform;
  asset_class?: AssetClass;
}

export interface AssetSnapshot {
  id: string;
  asset_id: string;
  snapshot_date: string;
  value: number;
  notes?: string | null;
  created_at?: string;
}

export interface LookbackMetric {
  past_value: number | null;
  gain: number | null;
  percentage: number | null;
}

export interface AssetPerformance {
  asset_id: string;
  asset_name: string;
  platform_name: string;
  asset_class_name: string;
  currency: string;
  current_value: number;
  current_date: string | null;
  metrics: Record<Timeframe, LookbackMetric>;
}

export interface PortfolioSummary {
  total_net_worth: number;
  timeframe: Timeframe;
  previous_value: number | null;
  absolute_change: number | null;
  percentage_change: number | null;
  asset_count: number;
  platform_count: number;
}

export interface AllocationItem {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface HistoricalPoint {
  date: string;
  total_value: number;
  [key: string]: string | number; // Breakdown by asset or class if needed
}
