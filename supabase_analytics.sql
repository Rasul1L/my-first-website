create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  name_input text,
  page_url text,
  session_id text,
  device_type text,
  browser text,
  country text,
  city text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_type_idx
  on public.analytics_events (event_type);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_name_input_idx
  on public.analytics_events (name_input);

create index if not exists analytics_events_page_url_idx
  on public.analytics_events (page_url);

create index if not exists analytics_events_session_id_idx
  on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;

drop policy if exists "Allow public analytics inserts" on public.analytics_events;
create policy "Allow public analytics inserts"
  on public.analytics_events
  for insert
  to anon
  with check (true);

drop policy if exists "Allow public analytics reads" on public.analytics_events;
create policy "Allow public analytics reads"
  on public.analytics_events
  for select
  to anon
  using (true);
