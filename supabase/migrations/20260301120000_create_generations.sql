create extension if not exists pgcrypto;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  provider text not null default 'vertex-imagen',
  bucket text,
  path text,
  signed_url text,
  mime text,
  prompt text,
  width integer,
  height integer,
  credits_used integer not null default 0,
  status text not null default 'pending',
  duration_ms integer,
  error_message text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists generations_created_at_idx
  on public.generations (created_at desc);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);
