-- Osgood OS v0.9 Proposals and Payments
-- Run once after migration 005.

alter table public.quotes
  add column if not exists valid_through date,
  add column if not exists sent_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists proposal_notes text,
  add column if not exists terms text,
  add column if not exists version integer not null default 1;

create table if not exists public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  quote_id text not null references public.quotes(id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null check(amount >= 0),
  due_date date,
  status text not null default 'scheduled',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  quote_id text not null references public.quotes(id) on delete cascade,
  schedule_id uuid references public.payment_schedules(id) on delete set null,
  amount numeric(12,2) not null check(amount > 0),
  payment_date date not null default current_date,
  method text,
  reference_number text,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.payment_schedules enable row level security;
alter table public.payments enable row level security;

drop policy if exists "osgood_schedule_select" on public.payment_schedules;
drop policy if exists "osgood_schedule_insert" on public.payment_schedules;
drop policy if exists "osgood_schedule_update" on public.payment_schedules;
drop policy if exists "osgood_schedule_delete" on public.payment_schedules;

create policy "osgood_schedule_select" on public.payment_schedules
for select to authenticated using (public.is_active_staff());
create policy "osgood_schedule_insert" on public.payment_schedules
for insert to authenticated with check (public.is_active_staff());
create policy "osgood_schedule_update" on public.payment_schedules
for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "osgood_schedule_delete" on public.payment_schedules
for delete to authenticated using (public.is_active_staff());

drop policy if exists "osgood_payments_select" on public.payments;
drop policy if exists "osgood_payments_insert" on public.payments;
drop policy if exists "osgood_payments_update" on public.payments;
drop policy if exists "osgood_payments_delete" on public.payments;

create policy "osgood_payments_select" on public.payments
for select to authenticated using (public.is_active_staff());
create policy "osgood_payments_insert" on public.payments
for insert to authenticated with check (public.is_active_staff());
create policy "osgood_payments_update" on public.payments
for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "osgood_payments_delete" on public.payments
for delete to authenticated using (public.is_admin());

-- Existing quote balances should reflect recorded payments.
create or replace function public.refresh_quote_balance(p_quote_id text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  paid numeric(12,2);
begin
  select coalesce(sum(amount),0) into paid from public.payments where quote_id=p_quote_id;
  update public.quotes
  set deposit=paid,
      balance=greatest(total-paid,0),
      updated_at=now()
  where id=p_quote_id;
end;
$$;

create or replace function public.after_payment_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.refresh_quote_balance(coalesce(new.quote_id,old.quote_id));
  return coalesce(new,old);
end;
$$;

drop trigger if exists payments_refresh_quote on public.payments;
create trigger payments_refresh_quote
after insert or update or delete on public.payments
for each row execute function public.after_payment_change();

-- Seed a deposit and final-balance schedule for quotes that do not have one.
insert into public.payment_schedules(quote_id,label,amount,due_date,status,sort_order)
select q.id,'Deposit',greatest(q.total-q.balance,0),q.event_date,'scheduled',10
from public.quotes q
where greatest(q.total-q.balance,0)>0
and not exists(select 1 from public.payment_schedules s where s.quote_id=q.id and s.label='Deposit');

insert into public.payment_schedules(quote_id,label,amount,due_date,status,sort_order)
select q.id,'Remaining Balance',q.balance,
       case when q.event_date is null then null else q.event_date - 30 end,
       'scheduled',20
from public.quotes q
where q.balance>0
and not exists(select 1 from public.payment_schedules s where s.quote_id=q.id and s.label='Remaining Balance');
