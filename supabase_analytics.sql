create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  name_input text,
  page_url text,
  created_at timestamptz not null default now()
);

alter table public.analytics_events
  drop column if exists session_id,
  drop column if exists device_type,
  drop column if exists browser,
  drop column if exists country,
  drop column if exists city;

create index if not exists analytics_events_event_type_idx
  on public.analytics_events (event_type);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_name_input_idx
  on public.analytics_events (name_input);

create index if not exists analytics_events_page_url_idx
  on public.analytics_events (page_url);

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
