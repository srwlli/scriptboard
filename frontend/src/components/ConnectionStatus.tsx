"use client";

import { useBackendConnection } from "@/hooks/useBackendConnection";
import { Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";

/**
 * Connection status indicator component.
 * Shows backend connection status with manual test button.
 */
export function ConnectionStatus() {
  const { status, isConnected, isDisconnected, isChecking, lastError, test } = useBackendConnection();

  return (
    <div className="flex items-center gap-2">
      {/* Status indicator */}
      {isChecking ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          <span>Checking...</span>
        </div>
      ) : isDisconnected ? (
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          title={lastError || "Backend is offline"}
        >
          <WifiOff size={12} />
          <span>Offline</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-green-600 dark:text-green-400">
          <Wifi size={12} />
          <span>Connected</span>
        </div>
      )}

      {/* Test Connection button */}
      <button
        onClick={test}
        disabled={isChecking}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        title="Test backend connection"
      >
        <RefreshCw size={12} className={isChecking ? "animate-spin" : ""} />
        <span>Test</span>
      </button>
    </div>
  );
}

