-- Enable uuid generation
create extension if not exists pgcrypto;

-- Admin table: exactly one admin account allowed
create table if not exists public.admin_users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists admin_users_single_admin_idx on public.admin_users ((true));

create table if not exists public.articles (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    excerpt text not null default '',
    content text not null,
    pdf_url text,
    external_url text,
    tags text[] not null default '{}',
    status text not null default 'draft' check (status in ('draft', 'published')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    repo_url text not null,
    tech_stack text[] not null default '{}',
    image_url text not null,
    year text not null,
    stars integer,
    content text,
    status text not null default 'draft' check (status in ('draft', 'published')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.papers (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    abstract text not null,
    journal text not null,
    pdf_url text,
    image_url text not null,
    year text not null,
    category text not null,
    status text not null default 'draft' check (status in ('draft', 'published')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- Migration safety for existing projects/papers tables
alter table public.projects add column if not exists status text;
update public.projects set status = 'published' where status is null;
alter table public.projects alter column status set default 'draft';
alter table public.projects alter column status set not null;
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check check (status in ('draft', 'published'));

alter table public.papers add column if not exists status text;
update public.papers set status = 'published' where status is null;
alter table public.papers alter column status set default 'draft';
alter table public.papers alter column status set not null;
alter table public.papers drop constraint if exists papers_status_check;
alter table public.papers add constraint papers_status_check check (status in ('draft', 'published'));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists articles_touch_updated_at on public.articles;
create trigger articles_touch_updated_at
before update on public.articles
for each row execute function public.touch_updated_at();

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

drop trigger if exists papers_touch_updated_at on public.papers;
create trigger papers_touch_updated_at
before update on public.papers
for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.articles enable row level security;
alter table public.projects enable row level security;
alter table public.papers enable row level security;

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self
on public.admin_users
for select
using (auth.uid() = id);

drop policy if exists admin_users_insert_self on public.admin_users;
-- Intentionally do not create insert/update/delete policies for admin_users.
-- This means only service role (SQL editor / backend) can write admin records.

drop policy if exists articles_public_read on public.articles;
create policy articles_public_read
on public.articles
for select
using (
    status = 'published'
    or exists (select 1 from public.admin_users where id = auth.uid())
);

drop policy if exists projects_public_read on public.projects;
create policy projects_public_read
on public.projects
for select
using (
    status = 'published'
    or exists (select 1 from public.admin_users where id = auth.uid())
);

drop policy if exists papers_public_read on public.papers;
create policy papers_public_read
on public.papers
for select
using (
    status = 'published'
    or exists (select 1 from public.admin_users where id = auth.uid())
);

drop policy if exists articles_admin_insert on public.articles;
create policy articles_admin_insert
on public.articles
for insert
with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists articles_admin_update on public.articles;
create policy articles_admin_update
on public.articles
for update
using (exists (select 1 from public.admin_users where id = auth.uid()))
with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists articles_admin_delete on public.articles;
create policy articles_admin_delete
on public.articles
for delete
using (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists projects_admin_insert on public.projects;
create policy projects_admin_insert
on public.projects
for insert
with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists projects_admin_update on public.projects;
create policy projects_admin_update
on public.projects
for update
using (exists (select 1 from public.admin_users where id = auth.uid()))
with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists projects_admin_delete on public.projects;
create policy projects_admin_delete
on public.projects
for delete
using (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists papers_admin_insert on public.papers;
create policy papers_admin_insert
on public.papers
for insert
with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists papers_admin_update on public.papers;
create policy papers_admin_update
on public.papers
for update
using (exists (select 1 from public.admin_users where id = auth.uid()))
with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists papers_admin_delete on public.papers;
create policy papers_admin_delete
on public.papers
for delete
using (exists (select 1 from public.admin_users where id = auth.uid()));
