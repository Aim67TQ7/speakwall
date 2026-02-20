-- Supabase PostgreSQL schema for PublicSpeakingSim (Speakwall)
-- Uses auth.users for authentication (no custom users table)

create table if not exists public.speakwall_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  started_at timestamptz not null default now(),
  duration_sec int,
  recording_key text,
  status text not null default 'uploaded' -- uploaded|processing|analyzed|completed|failed
);

create table if not exists public.speakwall_analyses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.speakwall_sessions(id) on delete cascade,
  words_per_minute numeric,
  filler jsonb, -- [{word, count}]
  transcript text,
  recommendations text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.speakwall_sessions enable row level security;
alter table public.speakwall_analyses enable row level security;

create policy "speakwall_session_owner"
  on public.speakwall_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "speakwall_analysis_owner"
  on public.speakwall_analyses for all
  using (exists(select 1 from public.speakwall_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists(select 1 from public.speakwall_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- Convenience view
create or replace view public.speakwall_session_counts as
select user_id, count(*)::int as total
from public.speakwall_sessions
group by user_id;

