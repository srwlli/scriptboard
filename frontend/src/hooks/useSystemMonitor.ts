"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, SystemStats } from "@/lib/api";

interface UseSystemMonitorOptions {
  pollInterval?: number; // milliseconds, default 3000
  autoStart?: boolean;
}

export function useSystemMonitor(options: UseSystemMonitorOptions = {}) {
  const { pollInterval = 3000, autoStart = true } = options;

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isPolling, setIsPolling] = useState(autoStart);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const data = await api.getSystemStats();
      if (!isMountedRef.current) return;

      setStats(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    }
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    isMountedRef.current = true;

    if (isPolling) {
      fetchStats(); // Immediate fetch
      intervalRef.current = setInterval(fetchStats, pollInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, pollInterval, fetchStats]);

  return {
    stats,
    isPolling,
    error,
    lastUpdated,
    startPolling,
    stopPolling,
    refresh,
  };
}
