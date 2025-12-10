"use client";

import { useEffect } from "react";

/**
 * Hook to listen for session refresh events and trigger a callback.
 * Used to refresh all sections when data is cleared or modified.
 */
export function useSessionRefresh(onRefresh: () => void) {
  useEffect(() => {
    const handleRefresh = () => {
      onRefresh();
    };

    window.addEventListener("session-refresh", handleRefresh);
    return () => {
      window.removeEventListener("session-refresh", handleRefresh);
    };
  }, [onRefresh]);
}

/**
 * Trigger a session refresh event to notify all sections to reload.
 */
export function triggerSessionRefresh() {
  window.dispatchEvent(new CustomEvent("session-refresh"));
}

