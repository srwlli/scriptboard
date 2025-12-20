"use client";

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { api, OrchestratorWorkorder } from "@/lib/api";
import { ClipboardList, Clock, FolderKanban } from "lucide-react";

export const WorkordersTab = forwardRef<{ reload: () => void }>(function WorkordersTab(props, ref) {
  const [allWorkorders, setAllWorkorders] = useState<OrchestratorWorkorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "complete" | "blocked">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Extract unique projects from loaded workorders
  const projects = useMemo(() => {
    const projs = new Set(allWorkorders.map(w => w.project).filter(Boolean));
    return ["all", ...Array.from(projs).sort()];
  }, [allWorkorders]);

  // Filter workorders based on selected filters
  const workorders = useMemo(() => {
    return allWorkorders.filter(w => {
      if (statusFilter !== "all" && w.status?.toLowerCase() !== statusFilter) return false;
      if (projectFilter !== "all" && w.project !== projectFilter) return false;
      return true;
    });
  }, [allWorkorders, statusFilter, projectFilter]);

  const loadWorkorders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorWorkorders();
      setAllWorkorders(data.workorders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workorders");
    } finally {
      setLoading(false);
    }
  };

  // Expose reload method via ref
  useImperativeHandle(ref, () => ({
    reload: loadWorkorders
  }));

  useEffect(() => {
    loadWorkorders();
  }, []);

  if (loading) {
    return <div className="text-center text-muted-foreground py-8 text-sm">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 py-8 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filter */}
        <div className="flex gap-1">
          {(["all", "pending", "in_progress", "complete", "blocked"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        {/* Project Filter */}
        {projects.length > 1 && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded bg-muted border-none outline-none"
          >
            {projects.map((proj) => (
              <option key={proj} value={proj}>
                {proj === "all" ? "All Projects" : proj}
              </option>
            ))}
          </select>
        )}
      </div>

      {workorders.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No workorders found</div>
          <div className="text-xs mt-1">
            {statusFilter !== "all" || projectFilter !== "all"
              ? "Try adjusting your filters"
              : "Workorders appear when features are in progress"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {workorders.map((wo, idx) => (
            <div
              key={wo.workorder_id || idx}
              className="p-3 border border-border rounded hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-mono text-blue-400">
                      {wo.workorder_id || "Unknown WO"}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate">
                    {wo.feature_name || "Unnamed Feature"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={wo.status} />
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FolderKanban className="w-2.5 h-2.5" />
                    {wo.project}
                  </span>
                </div>
              </div>
              {wo.initiated_at && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(wo.initiated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    in_progress: "bg-blue-500/20 text-blue-400",
    complete: "bg-green-500/20 text-green-400",
    blocked: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] ${colors[status.toLowerCase()] || "bg-muted text-muted-foreground"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
