"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface CollapsibleCardProps {
  /** Card title displayed in header */
  title: string;
  /** Card content (collapsed/expanded) */
  children: React.ReactNode;
  /** Initial collapsed state (default: true = collapsed) */
  defaultCollapsed?: boolean;
  /** Optional content to display on the right side of header (e.g., status badge) */
  rightContent?: React.ReactNode;
  /** Optional className for the outer container */
  className?: string;
}

/**
 * CollapsibleCard - A card with a clickable header that toggles content visibility.
 *
 * Features:
 * - Header with title and chevron toggle
 * - Click anywhere on header to toggle
 * - Optional right-side content (badges, status)
 * - Smooth hover states
 * - Accessible button with aria-label
 *
 * @example
 * ```tsx
 * <CollapsibleCard title="Settings" defaultCollapsed={false}>
 *   <p>Card content here</p>
 * </CollapsibleCard>
 * ```
 */
export function CollapsibleCard({
  title,
  children,
  defaultCollapsed = true,
  rightContent,
  className = "",
}: CollapsibleCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`bg-background border border-border rounded-lg ${className}`}>
      {/* Header - clickable to toggle */}
      <div
        className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {rightContent}
          <button
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
            onClick={(e) => {
              e.stopPropagation(); // Prevent double-toggle from header click
              setIsCollapsed(!isCollapsed);
            }}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="px-2 py-3 border-t border-border">{children}</div>
      )}
    </div>
  );
}
