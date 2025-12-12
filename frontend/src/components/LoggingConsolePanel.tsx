"use client";

import { useState, useEffect } from "react";
import { LogDisplay, LogEntry } from "./ui/LogDisplay";
import { CollapsibleCard } from "@/components/ui";

/**
 * Logging Console Panel - captures and displays console.log/warn/error/debug messages.
 *
 * Uses shared LogDisplay component for the UI.
 * Handles console.* interception logic.
 */
export function LoggingConsolePanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Listen for console messages
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    const addLog = (level: "info" | "warn" | "error" | "debug", ...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");

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

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <CollapsibleCard title="Logging Console">
      <LogDisplay
        logs={logs}
        title=""
        showFilter={true}
        showAutoScroll={true}
        onClear={clearLogs}
        height="h-64"
      />
    </CollapsibleCard>
  );
}
