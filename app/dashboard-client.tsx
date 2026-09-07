'use client';

import { useState, useMemo } from 'react';
import { Platform, AssetClass, Asset, AssetSnapshot, Timeframe } from '@/lib/types';
import { calculateAssetPerformance, calculatePortfolioSummary } from '@/lib/growth-engine';
import { Navbar } from '@/components/navbar';
import { HeroCards } from '@/components/dashboard/hero-cards';
import { AllocationCharts } from '@/components/dashboard/allocation-charts';
import { AssetTable } from '@/components/dashboard/asset-table';

interface DashboardClientProps {
  platforms: Platform[];
  assetClasses: AssetClass[];
  assets: Asset[];
  snapshots: AssetSnapshot[];
}

export function DashboardClient({ platforms, assetClasses, assets, snapshots }: DashboardClientProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1Y');

  // Compute performance for each active asset
  const performances = useMemo(() => {
    const activeAssets = assets.filter((a) => a.is_active);
    const platformMap = new Map(platforms.map((p) => [p.id, p]));
    const classMap = new Map(assetClasses.map((c) => [c.id, c]));

    return activeAssets.map((asset) => {
      const plat = asset.platform || platformMap.get(asset.platform_id);
      const cls = asset.asset_class || classMap.get(asset.asset_class_id);
      return calculateAssetPerformance(asset, plat, cls, snapshots);
    });
  }, [assets, platforms, assetClasses, snapshots]);

  // Compute portfolio summary metrics for hero cards
  const portfolioSummary = useMemo(() => {
    return calculatePortfolioSummary(performances, selectedTimeframe);
  }, [performances, selectedTimeframe]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar netWorth={portfolioSummary.total_net_worth} />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* 1. Hero Cards with Timeframe Switcher */}
        <HeroCards
          summary={portfolioSummary}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
        />

        {/* 2. Allocation Charts (Recharts Donut Charts & Net Worth Timeline) */}
        <AllocationCharts performances={performances} snapshots={snapshots} />

        {/* 3. Detailed Asset Growth Performance Table */}
        <AssetTable performances={performances} selectedTimeframe={selectedTimeframe} />
      </div>
    </div>
  );
}
