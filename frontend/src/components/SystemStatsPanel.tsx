"use client";

import { useSystemMonitor } from "@/hooks/useSystemMonitor";
import { Cpu, HardDrive, MemoryStick, RefreshCw, Pause, Play } from "lucide-react";

interface ProgressBarProps {
  value: number;
  color: string;
  label: string;
  detail: string;
}

function ProgressBar({ value, color, label, detail }: ProgressBarProps) {
  const getColorClass = () => {
    if (value >= 90) return "bg-red-500";
    if (value >= 75) return "bg-yellow-500";
    return color;
  };

  return (
    <div className="flex-1 space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">{detail}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColorClass()} transition-all duration-300`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function SystemStatsPanel() {
  const { stats, isPolling, error, lastUpdated, startPolling, stopPolling, refresh } =
    useSystemMonitor({ pollInterval: 3000 });

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-end gap-1 mb-2">
        <button
          onClick={() => (isPolling ? stopPolling() : startPolling())}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          title={isPolling ? "Pause auto-refresh" : "Start auto-refresh"}
        >
          {isPolling ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={() => refresh()}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh now"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : !stats ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-blue-500 shrink-0" />
            <ProgressBar
              value={stats.cpu_percent}
              color="bg-blue-500"
              label="CPU"
              detail={`${stats.cpu_percent.toFixed(1)}%`}
            />
          </div>

          <div className="flex items-center gap-2">
            <MemoryStick size={16} className="text-green-500 shrink-0" />
            <ProgressBar
              value={stats.memory_percent}
              color="bg-green-500"
              label="Memory"
              detail={`${stats.memory_used_gb}GB / ${stats.memory_total_gb}GB`}
            />
          </div>

          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-purple-500 shrink-0" />
            <ProgressBar
              value={stats.disk_percent}
              color="bg-purple-500"
              label="Disk"
              detail={`${stats.disk_used_gb}GB / ${stats.disk_total_gb}GB`}
            />
          </div>

          {lastUpdated && (
            <p className="text-xs text-muted-foreground text-right">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
