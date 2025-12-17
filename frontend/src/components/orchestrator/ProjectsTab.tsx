"use client";

import { useState, useEffect } from "react";
import { api, OrchestratorProject } from "@/lib/api";
import { FolderOpen, ExternalLink, Check, X } from "lucide-react";

export function ProjectsTab() {
  const [projects, setProjects] = useState<OrchestratorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorProjects();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8 text-sm">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 py-8 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase">
        <div className="col-span-4">Project</div>
        <div className="col-span-4">Path</div>
        <div className="col-span-2 text-center">WOs</div>
        <div className="col-span-2 text-center">Plans</div>
      </div>

      {/* Rows */}
      {projects.map((project) => (
        <div
          key={project.path}
          className="grid grid-cols-12 gap-2 px-2 py-2 rounded hover:bg-muted/50 items-center group"
        >
          <div className="col-span-4 flex items-center gap-2">
            {project.exists ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-red-500" />
            )}
            <span className="text-xs font-medium truncate">{project.name}</span>
          </div>
          <div className="col-span-4 text-[10px] text-muted-foreground truncate" title={project.path}>
            {project.path}
          </div>
          <div className="col-span-2 text-center">
            {project.active_workorders > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
                {project.active_workorders}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">0</span>
            )}
          </div>
          <div className="col-span-2 text-center">
            {project.active_plans > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded">
                {project.active_plans}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">0</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
