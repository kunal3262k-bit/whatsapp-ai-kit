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

-- Row Level Security: enable with NO public policies (default deny).
-- Only the service-role key (bot + admin app, server-side) may read/write;
-- the public anon key is granted nothing.
alter table contacts  enable row level security;
alter table messages  enable row level security;
alter table leads     enable row level security;
alter table reminders enable row level security;

-- Remove the old wide-open anon read policies (idempotent).
drop policy if exists "read contacts"  on contacts;
drop policy if exists "read messages"  on messages;
drop policy if exists "read leads"     on leads;
drop policy if exists "read reminders" on reminders;

-- Belt-and-suspenders: revoke direct table privileges from the public roles.
revoke all on contacts, messages, leads, reminders from anon, authenticated;

-- Web Push subscriptions (owner devices). Only the service role touches this.
create table if not exists push_subscriptions (
  id          bigint generated always as identity primary key,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
-- Belt-and-suspenders: anon/authenticated get no table privilege on push_subscriptions either.
revoke all on push_subscriptions from anon, authenticated;

-- Bot-stuck handoff timestamp (for auto-resume).
alter table contacts add column if not exists handoff_at timestamptz;

-- Leads CRM status, set by the admin app. Values:
-- 'new' | 'contacted' | 'qualified' | 'disqualified' | 'human'.
alter table leads add column if not exists status text not null default 'new';
create index if not exists leads_status_idx on leads (status);
