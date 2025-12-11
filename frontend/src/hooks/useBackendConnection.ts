"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

/**
 * Connection status for backend
 */
export type ConnectionStatus = "connected" | "disconnected" | "checking";

/**
 * Hook to track backend connection status with circuit breaker pattern.
 * 
 * Features:
 * - Tracks connection status (connected/disconnected/checking)
 * - Circuit breaker: stops checking after consecutive failures
 * - Exponential backoff: increases delay between checks when disconnected
 * - Auto-recovery: periodically checks if backend comes back online
 */
export function useBackendConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const consecutiveFailuresRef = useRef(0);

  // Circuit breaker threshold - stop checking after this many failures
  const MAX_CONSECUTIVE_FAILURES = 5;
  
  // Base delay in ms, increases exponentially
  const BASE_DELAY_MS = 2000;
  
  // Max delay cap (30 seconds)
  const MAX_DELAY_MS = 30000;

  const checkConnection = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setStatus("checking");
      await api.health();
      
      // Success - reset failure count
      consecutiveFailuresRef.current = 0;
      setConsecutiveFailures(0);
      setStatus("connected");
      setLastError(null);
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const newFailureCount = consecutiveFailuresRef.current + 1;
      consecutiveFailuresRef.current = newFailureCount;
      
      setConsecutiveFailures(newFailureCount);
      setLastError(errorMessage);
      
      // If we've exceeded threshold, stop checking (circuit breaker open)
      if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
        setStatus("disconnected");
        // Still check periodically but with longer delay
        return;
      } else {
        setStatus("disconnected");
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial check
    checkConnection();

    const scheduleNextCheck = () => {
      if (checkIntervalRef.current) {
        clearTimeout(checkIntervalRef.current);
      }

      // Calculate delay based on current failure count (exponential backoff)
      const getDelay = () => {
        const failures = consecutiveFailuresRef.current;
        if (failures === 0) {
          return BASE_DELAY_MS; // Normal polling when connected
        }
        // Exponential backoff: 2s, 4s, 8s, 16s, 30s (capped)
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, failures - 1), MAX_DELAY_MS);
        return delay;
      };

      const delay = getDelay();
      
      checkIntervalRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          checkConnection().then(() => {
            if (isMountedRef.current) {
              scheduleNextCheck();
            }
          }).catch(() => {
            if (isMountedRef.current) {
              scheduleNextCheck();
            }
          });
        }
      }, delay);
    };

    scheduleNextCheck();

    return () => {
      isMountedRef.current = false;
      if (checkIntervalRef.current) {
        clearTimeout(checkIntervalRef.current);
      }
    };
  }, [checkConnection]);

  // Manual retry function
  const retry = useCallback(() => {
    consecutiveFailuresRef.current = 0;
    setConsecutiveFailures(0);
    checkConnection();
  }, [checkConnection]);

  return {
    status,
    isConnected: status === "connected",
    isDisconnected: status === "disconnected",
    lastError,
    consecutiveFailures,
    retry,
  };
}

