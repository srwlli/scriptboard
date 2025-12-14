"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ProcessInfo } from "@/lib/api";
import { RefreshCw, Shield, Cpu, MemoryStick } from "lucide-react";

export function AppProcessesPanel() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getAppProcesses();
      setProcesses(data.processes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch app processes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppProcesses();
  }, [fetchAppProcesses]);

  const totalCpu = processes.reduce((sum, p) => sum + p.cpu_percent, 0);
  const totalMemory = processes.reduce((sum, p) => sum + p.memory_mb, 0);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() => fetchAppProcesses()}
          disabled={isLoading}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : processes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : "No Scriptboard processes found"}
        </p>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Cpu size={12} className="text-blue-500" />
              <span className="text-muted-foreground">Total CPU:</span>
              <span className="font-medium">{totalCpu.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <MemoryStick size={12} className="text-green-500" />
              <span className="text-muted-foreground">Total Mem:</span>
              <span className="font-medium">{totalMemory.toFixed(1)} MB</span>
            </div>
          </div>

          {/* Process list */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {processes.map((proc) => (
              <div
                key={proc.pid}
                className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {proc.is_protected && (
                    <span title="Protected">
                      <Shield size={12} className="text-yellow-500 shrink-0" />
                    </span>
                  )}
                  <span className="font-medium truncate">{proc.name}</span>
                  <span className="text-muted-foreground shrink-0">PID: {proc.pid}</span>
                </div>
                <div className="flex gap-3 text-muted-foreground shrink-0">
                  <span>CPU: {proc.cpu_percent.toFixed(1)}%</span>
                  <span>Mem: {proc.memory_mb.toFixed(1)} MB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
