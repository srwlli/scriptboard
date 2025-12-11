"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

/**
 * Connection status for backend
 */
export type ConnectionStatus = "connected" | "disconnected" | "checking";

/**
 * Hook to track backend connection status.
 *
 * Features:
 * - Tracks connection status (connected/disconnected/checking)
 * - Checks once on mount
 * - Manual retry via test() function
 * - No polling - user triggers connection test manually
 */
export function useBackendConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [lastError, setLastError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const checkConnection = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setStatus("checking");
      await api.health();

      if (!isMountedRef.current) return;
      setStatus("connected");
      setLastError(null);
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setLastError(errorMessage);
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Check once on mount
    checkConnection();

    return () => {
      isMountedRef.current = false;
    };
  }, [checkConnection]);

  // Manual test function
  const test = useCallback(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    status,
    isConnected: status === "connected",
    isDisconnected: status === "disconnected",
    isChecking: status === "checking",
    lastError,
    test,
  };
}

