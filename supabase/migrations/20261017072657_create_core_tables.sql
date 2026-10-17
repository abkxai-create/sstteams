/*
# Create ScaffoldAlloc core tables (single-tenant, no auth)

1. Plain-English
This gives the scaffolding allocation app real shared database storage, replacing
browser-only storage. Workers, sites, and day-by-day site assignments are stored
in Supabase so any computer opening the app sees the same data.

2. New Tables
- `workers`: master workforce list.
  - `id` text primary key (client generated)
  - `emp_code` text, `name` text not null, `designation` text not null
  - `company` text not null, `sheet_source` text not null
  - `current_site` text, `phone` text, `status` text not null default 'active'
  - `notes` text, `sort_order` integer not null default 0, `created_at` timestamptz
- `sites`: master worksite list.
  - `id` text primary key, `name` text not null, `code`, `location`, `incharge_name`,
    `reporting_time` text, `target_headcount` int, `notes`, `sort_order` int default 0
- `allocations`: one row per (work_date, site) holding the crew for that day.
  - `id` uuid pk, `work_date` date not null, `site_id` text not null -> sites(id) on delete cascade
  - `foreman_id` text (worker id, no FK to avoid cross-table delete coupling)
  - `worker_ids` jsonb array of worker ids (ordered)
  - unique(work_date, site_id)
  - `updated_at` timestamptz default now()

3. Security
- RLS enabled on all three tables.
- No sign-in screen in this app, so policies allow anon + authenticated (intentionally
  shared single-tenant data, documented per policy).

4. Notes
- Foreign keys: allocations.site_id -> sites.id ON DELETE CASCADE.
- Index on allocations(work_date) for the daily load query.
*/

CREATE TABLE IF NOT EXISTS workers (
  id text PRIMARY KEY,
  emp_code text NOT NULL DEFAULT '',
  name text NOT NULL,
  designation text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  sheet_source text NOT NULL DEFAULT '',
  current_site text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sites (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text,
  location text,
  incharge_name text,
  reporting_time text,
  target_headcount integer,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_date date NOT NULL,
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  foreman_id text,
  worker_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (work_date, site_id)
);

CREATE INDEX IF NOT EXISTS idx_allocations_work_date ON allocations(work_date);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workers" ON workers;
CREATE POLICY "anon_select_workers" ON workers FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_workers" ON workers;
CREATE POLICY "anon_insert_workers" ON workers FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_workers" ON workers;
CREATE POLICY "anon_update_workers" ON workers FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_workers" ON workers;
CREATE POLICY "anon_delete_workers" ON workers FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_sites" ON sites;
CREATE POLICY "anon_select_sites" ON sites FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sites" ON sites;
CREATE POLICY "anon_insert_sites" ON sites FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sites" ON sites;
CREATE POLICY "anon_update_sites" ON sites FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sites" ON sites;
CREATE POLICY "anon_delete_sites" ON sites FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_allocations" ON allocations;
CREATE POLICY "anon_select_allocations" ON allocations FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_allocations" ON allocations;
CREATE POLICY "anon_insert_allocations" ON allocations FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_allocations" ON allocations;
CREATE POLICY "anon_update_allocations" ON allocations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_allocations" ON allocations;
CREATE POLICY "anon_delete_allocations" ON allocations FOR DELETE
TO anon, authenticated USING (true);