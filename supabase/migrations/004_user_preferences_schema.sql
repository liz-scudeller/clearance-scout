alter table public.profiles
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists province text default 'BC',
  add column if not exists postal_code text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists updated_at timestamp with time zone not null default now();

create table if not exists public.saved_deals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (user_id, deal_id)
);

create table if not exists public.hidden_deals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (user_id, deal_id)
);

create table if not exists public.alert_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default true,
  radius integer not null default 10,
  minimum_confidence integer not null default 60,
  categories text[] not null default array['furniture','electronics','sports'],
  sale_types text[] not null default array['store_closing','clearance','warehouse_sale'],
  cities text not null default '',
  updated_at timestamp with time zone not null default now()
);

create index if not exists saved_deals_deal_id_idx on public.saved_deals(deal_id);
create index if not exists hidden_deals_deal_id_idx on public.hidden_deals(deal_id);

alter table public.saved_deals enable row level security;
alter table public.hidden_deals enable row level security;
alter table public.alert_preferences enable row level security;

create policy "Users can read own saved deals" on public.saved_deals for select using (auth.uid() = user_id);
create policy "Users can save own deals" on public.saved_deals for insert with check (auth.uid() = user_id);
create policy "Users can remove own saved deals" on public.saved_deals for delete using (auth.uid() = user_id);

create policy "Users can read own hidden deals" on public.hidden_deals for select using (auth.uid() = user_id);
create policy "Users can hide own deals" on public.hidden_deals for insert with check (auth.uid() = user_id);
create policy "Users can remove own hidden deals" on public.hidden_deals for delete using (auth.uid() = user_id);

create policy "Users can read own alert preferences" on public.alert_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own alert preferences" on public.alert_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own alert preferences" on public.alert_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Profiles can update own profile" on public.profiles;
create policy "Profiles can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
