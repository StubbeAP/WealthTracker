'use server';

import { supabase } from '@/lib/supabase';
import { Platform, AssetClass, Asset, AssetSnapshot } from '@/lib/types';
import { DEFAULT_PLATFORMS, DEFAULT_ASSET_CLASSES, DEFAULT_ASSETS, generateDemoSnapshots } from '@/lib/store';
import { revalidatePath } from 'next/cache';

// Authenticate User against Supabase wt_users
export async function authenticateUserAction(username: string, passHash: string): Promise<{
  success: boolean;
  error?: string;
  is2FAEnabled?: boolean;
  twoFactorSecret?: string;
}> {
  try {
    const { data: users, error } = await supabase
      .from('wt_users')
      .select('*')
      .ilike('username', username.trim());

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return { success: false, error: 'TABLE_NOT_FOUND' };
      }
      if (error.code === 'PGRST204' || error.message?.includes('is_2fa_enabled')) {
        // If 2FA columns not added to DB yet, fallback query basic credentials
        const { data: basicUsers } = await supabase
          .from('wt_users')
          .select('id, username, password_hash')
          .ilike('username', username.trim());

        if (basicUsers && basicUsers.length > 0 && basicUsers[0].password_hash === passHash) {
          return { success: true, is2FAEnabled: false };
        }
        return { success: false, error: 'Incorrect password.' };
      }
      throw error;
    }

    if (!users || users.length === 0) {
      return { success: false, error: 'User not found. Please register an account first.' };
    }

    const user = users[0];
    if (user.password_hash === passHash) {
      return {
        success: true,
        is2FAEnabled: !!user.is_2fa_enabled,
        twoFactorSecret: user.two_factor_secret || undefined,
      };
    } else {
      return { success: false, error: 'Incorrect password.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication error' };
  }
}

// Register User in Supabase wt_users
export async function registerUserAction(username: string, passHash: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wt_users')
      .insert({
        username: username.trim(),
        password_hash: passHash,
      });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return { success: true };
      }
      if (error.code === '23505') {
        return { success: false, error: 'Username already exists. Please login instead.' };
      }
      throw error;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' };
  }
}

// Enable 2FA for user
export async function enable2FAAction(username: string, secret: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wt_users')
      .update({
        is_2fa_enabled: true,
        two_factor_secret: secret,
        updated_at: new Date().toISOString(),
      })
      .ilike('username', username.trim());

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to enable 2FA in database. Please run SQL migration script.' };
  }
}

// Disable 2FA for user
export async function disable2FAAction(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wt_users')
      .update({
        is_2fa_enabled: false,
        two_factor_secret: null,
        updated_at: new Date().toISOString(),
      })
      .ilike('username', username.trim());

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to disable 2FA' };
  }
}

// Change User Password in Supabase wt_users
export async function changePasswordAction(username: string, currentPassHash: string, newPassHash: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: users, error: selectErr } = await supabase
      .from('wt_users')
      .select('*')
      .ilike('username', username.trim());

    if (selectErr || !users || users.length === 0) {
      return { success: false, error: 'User not found.' };
    }

    const user = users[0];
    if (user.password_hash !== currentPassHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const { error: updateErr } = await supabase
      .from('wt_users')
      .update({ password_hash: newPassHash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update password' };
  }
}

// Fetch Platforms
export async function getPlatforms(): Promise<Platform[]> {
  try {
    const { data, error } = await supabase
      .from('wt_platforms')
      .select('*')
      .order('name');
    if (error || !data || data.length === 0) {
      return DEFAULT_PLATFORMS;
    }
    return data;
  } catch {
    return DEFAULT_PLATFORMS;
  }
}

// Fetch Asset Classes
export async function getAssetClasses(): Promise<AssetClass[]> {
  try {
    const { data, error } = await supabase
      .from('wt_asset_classes')
      .select('*')
      .order('name');
    if (error || !data || data.length === 0) {
      return DEFAULT_ASSET_CLASSES;
    }
    return data;
  } catch {
    return DEFAULT_ASSET_CLASSES;
  }
}

// Fetch Assets
export async function getAssets(): Promise<Asset[]> {
  try {
    const { data, error } = await supabase
      .from('wt_assets')
      .select(`
        *,
        platform:wt_platforms(*),
        asset_class:wt_asset_classes(*)
      `)
      .order('name');

    if (error || !data || data.length === 0) {
      const platforms = DEFAULT_PLATFORMS;
      const classes = DEFAULT_ASSET_CLASSES;
      return DEFAULT_ASSETS.map((a) => ({
        ...a,
        platform: platforms.find((p) => p.id === a.platform_id),
        asset_class: classes.find((c) => c.id === a.asset_class_id),
      }));
    }

    return data;
  } catch {
    const platforms = DEFAULT_PLATFORMS;
    const classes = DEFAULT_ASSET_CLASSES;
    return DEFAULT_ASSETS.map((a) => ({
      ...a,
      platform: platforms.find((p) => p.id === a.platform_id),
      asset_class: classes.find((c) => c.id === a.asset_class_id),
    }));
  }
}

// Fetch Asset Snapshots
export async function getSnapshots(): Promise<AssetSnapshot[]> {
  try {
    const { data, error } = await supabase
      .from('wt_asset_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true });

    if (error || !data || data.length === 0) {
      return generateDemoSnapshots(DEFAULT_ASSETS);
    }

    return data.map((s) => ({
      ...s,
      value: Number(s.value),
    }));
  } catch {
    return generateDemoSnapshots(DEFAULT_ASSETS);
  }
}

// Create Platform
export async function createPlatform(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wt_platforms')
      .insert({ name });

    if (error) throw error;
    revalidatePath('/');
    revalidatePath('/assets');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create platform' };
  }
}

// Create Asset Class
export async function createAssetClass(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wt_asset_classes')
      .insert({ name });

    if (error) throw error;
    revalidatePath('/');
    revalidatePath('/assets');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create asset class' };
  }
}

// Create Asset
export async function createAsset(asset: {
  platform_id: string;
  asset_class_id: string;
  name: string;
  currency?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('wt_assets').insert({
      platform_id: asset.platform_id,
      asset_class_id: asset.asset_class_id,
      name: asset.name,
      currency: asset.currency || 'ZAR',
      is_active: true,
    });

    if (error) throw error;
    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/snapshots');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create asset' };
  }
}

// Toggle Asset Active Status
export async function toggleAssetActive(
  assetId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wt_assets')
      .update({ is_active: isActive })
      .eq('id', assetId);

    if (error) throw error;
    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/snapshots');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update asset status' };
  }
}

// Save Batch Snapshots
export async function saveBatchSnapshots(
  entries: { asset_id: string; value: number; snapshot_date: string; notes?: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const validEntries = entries.filter((e) => e.value !== null && !isNaN(e.value));
    if (validEntries.length === 0) {
      return { success: false, error: 'No valid snapshot values provided.' };
    }

    const { error } = await supabase.from('wt_asset_snapshots').upsert(
      validEntries.map((e) => ({
        asset_id: e.asset_id,
        snapshot_date: e.snapshot_date,
        value: e.value,
        notes: e.notes || null,
      })),
      { onConflict: 'asset_id,snapshot_date' }
    );

    if (error) throw error;
    revalidatePath('/');
    revalidatePath('/snapshots');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save snapshots' };
  }
}

// Seed Demo Data into Supabase
export async function seedDemoDataAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: platforms, error: pErr } = await supabase
      .from('wt_platforms')
      .upsert(DEFAULT_PLATFORMS.map((p) => ({ name: p.name })), { onConflict: 'name' })
      .select();

    if (pErr) throw pErr;

    const { data: classes, error: cErr } = await supabase
      .from('wt_asset_classes')
      .upsert(DEFAULT_ASSET_CLASSES.map((c) => ({ name: c.name })), { onConflict: 'name' })
      .select();

    if (cErr) throw cErr;

    if (!platforms || !classes) throw new Error('Failed to retrieve seeded metadata');

    const platformMap = new Map(platforms.map((p) => [p.name, p.id]));
    const classMap = new Map(classes.map((c) => [c.name, c.id]));

    const assetsToInsert = DEFAULT_ASSETS.map((a) => {
      const pName = DEFAULT_PLATFORMS.find((p) => p.id === a.platform_id)?.name || 'Fidelity';
      const cName = DEFAULT_ASSET_CLASSES.find((c) => c.id === a.asset_class_id)?.name || 'Equities';
      return {
        name: a.name,
        currency: a.currency,
        is_active: a.is_active,
        platform_id: platformMap.get(pName) || platforms[0].id,
        asset_class_id: classMap.get(cName) || classes[0].id,
      };
    });

    const { data: insertedAssets, error: aErr } = await supabase
      .from('wt_assets')
      .upsert(assetsToInsert, { onConflict: 'name' })
      .select();

    if (aErr) throw aErr;
    if (!insertedAssets) throw new Error('Failed to seed assets');

    const demoSnapshots = generateDemoSnapshots(insertedAssets as Asset[]);
    const snapshotsToInsert = demoSnapshots.map((s) => ({
      asset_id: s.asset_id,
      snapshot_date: s.snapshot_date,
      value: s.value,
      notes: s.notes,
    }));

    const { error: sErr } = await supabase
      .from('wt_asset_snapshots')
      .upsert(snapshotsToInsert, { onConflict: 'asset_id,snapshot_date' });

    if (sErr) throw sErr;

    revalidatePath('/');
    revalidatePath('/snapshots');
    revalidatePath('/assets');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to seed database' };
  }
}
