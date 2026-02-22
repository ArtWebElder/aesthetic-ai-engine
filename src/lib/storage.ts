// src/lib/storage.ts
import { z } from "zod";

const APP_KEY = "magicidea";
const SPEC_VERSION = 1;

const StoredEnvelopeSchema = z.object({
  v: z.number(),
  updatedAt: z.string(),
  data: z.any(),
});

type StoredEnvelope<T> = {
  v: number;
  updatedAt: string;
  data: T;
};

function keyOf(key: string) {
  return `${APP_KEY}:${key}`;
}

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(keyOf(key));
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const envParsed = StoredEnvelopeSchema.safeParse(parsed);
    if (!envParsed.success) return fallback;

    const env = envParsed.data as StoredEnvelope<T>;

    // version mismatch => reset safe
    if (env.v !== SPEC_VERSION) return fallback;

    return env.data;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T) {
  const env: StoredEnvelope<T> = {
    v: SPEC_VERSION,
    updatedAt: new Date().toISOString(),
    data: value,
  };
  localStorage.setItem(keyOf(key), JSON.stringify(env));
}

export function storageRemove(key: string) {
  localStorage.removeItem(keyOf(key));
}

export function storageResetAll() {
  const prefix = `${APP_KEY}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}