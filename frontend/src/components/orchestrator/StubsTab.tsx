"use client";

import { useState, useEffect } from "react";
import { api, OrchestratorStub } from "@/lib/api";
import { Lightbulb, Clock, Tag } from "lucide-react";

export function StubsTab() {
  const [stubs, setStubs] = useState<OrchestratorStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStubs();
  }, []);

  const loadStubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorStubs();
      setStubs(data.stubs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stubs");
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

  if (stubs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <div className="text-sm">No stubs found</div>
        <div className="text-xs mt-1">Create stub.json files in coderef/stubs/</div>
      </div>
    );
  }

  return (
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
  );
}

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
