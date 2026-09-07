import { getPlatforms, getAssets, getSnapshots } from '@/app/actions';
import { Navbar } from '@/components/navbar';
import { BulkEntryGrid } from '@/components/snapshots/bulk-entry-grid';

export const revalidate = 0;

export default async function SnapshotsPage() {
  const [platforms, assets, snapshots] = await Promise.all([
    getPlatforms(),
    getAssets(),
    getSnapshots(),
  ]);

  const totalNetWorth = assets
    .filter((a) => a.is_active)
    .reduce((sum, asset) => {
      const assetSnapshots = snapshots
        .filter((s) => s.asset_id === asset.id)
        .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime());
      return sum + (assetSnapshots[0]?.value ? Number(assetSnapshots[0].value) : 0);
    }, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar netWorth={totalNetWorth} />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <BulkEntryGrid assets={assets} snapshots={snapshots} platforms={platforms} />
      </div>
    </div>
  );
}
