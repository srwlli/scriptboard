"use client";

import { useState, useEffect } from "react";
import { api, OrchestratorProject } from "@/lib/api";
import { FolderOpen, ExternalLink, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

export function ProjectsTab() {
  const [projects, setProjects] = useState<OrchestratorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectPath, setNewProjectPath] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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

  const handleBrowse = async () => {
    try {
      // Use Electron's selectFolder API
      const selectedPath = await (window as any).electronAPI.selectFolder();

      if (selectedPath) {
        setNewProjectPath(selectedPath);

        // Auto-populate project name from directory name if not set
        if (!newProjectName.trim()) {
          const dirName = selectedPath.split(/[\\/]/).pop() || '';
          setNewProjectName(dirName);
        }
      }
    } catch (err) {
      console.error('Failed to open directory dialog:', err);
      toast.error('Failed to open directory browser');
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim() || !newProjectPath.trim()) {
      toast.error("Please fill in both name and path");
      return;
    }

    setIsAdding(true);
    try {
      const result = await api.addOrchestratorProject(newProjectName.trim(), newProjectPath.trim());
      if (result.success) {
        toast.success(`Project "${newProjectName}" added successfully`);
        setShowAddDialog(false);
        setNewProjectName("");
        setNewProjectPath("");
        await loadProjects();
      } else {
        toast.error(result.error || "Failed to add project");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setIsAdding(false);
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

      {/* Add New Project Button */}
      <button
        onClick={() => setShowAddDialog(true)}
        className="w-full grid grid-cols-12 gap-2 px-2 py-2 rounded hover:bg-muted/50 items-center group text-left border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
      >
        <div className="col-span-12 flex items-center gap-2 justify-center">
          <Plus className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Add New Project</span>
        </div>
      </button>

      {/* Add Project Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
          <div className="bg-background border border-border rounded-lg p-4 w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">Add New Project</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., my-project"
                  className="w-full px-2 py-1.5 text-xs bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={isAdding}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Project Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProjectPath}
                    onChange={(e) => setNewProjectPath(e.target.value)}
                    placeholder="C:\path\to\project"
                    className="flex-1 px-2 py-1.5 text-xs bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isAdding}
                  />
                  <button
                    type="button"
                    onClick={handleBrowse}
                    className="px-2 py-1.5 text-xs bg-muted hover:bg-muted/80 border border-border rounded transition-colors flex items-center gap-1"
                    disabled={isAdding}
                  >
                    <FolderOpen className="w-3 h-3" />
                    Browse
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewProjectName("");
                    setNewProjectPath("");
                  }}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProject}
                  className="px-3 py-1.5 text-xs bg-primary hover:bg-primary/80 text-primary-foreground rounded transition-colors disabled:opacity-50"
                  disabled={isAdding}
                >
                  {isAdding ? "Adding..." : "Add Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
