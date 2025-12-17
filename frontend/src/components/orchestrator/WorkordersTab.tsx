"use client";

import { useState, useEffect } from "react";
import { api, OrchestratorWorkorder } from "@/lib/api";
import { ClipboardList, Clock, FolderKanban } from "lucide-react";

export function WorkordersTab() {
  const [workorders, setWorkorders] = useState<OrchestratorWorkorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkorders();
  }, []);

  const loadWorkorders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorWorkorders();
      setWorkorders(data.workorders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workorders");
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

  if (workorders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <div className="text-sm">No active workorders</div>
        <div className="text-xs mt-1">Workorders appear when features are in progress</div>
      </div>
    );
  }

  return (
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
  );
}

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
