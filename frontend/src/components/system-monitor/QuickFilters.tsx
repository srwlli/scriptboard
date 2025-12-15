"use client";

import { Globe, Code, Settings, Layout, Film, MessageSquare, Shield, Layers, Cpu, Clock, MemoryStick, Wifi, CheckCircle, Zap } from "lucide-react";

export type QuickFilter =
  | "all"
  | "apps"
  | "browsers"
  | "dev"
  | "system"
  | "media"
  | "communication"
  | "security"
  | "high_cpu"
  | "high_memory"
  | "network"
  | "safe_to_kill"
  | "startup"
  | "recent";

export interface QuickFiltersProps {
  active: QuickFilter;
  onChange: (filter: QuickFilter) => void;
  counts?: Partial<Record<QuickFilter, number>>;
  className?: string;
}

const FILTERS: Array<{
  id: QuickFilter;
  label: string;
  icon: React.ReactNode;
  color?: string;
}> = [
  { id: "all", label: "All", icon: <Layers size={12} /> },
  { id: "apps", label: "Apps", icon: <Layout size={12} /> },
  { id: "browsers", label: "Browsers", icon: <Globe size={12} /> },
  { id: "dev", label: "Dev", icon: <Code size={12} /> },
  { id: "system", label: "System", icon: <Settings size={12} /> },
  { id: "media", label: "Media", icon: <Film size={12} /> },
  { id: "communication", label: "Chat", icon: <MessageSquare size={12} /> },
  { id: "security", label: "Security", icon: <Shield size={12} /> },
  { id: "high_cpu", label: "High CPU", icon: <Cpu size={12} />, color: "text-red-500" },
  { id: "high_memory", label: "High Mem", icon: <MemoryStick size={12} />, color: "text-orange-500" },
  { id: "network", label: "Network", icon: <Wifi size={12} />, color: "text-blue-500" },
  { id: "safe_to_kill", label: "Safe", icon: <CheckCircle size={12} />, color: "text-green-500" },
  { id: "startup", label: "Startup", icon: <Zap size={12} />, color: "text-yellow-500" },
  { id: "recent", label: "Recent", icon: <Clock size={12} />, color: "text-emerald-500" },
];

/**
 * Quick filter buttons for filtering processes by category or status.
 * Stateless component - parent manages active state.
 */
export function QuickFilters({
  active,
  onChange,
  counts,
  className = "",
}: QuickFiltersProps) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {FILTERS.map((filter) => {
        const isActive = active === filter.id;
        const count = counts?.[filter.id];

        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className={`
              inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md
              border transition-all
              ${isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted hover:border-muted-foreground/30"
              }
              ${filter.color && !isActive ? filter.color : ""}
            `}
            title={filter.label}
          >
            {filter.icon}
            <span className="hidden sm:inline">{filter.label}</span>
            {count !== undefined && count > 0 && (
              <span className={`
                text-[10px] px-1 rounded
                ${isActive ? "bg-primary-foreground/20" : "bg-muted-foreground/10"}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
