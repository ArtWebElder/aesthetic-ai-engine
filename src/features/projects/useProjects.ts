import { useState, useCallback } from "react";
import { listProjects } from "./store";
import type { Project } from "@/types/spec";

export function useProjects() {
  const [items, setItems] = useState<Project[]>(() => listProjects());

  const refresh = useCallback(() => {
    setItems(listProjects());
  }, []);

  return { items, refresh };
}
