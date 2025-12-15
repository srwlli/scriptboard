"use client";

import { DetailedProcessInfo } from "@/lib/api";
import { Sparkline } from "./Sparkline";
import { FolderOpen, Terminal, Clock, Layers, Hash, GitBranch } from "lucide-react";

export interface ProcessDetailsProps {
  process: DetailedProcessInfo;
  className?: string;
}

/**
 * Expanded details panel for a process.
 * Shows path, command line, threads, handles, children, and resource history charts.
 */
export function ProcessDetails({ process, className = "" }: ProcessDetailsProps) {
  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const formatPath = (path: string | null): string => {
    if (!path) return "N/A";
    // Truncate long paths
    if (path.length > 60) {
      return "..." + path.slice(-57);
    }
    return path;
  };

  return (
    <div className={`p-3 bg-muted/30 rounded-md text-xs space-y-3 ${className}`}>
      {/* Description */}
      <p className="text-muted-foreground italic">{process.description}</p>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Path */}
        <div className="col-span-2">
          <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
            <FolderOpen size={11} />
            <span>Path</span>
          </div>
          <p className="font-mono text-[10px] break-all" title={process.path || undefined}>
            {formatPath(process.path)}
          </p>
        </div>

        {/* Command line */}
        {process.cmdline && (
          <div className="col-span-2">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Terminal size={11} />
              <span>Command</span>
            </div>
            <p
              className="font-mono text-[10px] break-all max-h-12 overflow-y-auto"
              title={process.cmdline}
            >
              {process.cmdline.length > 150
                ? process.cmdline.slice(0, 150) + "..."
                : process.cmdline}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-4">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Clock size={11} />
              <span>Uptime</span>
            </div>
            <p className="font-medium">{formatUptime(process.uptime_seconds)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Layers size={11} />
              <span>Threads</span>
            </div>
            <p className="font-medium">{process.threads}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Hash size={11} />
              <span>Handles</span>
            </div>
            <p className="font-medium">{process.handles}</p>
          </div>
        </div>

        <div className="flex gap-4">
          {process.parent_pid && (
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                <GitBranch size={11} />
                <span>Parent PID</span>
              </div>
              <p className="font-medium">{process.parent_pid}</p>
            </div>
          )}
          {process.children_count > 0 && (
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                <GitBranch size={11} className="rotate-180" />
                <span>Children</span>
              </div>
              <p className="font-medium">{process.children_count}</p>
            </div>
          )}
        </div>
      </div>

      {/* Resource history charts */}
      {(process.cpu_history.length > 0 || process.memory_history.length > 0) && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          {/* CPU History */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">CPU History</span>
              <span className="font-medium">{process.cpu_percent.toFixed(1)}%</span>
            </div>
            <Sparkline
              data={process.cpu_history}
              width={120}
              height={30}
              color="rgb(59, 130, 246)" // blue-500
              fillOpacity={0.15}
            />
          </div>

          {/* Memory History */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Memory History</span>
              <span className="font-medium">{process.memory_mb.toFixed(1)} MB</span>
            </div>
            <Sparkline
              data={process.memory_history}
              width={120}
              height={30}
              color="rgb(34, 197, 94)" // green-500
              fillOpacity={0.15}
            />
          </div>
        </div>
      )}
    </div>
  );
}
