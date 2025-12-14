"use client";

import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  phase: string;
  current: number;
  total: number;
  currentFile?: string;
  message?: string;
}

export function ProgressIndicator({
  phase,
  current,
  total,
  currentFile,
  message,
}: ProgressIndicatorProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const isInitializing = total === 0;

  return (
    <div className="border border-border rounded p-3 bg-muted/30">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium capitalize flex items-center gap-1.5">
          <Loader2 size={12} className="animate-spin" />
          {isInitializing ? "Starting scan..." : `${phase || "Processing"}...`}
        </span>
        <span className="text-muted-foreground">
          {isInitializing ? "Connecting..." : `${current} / ${total} (${percent}%)`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
        {isInitializing ? (
          <div className="h-full bg-primary/50 animate-pulse w-full" />
        ) : (
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>

      {/* Current file or message */}
      <div className="text-xs text-muted-foreground truncate">
        {isInitializing ? (
          "Preparing to scan folder..."
        ) : currentFile ? (
          <span title={currentFile}>Current: {currentFile}</span>
        ) : message ? (
          message
        ) : null}
      </div>
    </div>
  );
}
