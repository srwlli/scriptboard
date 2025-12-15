"use client";

import { useState } from "react";
import { CollapsibleCard } from "@/components/ui";
import { SystemStatsPanel } from "@/components/SystemStatsPanel";
import { ProcessListPanel } from "@/components/ProcessListPanel";
import { AppProcessesPanel } from "@/components/AppProcessesPanel";
import { ProcessListV2 } from "@/components/system-monitor";
import { Power, PowerOff } from "lucide-react";

interface SystemMonitorProps {
  /** Custom title text */
  title?: string;
  /** Start collapsed */
  defaultCollapsed?: boolean;
  /** Use v2 enhanced process list (default: true) */
  useV2?: boolean;
  /** Start with monitoring enabled (default: false) */
  defaultEnabled?: boolean;
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
 * - On/off toggle to completely disable monitoring
 */
export function SystemMonitor({
  title = "System Monitor",
  defaultCollapsed = true,
  useV2 = true,
  defaultEnabled = false,
}: SystemMonitorProps) {
  const [showV2, setShowV2] = useState(useV2);
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);

  // Power toggle button for rightContent
  const powerToggle = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsEnabled(!isEnabled);
      }}
      className={`p-1 rounded transition-colors ${
        isEnabled
          ? "text-green-500 hover:bg-green-500/10"
          : "text-muted-foreground hover:bg-muted"
      }`}
      title={isEnabled ? "Turn off monitoring" : "Turn on monitoring"}
    >
      {isEnabled ? <Power size={14} /> : <PowerOff size={14} />}
    </button>
  );

  return (
    <CollapsibleCard title={title} defaultCollapsed={defaultCollapsed} rightContent={powerToggle}>
      {isEnabled ? (
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
      ) : (
        <div className="py-8 text-center text-muted-foreground text-sm">
          <PowerOff size={24} className="mx-auto mb-2 opacity-50" />
          <p>System monitoring is off</p>
          <p className="text-xs mt-1">Click the power button to enable</p>
        </div>
      )}
    </CollapsibleCard>
  );
}
