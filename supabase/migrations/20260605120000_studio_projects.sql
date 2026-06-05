-- CREATYNG — Memória de projetos do Studio
-- Salva o fluxo do usuário (nodes + connections + flow + thumbnail) por conta.

create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Projeto sem título',
  flow_id text,
  nodes jsonb not null default '[]'::jsonb,
  connections jsonb not null default '[]'::jsonb,
  thumbnail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studio_projects enable row level security;

drop policy if exists "studio_projects_select_own" on public.studio_projects;
create policy "studio_projects_select_own" on public.studio_projects
  for select using (auth.uid() = user_id);

drop policy if exists "studio_projects_insert_own" on public.studio_projects;
create policy "studio_projects_insert_own" on public.studio_projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "studio_projects_update_own" on public.studio_projects;
create policy "studio_projects_update_own" on public.studio_projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "studio_projects_delete_own" on public.studio_projects;
create policy "studio_projects_delete_own" on public.studio_projects
  for delete using (auth.uid() = user_id);

create index if not exists studio_projects_user_idx
  on public.studio_projects (user_id, updated_at desc);
