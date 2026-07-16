-- Osgood OS v0.7 Event Detail Workflow
-- Run once after migration 004.

alter table public.events
  add column if not exists workflow_stage text not null default 'planning',
  add column if not exists primary_contact text,
  add column if not exists primary_phone text,
  add column if not exists emergency_contact text,
  add column if not exists emergency_phone text,
  add column if not exists floor_plan_status text not null default 'not_started',
  add column if not exists final_guest_count integer,
  add column if not exists event_manager text,
  add column if not exists bar_manager text,
  add column if not exists security_lead text,
  add column if not exists setup_lead text,
  add column if not exists cleanup_lead text,
  add column if not exists incident_notes text;

create table if not exists public.event_vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_type text not null,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  arrival_time time,
  departure_time time,
  notes text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.event_rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  room_name text not null,
  setup_style text,
  table_count integer not null default 0,
  chair_count integer not null default 0,
  linen_color text,
  layout_notes text,
  ready boolean not null default false,
  unique(event_id,room_name)
);

alter table public.event_checklist
  add column if not exists category text not null default 'General',
  add column if not exists due_date date,
  add column if not exists responsible_staff text,
  add column if not exists notes text;

alter table public.event_vendors enable row level security;
alter table public.event_rooms enable row level security;

drop policy if exists "osgood_vendors_select" on public.event_vendors;
drop policy if exists "osgood_vendors_insert" on public.event_vendors;
drop policy if exists "osgood_vendors_update" on public.event_vendors;
drop policy if exists "osgood_vendors_delete" on public.event_vendors;

create policy "osgood_vendors_select" on public.event_vendors
for select to authenticated using (public.is_active_staff());
create policy "osgood_vendors_insert" on public.event_vendors
for insert to authenticated with check (public.is_active_staff());
create policy "osgood_vendors_update" on public.event_vendors
for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "osgood_vendors_delete" on public.event_vendors
for delete to authenticated using (public.is_active_staff());

drop policy if exists "osgood_rooms_select" on public.event_rooms;
drop policy if exists "osgood_rooms_insert" on public.event_rooms;
drop policy if exists "osgood_rooms_update" on public.event_rooms;
drop policy if exists "osgood_rooms_delete" on public.event_rooms;

create policy "osgood_rooms_select" on public.event_rooms
for select to authenticated using (public.is_active_staff());
create policy "osgood_rooms_insert" on public.event_rooms
for insert to authenticated with check (public.is_active_staff());
create policy "osgood_rooms_update" on public.event_rooms
for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "osgood_rooms_delete" on public.event_rooms
for delete to authenticated using (public.is_active_staff());

-- Categorize existing checklist items.
update public.event_checklist set category='Sales & Finance' where item_key in ('contract_signed','deposit_received','final_payment');
update public.event_checklist set category='Planning' where item_key in ('floor_plan','linens','tables_chairs');
update public.event_checklist set category='Vendors & Staffing' where item_key in ('security','bartenders','caterer');
update public.event_checklist set category='Event Readiness' where item_key in ('cleaning','walkthrough');

-- Add more standard checklist items.
insert into public.event_checklist(event_id,item_key,label,category,sort_order)
select e.id,x.item_key,x.label,x.category,x.sort_order
from public.events e
cross join (values
  ('insurance_received','Insurance certificate received','Sales & Finance',15),
  ('payment_schedule_confirmed','Payment schedule confirmed','Sales & Finance',25),
  ('guest_count_final','Final guest count received','Planning',35),
  ('timeline_approved','Event timeline approved','Planning',45),
  ('vendor_list_complete','Vendor list complete','Vendors & Staffing',75),
  ('staff_assignments','Staff assignments confirmed','Vendors & Staffing',85),
  ('room_setup_complete','Room setup complete','Event Readiness',105),
  ('av_tested','AV and sound tested','Event Readiness',115),
  ('bar_stocked','Bar stocked','Event Readiness',125),
  ('post_event_inspection','Post-event inspection complete','Post Event',135),
  ('damage_report','Damage report completed','Post Event',145),
  ('final_cleanup','Final cleanup complete','Post Event',155)
) as x(item_key,label,category,sort_order)
on conflict(event_id,item_key) do nothing;
