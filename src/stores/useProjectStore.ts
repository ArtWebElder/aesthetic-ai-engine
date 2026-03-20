// src/stores/useProjectStore.ts
// CREATYNG — Project store (Zustand + localStorage)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
  id: string;
  thumbnail: string;
  headline: string;
  preset: string;
  createdAt: string;
}

interface ProjectStore {
  projects: Project[];
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  removeProject: (id: string) => void;
  getRecent: (count: number) => Project[];
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (p) =>
        set((state) => ({
          projects: [
            {
              ...p,
              id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.projects,
          ].slice(0, 50),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      getRecent: (count) => get().projects.slice(0, count),
    }),
    { name: 'creatyng-projects' }
  )
);
