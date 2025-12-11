"use client";

import { useState, useEffect, useRef } from "react";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "key" | "clipboard";
  message: string;
  source?: string;
}

export interface LogDisplayProps {
  logs: LogEntry[];
  title: string;
  showFilter?: boolean;
  showAutoScroll?: boolean;
  onClear?: () => void;
  height?: string;
}

const levelColors: Record<LogEntry["level"], string> = {
  info: "text-foreground",
  warn: "text-yellow-500",
  error: "text-red-500",
  debug: "text-blue-500",
  key: "text-green-500",
  clipboard: "text-purple-500",
};

const allLevels: LogEntry["level"][] = ["info", "warn", "error", "debug", "key", "clipboard"];

/**
 * Shared log display component for viewing log entries.
 *
 * Features:
 * - Filter by log level
 * - Auto-scroll (container-scoped, not page-level)
 * - Clear button
 * - Color-coded log levels
 * - Timestamp display
 */
export function LogDisplay({
  logs,
  title,
  showFilter = true,
  showAutoScroll = true,
  onClear,
  height = "h-64",
}: LogDisplayProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<"all" | LogEntry["level"]>("all");
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change (container-scoped)
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(
    (log) => filter === "all" || log.level === filter
  );

  // Get available levels from current logs for filter dropdown
  const availableLevels = Array.from(new Set(logs.map((log) => log.level)));

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          {showFilter && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-2 py-1 text-xs rounded-md border border-border bg-background text-foreground"
            >
              <option value="all">All</option>
              {allLevels
                .filter((level) => availableLevels.includes(level) || level === filter)
                .map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
            </select>
          )}
          {showAutoScroll && (
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              <span className="text-foreground">Auto-scroll</span>
            </label>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="px-2 py-1 text-xs rounded-md border border-border bg-background hover:bg-accent transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div
        ref={logContainerRef}
        className={`${height} overflow-y-auto bg-muted/30 border border-border rounded p-2 font-mono text-xs`}
      >
        {filteredLogs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No logs</p>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="mb-1">
              <span className="text-muted-foreground">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>{" "}
              <span className={levelColors[log.level]}>
                [{log.level.toUpperCase()}]
              </span>{" "}
              <span className="text-foreground">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
