"use client";

import { useState, useEffect, useRef } from "react";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source?: string;
}

export function LoggingConsolePanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error" | "debug">("all");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for console messages
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    const addLog = (level: LogEntry["level"], ...args: any[]) => {
      const message = args.map((arg) => 
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" ");
      
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level,
          message,
          source: "frontend",
        },
      ]);
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      addLog("info", ...args);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      addLog("warn", ...args);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      addLog("error", ...args);
    };

    console.debug = (...args: any[]) => {
      originalDebug(...args);
      addLog("debug", ...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.debug = originalDebug;
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(
    (log) => filter === "all" || log.level === filter
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      case "debug":
        return "text-blue-500";
      default:
        return "text-foreground";
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Logging Console</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-2 py-1 text-xs rounded-md border border-border bg-background text-foreground"
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            <span className="text-foreground">Auto-scroll</span>
          </label>
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="h-64 overflow-y-auto bg-muted/30 border border-border rounded p-2 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No logs</p>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="mb-1">
              <span className="text-muted-foreground">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {" "}
              <span className={getLevelColor(log.level)}>
                [{log.level.toUpperCase()}]
              </span>
              {" "}
              <span className="text-foreground">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

