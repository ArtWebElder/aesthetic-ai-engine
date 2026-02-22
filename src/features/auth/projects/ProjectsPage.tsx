import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { ProjectFormat } from "@/types/spec";
import { useProjects } from "@/features/projects/useProjects";
import { createProject, deleteProject, resetDemoData } from "@/features/projects/store";

const formats: { label: string; value: ProjectFormat }[] = [
  { label: "Feed 1080x1080", value: "feed_1080" },
  { label: "Feed 1080x1350", value: "feed_1080x1350" },
  { label: "Story 1080x1920", value: "story_1080x1920" },
  { label: "Landscape 1200x628", value: "landscape_1200x628" },
  { label: "Ecom Desktop 1920x800", value: "ecom_desktop_1920x800" },
  { label: "Ecom Mobile 1080x1350", value: "ecom_mobile_1080x1350" },
  { label: "Photoshoot 1024", value: "square_1024" },
];

export default function Projects() {
  const nav = useNavigate();
  const { items, refresh } = useProjects();

  const [name, setName] = useState("New Project");
  const [format, setFormat] = useState<ProjectFormat>("story_1080x1920");

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Demo persistence via localStorage (later: Supabase).
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            resetDemoData();
            refresh();
          }}
        >
          Reset demo
        </Button>
      </div>

      <Card className="p-4 md:p-5 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs text-muted-foreground">Project name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Format</label>
            <select
              className="w-full h-10 rounded-md bg-transparent border border-border px-3 text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value as ProjectFormat)}
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          className="w-full md:w-auto"
          onClick={() => {
            const p = createProject(name.trim() || "Untitled", format);
            refresh();
            nav(`/app/projects/${p.id}`);
          }}
        >
          New Project
        </Button>
      </Card>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="text-lg font-medium">No projects yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Create your first project above.
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((p) => (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.spec.module} • {p.spec.format} • {p.spec.stylePreset}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    deleteProject(p.id);
                    refresh();
                  }}
                >
                  Delete
                </Button>
              </div>

              <Button
                className="w-full"
                variant="secondary"
                onClick={() => nav(`/app/projects/${p.id}`)}
              >
                Open
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}