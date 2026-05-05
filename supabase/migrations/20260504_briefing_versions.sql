-- briefing_versions: snapshot-based versioning of comprehensive PDF
-- briefings generated from /analyze. No file storage — the snapshot
-- jsonb captures the full data state at generation time, and the
-- /analyze/briefing-print/[id] route re-renders the same layout from
-- it for browser-print or re-download.

create table if not exists public.briefing_versions (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users(id) on delete set null,
  theme_generation_id uuid,
  contribution_count int not null default 0,
  theme_count int not null default 0,
  filter_state jsonb not null default '{}'::jsonb,
  snapshot_data jsonb not null default '{}'::jsonb,
  executive_summary text,
  briefing_label text
);

create index if not exists briefing_versions_generated_at_idx
  on public.briefing_versions (generated_at desc);

alter table public.briefing_versions enable row level security;

-- Read: any authenticated user. /analyze itself is stakeholder-gated
-- at the app layer, so authenticated == stakeholder for this table.
create policy "briefing_versions_select_authenticated"
  on public.briefing_versions
  for select
  to authenticated
  using (true);

-- Insert: authenticated users only; generated_by must equal the
-- caller's auth.uid() to prevent impersonation. The API route uses
-- the service-role key, which bypasses RLS — this policy is the
-- belt-and-suspenders constraint for any future direct-from-client
-- inserts.
create policy "briefing_versions_insert_self"
  on public.briefing_versions
  for insert
  to authenticated
  with check (generated_by = auth.uid());

-- No update/delete policies — briefings are immutable artifacts.
