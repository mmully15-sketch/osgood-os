-- Osgood OS v1.0.0 — Operations Center
-- Safely expands the existing public.tasks table.

alter table public.tasks
  add column if not exists task_type text not null default 'building',
  add column if not exists category text not null default 'Other',
  add column if not exists priority text not null default 'normal',
  add column if not exists status text not null default 'not_started',
  add column if not exists description text,
  add column if not exists notes text,
  add column if not exists blocked_reason text,
  add column if not exists percent_complete integer not null default 0,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.tasks drop constraint if exists tasks_task_type_check;
alter table public.tasks add constraint tasks_task_type_check
  check (task_type in ('building','event','administrative','finance','marketing'));

alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks add constraint tasks_priority_check
  check (priority in ('low','normal','high','critical'));

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('not_started','in_progress','blocked','completed','cancelled'));

alter table public.tasks drop constraint if exists tasks_percent_complete_check;
alter table public.tasks add constraint tasks_percent_complete_check
  check (percent_complete between 0 and 100);

create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_task_type_idx on public.tasks(task_type);
create index if not exists tasks_priority_idx on public.tasks(priority);

update public.tasks
set
  status = case when completed then 'completed' else coalesce(nullif(status,''),'not_started') end,
  percent_complete = case when completed then 100 else coalesce(percent_complete,0) end,
  task_type = coalesce(nullif(task_type,''),'building'),
  category = coalesce(nullif(category,''),'Other'),
  priority = coalesce(nullif(priority,''),'normal'),
  updated_at = now();
