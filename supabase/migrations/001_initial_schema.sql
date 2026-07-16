-- Osgood OS initial database schema
-- Run this entire file in Supabase SQL Editor once.

create extension if not exists pgcrypto;

create type public.staff_role as enum ('admin','sales','events','finance','staff');
create type public.lead_status as enum ('inquiry','toured','quoted','contracted','booked','lost');
create type public.quote_status as enum ('draft','sent','accepted','expired','declined');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role public.staff_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  partner_or_org text,
  email text,
  phone text,
  event_type text not null default 'Wedding',
  event_date date,
  estimated_guests integer check (estimated_guests is null or estimated_guests >= 0),
  status public.lead_status not null default 'inquiry',
  follow_up_date date,
  assigned_staff text,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  quote_number text not null unique,
  status public.quote_status not null default 'draft',
  pricing_type text not null default 'wedding',
  package_name text,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  deposit_percent numeric(5,2) not null default 25,
  proposal_notes text,
  internal_notes text,
  valid_through date,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger leads_updated before update on public.leads for each row execute function public.set_updated_at();
create trigger quotes_updated before update on public.quotes for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,email,full_name)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;

create or replace function public.is_active_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active=true);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active=true and p.role='admin');
$$;

create policy "Staff can read own profile" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
create policy "Admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Active staff read leads" on public.leads for select to authenticated using (public.is_active_staff());
create policy "Active staff create leads" on public.leads for insert to authenticated with check (public.is_active_staff());
create policy "Active staff update leads" on public.leads for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "Admins delete leads" on public.leads for delete to authenticated using (public.is_admin());

create policy "Active staff read quotes" on public.quotes for select to authenticated using (public.is_active_staff());
create policy "Active staff create quotes" on public.quotes for insert to authenticated with check (public.is_active_staff());
create policy "Active staff update quotes" on public.quotes for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "Admins delete quotes" on public.quotes for delete to authenticated using (public.is_admin());

alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.quotes;

-- After creating your first user in Authentication > Users, run:
-- update public.profiles set role='admin', full_name='Mike Mulligan' where email='YOUR_EMAIL';
