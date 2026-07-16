-- Osgood OS v1.0 Ballroom Floor Planner
-- Run once after migration 006.

create table if not exists public.floor_plans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  name text not null,
  room_type text not null default 'Ballroom',
  status text not null default 'draft',
  revision integer not null default 1,
  items jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists floor_plans_event_id_idx on public.floor_plans(event_id);
create index if not exists floor_plans_updated_at_idx on public.floor_plans(updated_at desc);

drop trigger if exists floor_plans_set_updated_at on public.floor_plans;
create trigger floor_plans_set_updated_at
before update on public.floor_plans
for each row execute function public.set_updated_at();

alter table public.floor_plans enable row level security;

drop policy if exists "osgood_floor_plans_select" on public.floor_plans;
drop policy if exists "osgood_floor_plans_insert" on public.floor_plans;
drop policy if exists "osgood_floor_plans_update" on public.floor_plans;
drop policy if exists "osgood_floor_plans_delete" on public.floor_plans;

create policy "osgood_floor_plans_select"
on public.floor_plans for select to authenticated
using (public.is_active_staff());

create policy "osgood_floor_plans_insert"
on public.floor_plans for insert to authenticated
with check (public.is_active_staff());

create policy "osgood_floor_plans_update"
on public.floor_plans for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "osgood_floor_plans_delete"
on public.floor_plans for delete to authenticated
using (public.is_admin());
