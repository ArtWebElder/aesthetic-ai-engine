// src/features/projects/store.ts
import type { Project, ProjectFormat } from "@/types/spec";
import { storageGet, storageSet } from "@/lib/storage";
import { createMockProject } from "@/features/editor/spec-defaults";

const STORAGE_KEY = "projects";

type ProjectsState = {
  items: Project[];
};

const emptyState: ProjectsState = { items: [] };

function readState(): ProjectsState {
  return storageGet<ProjectsState>(STORAGE_KEY, emptyState);
}

function writeState(next: ProjectsState) {
  storageSet(STORAGE_KEY, next);
}

export function listProjects(): Project[] {
  return readState().items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): Project | undefined {
  return readState().items.find((p) => p.id === id);
}

export function upsertProject(project: Project) {
  const st = readState();
  const idx = st.items.findIndex((p) => p.id === project.id);
  const now = new Date().toISOString();

  const next: Project = {
    ...project,
    updatedAt: now,
  };

  if (idx >= 0) st.items[idx] = next;
  else st.items.unshift(next);

  writeState(st);
}

export function deleteProject(id: string) {
  const st = readState();
  st.items = st.items.filter((p) => p.id !== id);
  writeState(st);
}

export function createProject(name: string, format: ProjectFormat): Project {
  const p = createMockProject(name, format);
  upsertProject(p);
  return p;
}

export function resetDemoData() {
  writeState(emptyState);
}