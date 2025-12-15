"use client";

import { DetailedProcessInfo } from "@/lib/api";
import { Sparkline } from "./Sparkline";
import { ProcessDetails } from "./ProcessDetails";
import { ChevronRight, ChevronDown, Shield, Skull, Sparkles } from "lucide-react";

export interface ProcessRowProps {
  process: DetailedProcessInfo;
  isExpanded: boolean;
  onToggle: () => void;
  onKill: () => void;
  isKilling?: boolean;
  className?: string;
}

/**
 * A single process row with expand/collapse functionality.
 * Shows icon, name, PID, CPU, memory, and mini sparklines.
 * Expands to show ProcessDetails when clicked.
 */
export function ProcessRow({
  process,
  isExpanded,
  onToggle,
  onKill,
  isKilling = false,
  className = "",
}: ProcessRowProps) {
  return (
    <div className={`border-b border-border/50 ${className}`}>
      {/* Main row */}
      <div
        className={`
          flex items-center gap-2 p-2 cursor-pointer
          hover:bg-muted/50 transition-colors
          ${isExpanded ? "bg-muted/30" : ""}
        `}
        onClick={onToggle}
      >
        {/* Expand icon */}
        <button className="p-0.5 text-muted-foreground">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Category icon */}
        <span className="text-base" title={process.category}>
          {process.icon}
        </span>

        {/* Process name with badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate" title={process.name}>
              {process.name}
            </span>
            {process.is_protected && (
              <span title="Protected process">
                <Shield size={12} className="text-yellow-500 shrink-0" />
              </span>
            )}
            {process.is_new && (
              <span
                className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-medium bg-green-500/20 text-green-600 dark:text-green-400 rounded animate-pulse"
                title="Started within last 5 minutes"
              >
                <Sparkles size={8} />
                NEW
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">PID: {process.pid}</span>
        </div>

        {/* CPU with sparkline */}
        <div className="flex items-center gap-2 w-24">
          <Sparkline
            data={process.cpu_history.slice(-15)}
            width={40}
            height={16}
            color={process.cpu_percent > 50 ? "rgb(239, 68, 68)" : "rgb(59, 130, 246)"}
            fillOpacity={0.2}
          />
          <span
            className={`text-xs font-mono w-10 text-right ${
              process.cpu_percent > 50 ? "text-red-500" : ""
            }`}
          >
            {process.cpu_percent.toFixed(1)}%
          </span>
        </div>

        {/* Memory with sparkline */}
        <div className="flex items-center gap-2 w-28">
          <Sparkline
            data={process.memory_history.slice(-15)}
            width={40}
            height={16}
            color="rgb(34, 197, 94)"
            fillOpacity={0.2}
          />
          <span className="text-xs font-mono w-14 text-right">
            {process.memory_mb.toFixed(1)} MB
          </span>
        </div>

        {/* Kill button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onKill();
          }}
          disabled={isKilling || process.is_protected}
          className={`
            p-1.5 rounded transition-colors
            ${process.is_protected
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
            }
            disabled:opacity-50
          `}
          title={process.is_protected ? "Protected process" : "Kill process"}
        >
          <Skull size={14} />
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-2 pb-2">
          <ProcessDetails process={process} />
        </div>
      )}
    </div>
  );
}
