create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists admin_audit_log_entity_idx on public.admin_audit_log(entity_type, entity_id);
create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);

alter table public.admin_audit_log enable row level security;
