-- Osgood OS v0.6 Calendar and Event Operations
-- Safe to run once after migration 002.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  lead_id text references public.leads(id) on delete set null,
  title text not null,
  event_type text not null default 'Other',
  status text not null default 'scheduled',
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  guest_count integer not null default 0,
  spaces text[] not null default '{}',
  assigned_staff text[] not null default '{}',
  vendor_notes text,
  setup_notes text,
  teardown_notes text,
  internal_notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (end_at >= start_at)
);

create table if not exists public.event_checklist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  item_key text not null,
  label text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  sort_order integer not null default 0,
  unique(event_id,item_key)
);

create table if not exists public.event_timeline (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  item_time time,
  title text not null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.event_checklist enable row level security;
alter table public.event_timeline enable row level security;

drop policy if exists "osgood_events_select" on public.events;
drop policy if exists "osgood_events_insert" on public.events;
drop policy if exists "osgood_events_update" on public.events;
drop policy if exists "osgood_events_delete" on public.events;

create policy "osgood_events_select"
on public.events for select to authenticated
using (public.is_active_staff());

create policy "osgood_events_insert"
on public.events for insert to authenticated
with check (public.is_active_staff());

create policy "osgood_events_update"
on public.events for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "osgood_events_delete"
on public.events for delete to authenticated
using (public.is_admin());

drop policy if exists "osgood_checklist_select" on public.event_checklist;
drop policy if exists "osgood_checklist_insert" on public.event_checklist;
drop policy if exists "osgood_checklist_update" on public.event_checklist;
drop policy if exists "osgood_checklist_delete" on public.event_checklist;

create policy "osgood_checklist_select"
on public.event_checklist for select to authenticated
using (public.is_active_staff());

create policy "osgood_checklist_insert"
on public.event_checklist for insert to authenticated
with check (public.is_active_staff());

create policy "osgood_checklist_update"
on public.event_checklist for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "osgood_checklist_delete"
on public.event_checklist for delete to authenticated
using (public.is_active_staff());

drop policy if exists "osgood_timeline_select" on public.event_timeline;
drop policy if exists "osgood_timeline_insert" on public.event_timeline;
drop policy if exists "osgood_timeline_update" on public.event_timeline;
drop policy if exists "osgood_timeline_delete" on public.event_timeline;

create policy "osgood_timeline_select"
on public.event_timeline for select to authenticated
using (public.is_active_staff());

create policy "osgood_timeline_insert"
on public.event_timeline for insert to authenticated
with check (public.is_active_staff());

create policy "osgood_timeline_update"
on public.event_timeline for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "osgood_timeline_delete"
on public.event_timeline for delete to authenticated
using (public.is_active_staff());

do $$
begin
  begin
    alter publication supabase_realtime add table public.events;
  exception when duplicate_object then null;
  end;
end $$;

-- Import booked/current leads into the calendar when they have an event date.
insert into public.events
(lead_id,title,event_type,status,start_at,end_at,all_day,guest_count,spaces,assigned_staff,internal_notes)
select
  l.id,
  l.name,
  l.event_type,
  case when l.status='lost' then 'cancelled' else 'scheduled' end,
  (l.event_date::text || ' 09:00:00 America/Detroit')::timestamptz,
  (l.event_date::text || ' 23:00:00 America/Detroit')::timestamptz,
  false,
  l.guests,
  '{}',
  case when coalesce(l.assigned_staff,'')='' then '{}' else string_to_array(l.assigned_staff,',') end,
  l.notes
from public.leads l
where l.event_date is not null
  and not exists(select 1 from public.events e where e.lead_id=l.id);

-- Standard operating checklist for existing calendar events.
insert into public.event_checklist(event_id,item_key,label,sort_order)
select e.id, x.item_key, x.label, x.sort_order
from public.events e
cross join (values
  ('contract_signed','Contract signed',10),
  ('deposit_received','Deposit received',20),
  ('final_payment','Final payment received',30),
  ('floor_plan','Floor plan approved',40),
  ('linens','Linens confirmed',50),
  ('tables_chairs','Tables and chairs confirmed',60),
  ('security','Security scheduled',70),
  ('bartenders','Bartenders scheduled',80),
  ('caterer','Caterer confirmed',90),
  ('cleaning','Cleaning scheduled',100),
  ('walkthrough','Final walkthrough complete',110)
) as x(item_key,label,sort_order)
on conflict(event_id,item_key) do nothing;
