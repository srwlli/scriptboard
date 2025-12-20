"use client";

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { api, OrchestratorStub } from "@/lib/api";
import { Lightbulb, Clock, Tag, FolderKanban } from "lucide-react";

export const StubsTab = forwardRef<{ reload: () => void }>(function StubsTab(props, ref) {
  const [allStubs, setAllStubs] = useState<OrchestratorStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Extract unique categories from loaded stubs
  const categories = useMemo(() => {
    const cats = new Set(allStubs.map(s => s.category).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [allStubs]);

  // Extract unique projects from loaded stubs
  const projects = useMemo(() => {
    const projs = new Set(allStubs.map(s => s.project).filter(Boolean));
    return ["all", ...Array.from(projs).sort()];
  }, [allStubs]);

  // Filter stubs based on selected filters
  const stubs = useMemo(() => {
    return allStubs.filter(s => {
      if (priorityFilter !== "all" && s.priority?.toLowerCase() !== priorityFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (projectFilter !== "all" && s.project !== projectFilter) return false;
      return true;
    });
  }, [allStubs, priorityFilter, categoryFilter, projectFilter]);

  const loadStubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorStubs();
      setAllStubs(data.stubs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stubs");
    } finally {
      setLoading(false);
    }
  };

  // Expose reload method via ref
  useImperativeHandle(ref, () => ({
    reload: loadStubs
  }));

  useEffect(() => {
    loadStubs();
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
        {/* Priority Filter */}
        <div className="flex gap-1">
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                priorityFilter === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
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
        {/* Category Filter */}
        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded bg-muted border-none outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {stubs.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No stubs found</div>
          <div className="text-xs mt-1">
            {priorityFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Create stub.json files in coderef/stubs/"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {stubs.map((stub, idx) => (
            <div
              key={stub.feature_name || idx}
              className="p-3 border border-border rounded hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm font-medium truncate">
                      {stub.feature_name || "Unnamed Stub"}
                    </span>
                  </div>
                  {stub.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stub.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {stub.priority && (
                    <PriorityBadge priority={stub.priority} />
                  )}
                  {stub.project && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <FolderKanban className="w-2.5 h-2.5" />
                      {stub.project}
                    </span>
                  )}
                  {stub.category && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Tag className="w-2.5 h-2.5" />
                      {stub.category}
                    </span>
                  )}
                </div>
              </div>
              {stub.created && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(stub.created).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-amber-500/20 text-amber-400",
    low: "bg-green-500/20 text-green-400",
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] ${colors[priority.toLowerCase()] || "bg-muted text-muted-foreground"}`}>
      {priority}
    </span>
  );
}
