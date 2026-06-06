create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user',
  created_at timestamp with time zone not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  store_name text not null,
  address text not null,
  city text not null,
  province text not null,
  postal_code text,
  category text not null check (category in ('clothing','shoes','sports','furniture','home','electronics','toys','baby','beauty','grocery','tools','other')),
  sale_type text not null check (sale_type in ('store_closing','clearance','warehouse_sale','relocation_sale','final_sale','floor_model_sale','other')),
  discount_text text not null,
  description text not null,
  source_type text not null check (source_type in ('user_report','official_site','flyer','facebook_link','reddit','event','other')),
  source_url text,
  image_url text,
  status text not null default 'pending' check (status in ('pending','active','rejected','expired','possibly_expired')),
  confidence_score integer not null default 50,
  reported_by uuid references public.profiles(id),
  start_date date,
  expires_at date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.deal_confirmations (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confirmation_status text not null check (confirmation_status in ('active','expired')),
  created_at timestamp with time zone not null default now()
);

create index if not exists deals_city_idx on public.deals(city);
create index if not exists deals_category_idx on public.deals(category);
create index if not exists deals_sale_type_idx on public.deals(sale_type);
create index if not exists deals_status_idx on public.deals(status);
create index if not exists deal_confirmations_deal_id_idx on public.deal_confirmations(deal_id);

create or replace view public.deals_with_confirmation_counts as
select d.*, count(dc.id)::integer as confirmation_count,
count(dc.id) filter (where dc.confirmation_status = 'active')::integer as active_confirmation_count,
count(dc.id) filter (where dc.confirmation_status = 'expired')::integer as expired_confirmation_count
from public.deals d
left join public.deal_confirmations dc on dc.deal_id = d.id
group by d.id;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.deal_confirmations enable row level security;

create policy "Profiles are readable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Profiles can be inserted by owner" on public.profiles for insert with check (auth.uid() = id);
create policy "Approved deals are public" on public.deals for select using (status in ('active','possibly_expired'));
create policy "Users can insert pending deals" on public.deals for insert with check (auth.uid() = reported_by and status = 'pending');
create policy "Users can read own submitted deals" on public.deals for select using (auth.uid() = reported_by);
create policy "Users can insert confirmations" on public.deal_confirmations for insert with check (auth.uid() = user_id);
create policy "Users can read confirmations" on public.deal_confirmations for select using (true);
