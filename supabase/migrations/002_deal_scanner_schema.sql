create table if not exists public.deal_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,
  base_url text not null,
  city text,
  province text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.raw_deal_mentions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.deal_sources(id) on delete set null,
  title text not null,
  snippet text,
  raw_text text,
  source_url text,
  source_type text,
  city text,
  province text,
  detected_keywords text[] not null default '{}',
  classification_status text not null default 'new',
  classification_result jsonb,
  confidence_score integer not null default 0,
  converted_deal_id uuid references public.deals(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.scanner_runs (
  id uuid primary key default gen_random_uuid(),
  scanner_name text not null,
  status text not null,
  started_at timestamp with time zone not null default now(),
  finished_at timestamp with time zone,
  results_found integer not null default 0,
  results_saved integer not null default 0,
  error_message text
);

alter table public.deals
  add column if not exists source_confidence integer not null default 50,
  add column if not exists source_id uuid references public.deal_sources(id) on delete set null,
  add column if not exists raw_mention_id uuid references public.raw_deal_mentions(id) on delete set null,
  add column if not exists detection_method text not null default 'user_report';

create index if not exists deal_sources_active_idx on public.deal_sources(is_active);
create index if not exists raw_deal_mentions_status_idx on public.raw_deal_mentions(classification_status);
create index if not exists raw_deal_mentions_source_url_idx on public.raw_deal_mentions(source_url);
create index if not exists scanner_runs_started_at_idx on public.scanner_runs(started_at);

drop view if exists public.deals_with_confirmation_counts;

create view public.deals_with_confirmation_counts as
select
  d.*,
  count(dc.id)::integer as confirmation_count,
  count(dc.id) filter (where dc.confirmation_status = 'active')::integer as active_confirmation_count,
  count(dc.id) filter (where dc.confirmation_status = 'expired')::integer as expired_confirmation_count
from public.deals d
left join public.deal_confirmations dc on dc.deal_id = d.id
group by d.id;

insert into public.deal_sources (name, source_type, base_url, city, province)
values
  ('The City of Lougheed', 'mall', 'https://thecityoflougheed.com/', 'Burnaby', 'BC'),
  ('Metropolis at Metrotown', 'mall', 'https://metropolisatmetrotown.com/', 'Burnaby', 'BC'),
  ('Coquitlam Centre', 'mall', 'https://coquitlamcentre.com/', 'Coquitlam', 'BC')
on conflict do nothing;
