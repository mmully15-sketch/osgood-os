-- Osgood OS compatibility migration for the existing database.
-- Safe to run once against the schema containing:
-- profiles, leads, quotes, tasks, and activity_log.

create extension if not exists pgcrypto;

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- Automatically create a profile whenever a Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,email,full_name,role,active)
  values(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    'staff',
    true
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper functions used by Row Level Security.
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;

-- Replace only Osgood OS compatibility policies.
drop policy if exists "osgood_profiles_select" on public.profiles;
drop policy if exists "osgood_profiles_admin_update" on public.profiles;
drop policy if exists "osgood_leads_select" on public.leads;
drop policy if exists "osgood_leads_insert" on public.leads;
drop policy if exists "osgood_leads_update" on public.leads;
drop policy if exists "osgood_leads_delete" on public.leads;
drop policy if exists "osgood_quotes_select" on public.quotes;
drop policy if exists "osgood_quotes_insert" on public.quotes;
drop policy if exists "osgood_quotes_update" on public.quotes;
drop policy if exists "osgood_quotes_delete" on public.quotes;
drop policy if exists "osgood_tasks_select" on public.tasks;
drop policy if exists "osgood_tasks_insert" on public.tasks;
drop policy if exists "osgood_tasks_update" on public.tasks;
drop policy if exists "osgood_tasks_delete" on public.tasks;
drop policy if exists "osgood_activity_select" on public.activity_log;
drop policy if exists "osgood_activity_insert" on public.activity_log;

create policy "osgood_profiles_select"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "osgood_profiles_admin_update"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "osgood_leads_select"
on public.leads for select to authenticated
using (public.is_active_staff());

create policy "osgood_leads_insert"
on public.leads for insert to authenticated
with check (public.is_active_staff());

create policy "osgood_leads_update"
on public.leads for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "osgood_leads_delete"
on public.leads for delete to authenticated
using (public.is_admin());

create policy "osgood_quotes_select"
on public.quotes for select to authenticated
using (public.is_active_staff());

create policy "osgood_quotes_insert"
on public.quotes for insert to authenticated
with check (public.is_active_staff());

create policy "osgood_quotes_update"
on public.quotes for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "osgood_quotes_delete"
on public.quotes for delete to authenticated
using (public.is_admin());

create policy "osgood_tasks_select"
on public.tasks for select to authenticated
using (public.is_active_staff());

create policy "osgood_tasks_insert"
on public.tasks for insert to authenticated
with check (public.is_active_staff());

create policy "osgood_tasks_update"
on public.tasks for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "osgood_tasks_delete"
on public.tasks for delete to authenticated
using (public.is_admin());

create policy "osgood_activity_select"
on public.activity_log for select to authenticated
using (public.is_active_staff());

create policy "osgood_activity_insert"
on public.activity_log for insert to authenticated
with check (public.is_active_staff());

-- Ensure quote numbers remain unique.
create unique index if not exists quotes_quote_number_unique
on public.quotes(quote_number);

-- Add realtime only when the table is not already in the publication.
do $$
begin
  begin
    alter publication supabase_realtime add table public.leads;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.quotes;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.tasks;
  exception when duplicate_object then null;
  end;
end $$;

-- After creating the first Authentication user, promote that profile:
-- update public.profiles
-- set role='admin', full_name='Mike Mulligan', active=true
-- where email='YOUR_EMAIL_ADDRESS';
