// src/features/projects/store.ts
import type { Project, ProjectFormat } from "@/types/spec";
import { storageGet, storageSet } from "@/lib/storage";
import { createMockProject } from "@/features/editor/spec-defaults";

const STORAGE_KEY = "projects";

type ProjectsState = {
  items: Project[];
};

const emptyState: ProjectsState = { items: [] };

function isDataUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().startsWith("data:");
}

function sanitizeUrlList(values: string[] | undefined): { list: string[] | undefined; changed: boolean } {
  if (!Array.isArray(values)) return { list: values, changed: false };
  let changed = false;
  const list = values.filter((value) => {
    const keep = !isDataUrl(value);
    if (!keep) changed = true;
    return keep;
  });
  if (list.length !== values.length) changed = true;
  return { list, changed };
}

function sanitizeProjectForStorage(project: Project): { project: Project; changed: boolean } {
  const spec = project.spec;
  let changed = false;
  const referenceImages = (spec.referenceImages ?? []).map((ref) => {
    const nextUrl = isDataUrl(ref.url) ? null : ref.url;
    if (nextUrl !== ref.url) changed = true;
    return {
      ...ref,
      url: nextUrl,
    };
  });
  const subjectImageUrl = isDataUrl(spec.subjectImageUrl) ? null : spec.subjectImageUrl;
  if (subjectImageUrl !== spec.subjectImageUrl) changed = true;

  const referenceImageUrl = isDataUrl(spec.referenceImageUrl) ? null : spec.referenceImageUrl;
  if (referenceImageUrl !== spec.referenceImageUrl) changed = true;

  const styleRefImageUrl =
    spec.ecomV2 && isDataUrl(spec.ecomV2.styleRefImageUrl) ? null : spec.ecomV2?.styleRefImageUrl;
  if (styleRefImageUrl !== spec.ecomV2?.styleRefImageUrl) changed = true;

  const builderLogoUploads = sanitizeUrlList(spec.builder?.logoUploads);
  const builderProductUploads = sanitizeUrlList(spec.builder?.productUploads);
  const builderBackgroundUploads = sanitizeUrlList(spec.builder?.backgroundUploads);
  const builderPremiumOverlayUrls = sanitizeUrlList(spec.builder?.premiumOverlayUrls);
  changed =
    changed ||
    builderLogoUploads.changed ||
    builderProductUploads.changed ||
    builderBackgroundUploads.changed ||
    builderPremiumOverlayUrls.changed;

  const cleaned: Project = {
    ...project,
    spec: {
      ...spec,
      subjectImageUrl,
      referenceImageUrl,
      builder: spec.builder
        ? {
            ...spec.builder,
            logoUploads: builderLogoUploads.list,
            productUploads: builderProductUploads.list,
            backgroundUploads: builderBackgroundUploads.list,
            premiumOverlayUrls: builderPremiumOverlayUrls.list,
          }
        : spec.builder,
      referenceImages,
      ecomV2: spec.ecomV2
        ? {
            ...spec.ecomV2,
            styleRefImageUrl,
          }
        : spec.ecomV2,
    },
  };
  return { project: cleaned, changed };
}

function readState(): ProjectsState {
  const st = storageGet<ProjectsState>(STORAGE_KEY, emptyState);
  let dirty = false;
  const items = st.items.map((project) => {
    const cleaned = sanitizeProjectForStorage(project);
    if (cleaned.changed) dirty = true;
    return cleaned.project;
  });
  if (dirty) {
    console.warn("[projects] Migrated legacy base64 image fields from localStorage.");
    const next = { ...st, items };
    storageSet(STORAGE_KEY, next);
    return next;
  }
  return st;
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

  const next: Project = sanitizeProjectForStorage({
    ...project,
    updatedAt: now,
  }).project;

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
