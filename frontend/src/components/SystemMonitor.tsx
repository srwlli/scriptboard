"use client";

import { CollapsibleCard } from "@/components/ui";
import { SystemStatsPanel } from "@/components/SystemStatsPanel";
import { ProcessListPanel } from "@/components/ProcessListPanel";
import { AppProcessesPanel } from "@/components/AppProcessesPanel";

interface SystemMonitorProps {
  /** Custom title text */
  title?: string;
  /** Start collapsed */
  defaultCollapsed?: boolean;
}

/**
 * System Monitor - unified component displaying system stats, app processes, and process list.
 * All panels wrapped in a single CollapsibleCard.
 */
export function SystemMonitor({
  title = "System Monitor",
  defaultCollapsed = false,
}: SystemMonitorProps) {
  return (
    <CollapsibleCard title={title} defaultCollapsed={defaultCollapsed}>
      <div className="space-y-4">
        {/* System Stats */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">System Stats</h3>
          <SystemStatsPanel />
        </div>

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
      </div>
    </CollapsibleCard>
  );
}
