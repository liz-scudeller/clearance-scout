alter table public.raw_deal_mentions
  add column if not exists source_published_at timestamp with time zone;

alter table public.deals
  add column if not exists source_published_at timestamp with time zone;
