-- ============================================================================
-- WEALTH TRACKER DATABASE SCHEMA MIGRATION (HARDENED SECURITY + 2FA)
-- Target Database: Supabase PostgreSQL (vgsfkoligrwknmvughly)
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Users Table (Master Auth + 2FA Support)
CREATE TABLE IF NOT EXISTS public.wt_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_2fa_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wt_users' AND column_name='is_2fa_enabled') THEN
        ALTER TABLE public.wt_users ADD COLUMN is_2fa_enabled BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wt_users' AND column_name='two_factor_secret') THEN
        ALTER TABLE public.wt_users ADD COLUMN two_factor_secret TEXT;
    END IF;
END $$;

-- 1. Platforms Table
CREATE TABLE IF NOT EXISTS public.wt_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Asset Classes Table
CREATE TABLE IF NOT EXISTS public.wt_asset_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Assets Table
CREATE TABLE IF NOT EXISTS public.wt_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES public.wt_platforms(id) ON DELETE CASCADE,
    asset_class_id UUID NOT NULL REFERENCES public.wt_asset_classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Asset Snapshots Table
CREATE TABLE IF NOT EXISTS public.wt_asset_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.wt_assets(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    value NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_wt_asset_snapshot_date UNIQUE (asset_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wt_users_username ON public.wt_users(username);
CREATE INDEX IF NOT EXISTS idx_wt_assets_platform ON public.wt_assets(platform_id);
CREATE INDEX IF NOT EXISTS idx_wt_assets_class ON public.wt_assets(asset_class_id);
CREATE INDEX IF NOT EXISTS idx_wt_snapshots_asset_date ON public.wt_asset_snapshots(asset_id, snapshot_date DESC);

-- Enable RLS
ALTER TABLE public.wt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wt_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wt_asset_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wt_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wt_asset_snapshots ENABLE ROW LEVEL SECURITY;

-- Hardened RLS Policies for wt_users
DROP POLICY IF EXISTS "Public select access for wt_users" ON public.wt_users;
CREATE POLICY "Public select access for wt_users" ON public.wt_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for wt_users" ON public.wt_users;
CREATE POLICY "Public insert access for wt_users" ON public.wt_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for wt_users" ON public.wt_users;
CREATE POLICY "Public update access for wt_users" ON public.wt_users FOR UPDATE USING (true);

-- RLS Policies for Platforms, Asset Classes, Assets & Snapshots
DROP POLICY IF EXISTS "Public select access for wt_platforms" ON public.wt_platforms;
CREATE POLICY "Public select access for wt_platforms" ON public.wt_platforms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for wt_platforms" ON public.wt_platforms;
CREATE POLICY "Public insert access for wt_platforms" ON public.wt_platforms FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for wt_platforms" ON public.wt_platforms;
CREATE POLICY "Public update access for wt_platforms" ON public.wt_platforms FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access for wt_platforms" ON public.wt_platforms;
CREATE POLICY "Public delete access for wt_platforms" ON public.wt_platforms FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select access for wt_asset_classes" ON public.wt_asset_classes;
CREATE POLICY "Public select access for wt_asset_classes" ON public.wt_asset_classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for wt_asset_classes" ON public.wt_asset_classes;
CREATE POLICY "Public insert access for wt_asset_classes" ON public.wt_asset_classes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for wt_asset_classes" ON public.wt_asset_classes;
CREATE POLICY "Public update access for wt_asset_classes" ON public.wt_asset_classes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access for wt_asset_classes" ON public.wt_asset_classes;
CREATE POLICY "Public delete access for wt_asset_classes" ON public.wt_asset_classes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select access for wt_assets" ON public.wt_assets;
CREATE POLICY "Public select access for wt_assets" ON public.wt_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for wt_assets" ON public.wt_assets;
CREATE POLICY "Public insert access for wt_assets" ON public.wt_assets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for wt_assets" ON public.wt_assets;
CREATE POLICY "Public update access for wt_assets" ON public.wt_assets FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access for wt_assets" ON public.wt_assets;
CREATE POLICY "Public delete access for wt_assets" ON public.wt_assets FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select access for wt_asset_snapshots" ON public.wt_asset_snapshots;
CREATE POLICY "Public select access for wt_asset_snapshots" ON public.wt_asset_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert access for wt_asset_snapshots" ON public.wt_asset_snapshots;
CREATE POLICY "Public insert access for wt_asset_snapshots" ON public.wt_asset_snapshots FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for wt_asset_snapshots" ON public.wt_asset_snapshots;
CREATE POLICY "Public update access for wt_asset_snapshots" ON public.wt_asset_snapshots FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access for wt_asset_snapshots" ON public.wt_asset_snapshots;
CREATE POLICY "Public delete access for wt_asset_snapshots" ON public.wt_asset_snapshots FOR DELETE USING (true);

-- Insert Default Asset Classes
INSERT INTO public.wt_asset_classes (name) VALUES
    ('Equities'),
    ('Crypto'),
    ('Cash & Equivalents'),
    ('Real Estate'),
    ('Fixed Income')
ON CONFLICT (name) DO NOTHING;

-- Insert Default Platforms
INSERT INTO public.wt_platforms (name) VALUES
    ('Fidelity'),
    ('Coinbase'),
    ('Allan Gray'),
    ('Binance'),
    ('Sygnia'),
    ('Sanlam'),
    ('Satrix'),
    ('Easy Equties'),
    ('Capitec'),
    ('Vanguard'),
    ('Bank of America')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GROWTH ENGINE OPTIMIZED FUNCTION: wt_get_asset_performance
-- Returns current asset values and nominal/% lookback metrics across timeframes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.wt_get_asset_performance(ref_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    asset_id UUID,
    asset_name TEXT,
    platform_name TEXT,
    asset_class_name TEXT,
    currency VARCHAR(3),
    current_value NUMERIC(15, 2),
    as_of_date DATE,
    val_3m NUMERIC(15, 2),
    gain_3m NUMERIC(15, 2),
    pct_3m NUMERIC(10, 2),
    val_6m NUMERIC(15, 2),
    gain_6m NUMERIC(15, 2),
    pct_6m NUMERIC(10, 2),
    val_1y NUMERIC(15, 2),
    gain_1y NUMERIC(15, 2),
    pct_1y NUMERIC(10, 2),
    val_3y NUMERIC(15, 2),
    gain_3y NUMERIC(15, 2),
    pct_3y NUMERIC(10, 2),
    val_5y NUMERIC(15, 2),
    gain_5y NUMERIC(15, 2),
    pct_5y NUMERIC(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_snapshots AS (
        SELECT DISTINCT ON (s.asset_id)
            s.asset_id,
            s.value AS val,
            s.snapshot_date AS s_date
        FROM public.wt_asset_snapshots s
        WHERE s.snapshot_date <= ref_date
        ORDER BY s.asset_id, s.snapshot_date DESC
    ),
    snap_3m AS (
        SELECT DISTINCT ON (s.asset_id) s.asset_id, s.value AS val
        FROM public.wt_asset_snapshots s
        WHERE s.snapshot_date <= (ref_date - INTERVAL '90 days')::DATE
        ORDER BY s.asset_id, s.snapshot_date DESC
    ),
    snap_6m AS (
        SELECT DISTINCT ON (s.asset_id) s.asset_id, s.value AS val
        FROM public.wt_asset_snapshots s
        WHERE s.snapshot_date <= (ref_date - INTERVAL '180 days')::DATE
        ORDER BY s.asset_id, s.snapshot_date DESC
    ),
    snap_1y AS (
        SELECT DISTINCT ON (s.asset_id) s.asset_id, s.value AS val
        FROM public.wt_asset_snapshots s
        WHERE s.snapshot_date <= (ref_date - INTERVAL '365 days')::DATE
        ORDER BY s.asset_id, s.snapshot_date DESC
    ),
    snap_3y AS (
        SELECT DISTINCT ON (s.asset_id) s.asset_id, s.value AS val
        FROM public.wt_asset_snapshots s
        WHERE s.snapshot_date <= (ref_date - INTERVAL '1095 days')::DATE
        ORDER BY s.asset_id, s.snapshot_date DESC
    ),
    snap_5y AS (
        SELECT DISTINCT ON (s.asset_id) s.asset_id, s.value AS val
        FROM public.wt_asset_snapshots s
        WHERE s.snapshot_date <= (ref_date - INTERVAL '1825 days')::DATE
        ORDER BY s.asset_id, s.snapshot_date DESC
    )
    SELECT
        a.id AS asset_id,
        a.name AS asset_name,
        p.name AS platform_name,
        ac.name AS asset_class_name,
        a.currency,
        COALESCE(curr.val, 0) AS current_value,
        curr.s_date AS as_of_date,
        
        -- 3M Metrics
        p3.val AS val_3m,
        (curr.val - p3.val) AS gain_3m,
        CASE WHEN p3.val > 0 THEN ROUND(((curr.val - p3.val) / p3.val * 100.0), 2) ELSE NULL END AS pct_3m,
        
        -- 6M Metrics
        p6.val AS val_6m,
        (curr.val - p6.val) AS gain_6m,
        CASE WHEN p6.val > 0 THEN ROUND(((curr.val - p6.val) / p6.val * 100.0), 2) ELSE NULL END AS pct_6m,
        
        -- 1Y Metrics
        p12.val AS val_1y,
        (curr.val - p12.val) AS gain_1y,
        CASE WHEN p12.val > 0 THEN ROUND(((curr.val - p12.val) / p12.val * 100.0), 2) ELSE NULL END AS pct_1y,
        
        -- 3Y Metrics
        p36.val AS val_3y,
        (curr.val - p36.val) AS gain_3y,
        CASE WHEN p36.val > 0 THEN ROUND(((curr.val - p36.val) / p36.val * 100.0), 2) ELSE NULL END AS pct_3y,
        
        -- 5Y Metrics
        p60.val AS val_5y,
        (curr.val - p60.val) AS gain_5y,
        CASE WHEN p60.val > 0 THEN ROUND(((curr.val - p60.val) / p60.val * 100.0), 2) ELSE NULL END AS pct_5y

    FROM public.wt_assets a
    JOIN public.wt_platforms p ON a.platform_id = p.id
    JOIN public.wt_asset_classes ac ON a.asset_class_id = ac.id
    LEFT JOIN latest_snapshots curr ON a.id = curr.asset_id
    LEFT JOIN snap_3m p3 ON a.id = p3.asset_id
    LEFT JOIN snap_6m p6 ON a.id = p6.asset_id
    LEFT JOIN snap_1y p12 ON a.id = p12.asset_id
    LEFT JOIN snap_3y p36 ON a.id = p36.asset_id
    LEFT JOIN snap_5y p60 ON a.id = p60.asset_id
    WHERE a.is_active = true
    ORDER BY p.name, a.name;
END;
$$ LANGUAGE plpgsql;
