"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { ProcessCategory } from "@/lib/api";

export interface ProcessGroupProps {
  category: ProcessCategory;
  categoryName: string;
  icon: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

// Category display names
const CATEGORY_NAMES: Record<ProcessCategory, string> = {
  browser: "Browsers",
  dev: "Dev Tools",
  system: "System",
  app: "Applications",
  media: "Media",
  communication: "Communication",
  security: "Security",
  other: "Other",
};

/**
 * Collapsible category group for organizing processes.
 * Shows category icon, name, and process count.
 */
export function ProcessGroup({
  category,
  categoryName,
  icon,
  count,
  isExpanded,
  onToggle,
  children,
  className = "",
}: ProcessGroupProps) {
  const displayName = categoryName || CATEGORY_NAMES[category] || category;

  return (
    <div className={`border border-border rounded-md overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center gap-2 p-2
          bg-muted/50 hover:bg-muted transition-colors
          ${isExpanded ? "border-b border-border" : ""}
        `}
      >
        <span className="text-muted-foreground">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-sm">{displayName}</span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {count}
        </span>
      </button>

      {/* Content */}
      {isExpanded && <div>{children}</div>}
    </div>
  );
}

export { CATEGORY_NAMES };
