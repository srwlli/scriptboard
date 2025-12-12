"use client";

import { useState, useEffect } from "react";
import { CollapsibleCard } from "@/components/ui";

/**
 * User Feedback Panel - displays system status and metrics.
 *
 * Shows:
 * - Status message (dynamic feedback)
 * - Window size (width x height)
 */
export function UserFeedbackPanel() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <CollapsibleCard title="User Feedback">
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="text-foreground">Ready</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Window Size</span>
          <span className="text-foreground">
            {windowSize.width > 0 ? `${windowSize.width} x ${windowSize.height}` : "—"}
          </span>
        </div>
      </div>
    </CollapsibleCard>
  );
}
