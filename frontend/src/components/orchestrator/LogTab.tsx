"use client";

import { useState, useEffect, useMemo } from "react";
import { api, OrchestratorLogEntry } from "@/lib/api";
import { ScrollText, Clock, FolderKanban } from "lucide-react";

export function LogTab() {
  const [allEntries, setAllEntries] = useState<OrchestratorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Extract unique projects from loaded entries
  const projects = useMemo(() => {
    const projs = new Set(allEntries.map(e => e.project).filter(Boolean));
    return ["all", ...Array.from(projs).sort()];
  }, [allEntries]);

  // Filter entries based on selected filter
  const entries = useMemo(() => {
    if (projectFilter === "all") return allEntries;
    return allEntries.filter(e => e.project === projectFilter);
  }, [allEntries, projectFilter]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorLog({ limit: 100 });
      setAllEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load log entries");
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
    <div className="space-y-3">
      {/* Filters */}
      {projects.length > 2 && (
        <div className="flex gap-2">
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
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No log entries found</div>
          <div className="text-xs mt-1">
            {projectFilter !== "all"
              ? "Try adjusting your filter"
              : "Workorder activity will appear here"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div
              key={`${entry.workorder_id}-${idx}`}
              className="p-3 border border-border rounded hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ScrollText className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-mono text-purple-400">
                      {entry.workorder_id}
                    </span>
                  </div>
                  <div className="text-sm truncate">
                    {entry.description || "No description"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FolderKanban className="w-2.5 h-2.5" />
                    {entry.project}
                  </span>
                </div>
              </div>
              {entry.timestamp && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  {entry.timestamp}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
