// src/services/studioProjects.ts
// CREATYNG — Memória de projetos do Studio (Supabase, por usuário).

import { supabase } from './supabaseClient';
import type { StudioNode, Connection } from '@/app/create/studio/types';

export interface StudioProject {
  id: string;
  name: string;
  flow_id: string | null;
  nodes: StudioNode[];
  connections: Connection[];
  thumbnail: string | null;
  updated_at: string;
}

export interface SaveStudioProjectInput {
  id?: string | null;
  name: string;
  flowId: string | null;
  nodes: StudioNode[];
  connections: Connection[];
  thumbnail?: string | null;
}

/** List the current user's saved Studio projects (most recent first). */
export async function listStudioProjects(): Promise<StudioProject[]> {
  const { data, error } = await supabase
    .from('studio_projects')
    .select('id, name, flow_id, nodes, connections, thumbnail, updated_at')
    .order('updated_at', { ascending: false })
    .limit(60);
  if (error) {
    console.warn('[studioProjects] list failed:', error.message);
    return [];
  }
  return (data ?? []) as StudioProject[];
}

/** Insert a new project or update an existing one (by id). Returns the project id. */
export async function saveStudioProject(input: SaveStudioProjectInput): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  const payload = {
    user_id: user.id,
    name: input.name?.trim() || 'Projeto sem título',
    flow_id: input.flowId,
    nodes: input.nodes,
    connections: input.connections,
    thumbnail: input.thumbnail ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from('studio_projects').update(payload).eq('id', input.id);
    if (error) throw new Error(error.message);
    return input.id;
  }

  const { data, error } = await supabase
    .from('studio_projects')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function deleteStudioProject(id: string): Promise<void> {
  const { error } = await supabase.from('studio_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
