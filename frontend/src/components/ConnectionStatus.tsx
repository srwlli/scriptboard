"use client";

import { useBackendConnection } from "@/hooks/useBackendConnection";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

/**
 * Connection status indicator component.
 * Shows backend connection status in the header.
 */
export function ConnectionStatus() {
  const { status, isConnected, isDisconnected, lastError, retry } = useBackendConnection();

  if (status === "checking") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (isDisconnected) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <WifiOff size={12} />
        <span>Backend Offline</span>
        <button
          onClick={retry}
          className="ml-1 underline hover:no-underline"
          title={lastError || "Click to retry connection"}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-green-600 dark:text-green-400">
      <Wifi size={12} />
      <span>Connected</span>
    </div>
  );
}

