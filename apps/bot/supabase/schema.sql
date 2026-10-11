-- ============================================================
-- WhatsApp AI Kit — Supabase schema (free tier)
-- Paste this whole file into: Supabase -> SQL Editor -> Run
-- ============================================================

create table if not exists contacts (
  jid            text primary key,
  phone          text,
  name           text,
  status         text not null default 'new',
  step           int  not null default 0,
  answers        jsonb not null default '{}'::jsonb,
  followups_sent int  not null default 0,
  last_inbound_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists messages (
  id   bigint generated always as identity primary key,
  jid  text not null,
  role text not null,
  text text not null,
  at   timestamptz not null default now()
);
create index if not exists messages_jid_at_idx on messages (jid, at);

create table if not exists leads (
  id         bigint generated always as identity primary key,
  jid        text not null,
  name       text,
  phone      text,
  fields     jsonb not null default '{}'::jsonb,
  qualified  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists leads_created_idx on leads (created_at desc);

create table if not exists reminders (
  id         text primary key,
  jid        text not null,
  kind       text not null,
  run_at     timestamptz not null,
  message    text not null,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reminders_due_idx on reminders (done, run_at);

-- Row Level Security: enable, and allow the dashboard's anon key to READ only.
alter table contacts  enable row level security;
alter table messages  enable row level security;
alter table leads     enable row level security;
alter table reminders enable row level security;

-- Read-only policies for the dashboard (anon key). The bot uses the
-- service-role key and bypasses RLS.
-- Note: Postgres has no "create policy if not exists"; drop-then-create is idempotent.
drop policy if exists "read contacts"  on contacts;
drop policy if exists "read messages"  on messages;
drop policy if exists "read leads"     on leads;
drop policy if exists "read reminders" on reminders;
create policy "read contacts"  on contacts  for select to anon using (true);
create policy "read messages"  on messages  for select to anon using (true);
create policy "read leads"     on leads     for select to anon using (true);
create policy "read reminders" on reminders for select to anon using (true);
