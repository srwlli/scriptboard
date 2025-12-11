"use client";

import { useState, useEffect } from "react";
import { useClassicLayout } from "@/hooks/useClassicLayout";

/**
 * User Feedback Panel - displays system status and metrics.
 *
 * Shows:
 * - Status message (dynamic feedback)
 * - Window size (width x height)
 * - Character count
 */
export function UserFeedbackPanel() {
  const { statusMessage, charCount } = useClassicLayout();
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
    <div className="border border-border rounded-lg p-4 bg-background">
      <h3 className="text-sm font-semibold text-foreground mb-3">User Feedback</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="text-foreground">{statusMessage || "Ready"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Window Size</span>
          <span className="text-foreground">
            {windowSize.width > 0 ? `${windowSize.width} x ${windowSize.height}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Char Count</span>
          <span className="text-foreground">{charCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
