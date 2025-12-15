"use client";

import { useState } from "react";
import { CollapsibleCard } from "@/components/ui";
import { SystemStatsPanel } from "@/components/SystemStatsPanel";
import { ProcessListPanel } from "@/components/ProcessListPanel";
import { AppProcessesPanel } from "@/components/AppProcessesPanel";
import { ProcessListV2 } from "@/components/system-monitor";

interface SystemMonitorProps {
  /** Custom title text */
  title?: string;
  /** Start collapsed */
  defaultCollapsed?: boolean;
  /** Use v2 enhanced process list (default: true) */
  useV2?: boolean;
}

/**
 * System Monitor - unified component displaying system stats, app processes, and process list.
 * All panels wrapped in a single CollapsibleCard.
 *
 * v2 features:
 * - Process categorization with icons
 * - Expandable process details (path, cmdline, threads)
 * - Resource history sparklines
 * - Quick filter buttons
 * - Grouped view by category
 * - New process highlighting
 */
export function SystemMonitor({
  title = "System Monitor",
  defaultCollapsed = false,
  useV2 = true,
}: SystemMonitorProps) {
  const [showV2, setShowV2] = useState(useV2);

  return (
    <CollapsibleCard title={title} defaultCollapsed={defaultCollapsed}>
      <div className="space-y-4">
        {/* System Stats - compact bar */}
        <SystemStatsPanel />

        {showV2 ? (
          // V2: Enhanced process list with all features
          <ProcessListV2 />
        ) : (
          // V1: Legacy panels
          <>
            {/* App Processes */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">App Processes</h3>
              <AppProcessesPanel />
            </div>

            {/* Process List */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Process List</h3>
              <ProcessListPanel />
            </div>
          </>
        )}

        {/* Version toggle (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => setShowV2(!showV2)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Switch to {showV2 ? "v1" : "v2"}
          </button>
        )}
      </div>
    </CollapsibleCard>
  );
}
