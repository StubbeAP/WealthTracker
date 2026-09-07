import { getPlatforms, getAssetClasses, getAssets, getSnapshots } from '@/app/actions';
import { DashboardClient } from './dashboard-client';

export const revalidate = 0;

export default async function DashboardPage() {
  const [platforms, assetClasses, assets, snapshots] = await Promise.all([
    getPlatforms(),
    getAssetClasses(),
    getAssets(),
    getSnapshots(),
  ]);

  return (
    <DashboardClient
      platforms={platforms}
      assetClasses={assetClasses}
      assets={assets}
      snapshots={snapshots}
    />
  );
}
