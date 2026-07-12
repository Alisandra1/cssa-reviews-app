-- CSSA Client Review Platform — database schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

create extension if not exists "pgcrypto";

-- ---------- Tables ----------

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null,
  reviewer_email text not null,
  staff_id uuid references staff(id) on delete set null,
  staff_name text not null, -- snapshot of the name at time of review, kept even if staff is later removed
  rating int not null check (rating between 1 and 10),
  comments text not null,
  created_at timestamptz not null default now()
);

create index if not exists reviews_staff_id_idx on reviews (staff_id);
create index if not exists reviews_created_at_idx on reviews (created_at desc);

-- ---------- Row Level Security ----------
-- Anyone (anon) can submit a review and see the active staff list (needed for the dropdown).
-- Only signed-in staff (authenticated) can read reviews or manage the staff list.

alter table staff enable row level security;
alter table reviews enable row level security;

-- staff: public can see active staff members only
create policy "public can view active staff"
  on staff for select
  to anon
  using (active = true);

-- staff: signed-in staff can see everyone, including inactive
create policy "staff can view all staff"
  on staff for select
  to authenticated
  using (true);

-- staff: only signed-in staff can add/edit/remove staff members
create policy "staff can insert staff"
  on staff for insert
  to authenticated
  with check (true);

create policy "staff can update staff"
  on staff for update
  to authenticated
  using (true)
  with check (true);

create policy "staff can delete staff"
  on staff for delete
  to authenticated
  using (true);

-- reviews: anyone can submit a review (this is the public client-facing form)
create policy "public can submit reviews"
  on reviews for insert
  to anon, authenticated
  with check (true);

-- reviews: only signed-in staff can read submitted reviews
create policy "staff can view reviews"
  on reviews for select
  to authenticated
  using (true);

-- ---------- Seed data (optional) ----------
-- Uncomment and edit to pre-populate your staff list:
-- insert into staff (name) values ('Anna'), ('Lina'), ('Alisandra');
