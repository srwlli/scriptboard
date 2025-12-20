"use client";

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { api, OrchestratorPlan } from "@/lib/api";
import { FileText, Clock, FolderKanban, AlertTriangle, Archive } from "lucide-react";

export const PlansTab = forwardRef<{ reload: () => void }>(function PlansTab(props, ref) {
  const [allPlans, setAllPlans] = useState<OrchestratorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<"all" | "working" | "archived" | "stale">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Extract unique projects from loaded plans
  const projects = useMemo(() => {
    const projs = new Set(allPlans.map(p => p.project).filter(Boolean));
    return ["all", ...Array.from(projs).sort()];
  }, [allPlans]);

  // Filter plans based on selected filters
  const plans = useMemo(() => {
    return allPlans.filter(p => {
      if (locationFilter === "working" && p.location !== "working") return false;
      if (locationFilter === "archived" && p.location !== "archived") return false;
      if (locationFilter === "stale" && !p.is_stale) return false;
      if (projectFilter !== "all" && p.project !== projectFilter) return false;
      return true;
    });
  }, [allPlans, locationFilter, projectFilter]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all plans, filter client-side for better UX
      const data = await api.getOrchestratorPlans();
      setAllPlans(data.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  // Expose reload method via ref
  useImperativeHandle(ref, () => ({
    reload: loadPlans
  }));

  useEffect(() => {
    loadPlans();
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
        {/* Location Filter */}
        <div className="flex gap-1">
          {(["all", "working", "archived", "stale"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setLocationFilter(f)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                locationFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {f === "stale" ? "Stale" : f.charAt(0).toUpperCase() + f.slice(1)}
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

      {plans.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No plans found</div>
          <div className="text-xs mt-1">
            {locationFilter !== "all" || projectFilter !== "all"
              ? "Try adjusting your filters"
              : "Plans appear in coderef/working/"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan, idx) => (
            <div
              key={plan._file_path || idx}
              className={`p-3 border rounded hover:border-muted-foreground/50 transition-colors ${
                plan.is_stale ? "border-amber-500/30 bg-amber-500/5" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {plan.location === "archived" ? (
                      <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-purple-500" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {plan.feature_name || "Unnamed Plan"}
                    </span>
                    {plan.is_stale && (
                      <span title="Stale plan (>7 days)">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <FolderKanban className="w-2.5 h-2.5" />
                    <span>{plan.project}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className={plan.location === "archived" ? "text-muted-foreground" : "text-purple-400"}>
                      {plan.location}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {plan.status && plan.status !== "unknown" && (
                    <StatusBadge status={plan.status} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />
                {new Date(plan.last_modified).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-400",
    planning: "bg-amber-500/20 text-amber-400",
    ready: "bg-blue-500/20 text-blue-400",
    in_progress: "bg-purple-500/20 text-purple-400",
    complete: "bg-green-500/20 text-green-400",
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] ${colors[status.toLowerCase()] || "bg-muted text-muted-foreground"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
