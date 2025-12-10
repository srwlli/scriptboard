"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useSessionRefresh } from "./useSessionRefresh";

/**
 * Custom hook for managing classic layout state.
 * 
 * Manages:
 * - Preview visibility (toggleable)
 * - Footer state (status message, size visibility, lock size, on top)
 * - Character count
 */
export function useClassicLayout() {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showSize, setShowSize] = useState(false);
  const [lockSize, setLockSize] = useState(false);
  const [onTop, setOnTop] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Load character count from session
  const loadCharCount = useCallback(async () => {
    try {
      const session = await api.getSession();
      setCharCount(session.total_chars || 0);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load char count:", error);
      }
    }
  }, []);

  useEffect(() => {
    loadCharCount();
    // Poll for updates
    const interval = setInterval(loadCharCount, 2000);
    return () => clearInterval(interval);
  }, [loadCharCount]);

  // Listen for session refresh events
  useSessionRefresh(() => {
    loadCharCount();
  });

  const showStatus = useCallback((message: string, timeoutMs: number = 2000) => {
    setStatusMessage(message);
    if (timeoutMs > 0) {
      setTimeout(() => setStatusMessage(""), timeoutMs);
    }
  }, []);

  const togglePreview = useCallback(() => {
    setPreviewVisible((prev) => !prev);
  }, []);

  const handleLockSizeToggle = useCallback((locked: boolean) => {
    setLockSize(locked);
    // Apply CSS max-width to container if locked
    if (locked && typeof document !== "undefined") {
      const container = document.querySelector(".classic-layout-container");
      if (container) {
        const rect = (container as HTMLElement).getBoundingClientRect();
        (container as HTMLElement).style.maxWidth = `${rect.width}px`;
      }
    } else if (typeof document !== "undefined") {
      const container = document.querySelector(".classic-layout-container");
      if (container) {
        (container as HTMLElement).style.maxWidth = "";
      }
    }
  }, []);

  const handleOnTopToggle = useCallback((onTopValue: boolean) => {
    setOnTop(onTopValue);
    // Apply CSS position: sticky if on top
    if (onTopValue && typeof document !== "undefined") {
      const container = document.querySelector(".classic-layout-container");
      if (container) {
        (container as HTMLElement).style.position = "sticky";
        (container as HTMLElement).style.top = "0";
        (container as HTMLElement).style.zIndex = "10";
      }
    } else if (typeof document !== "undefined") {
      const container = document.querySelector(".classic-layout-container");
      if (container) {
        (container as HTMLElement).style.position = "";
        (container as HTMLElement).style.top = "";
        (container as HTMLElement).style.zIndex = "";
      }
    }
  }, []);

  return {
    previewVisible,
    togglePreview,
    statusMessage,
    showStatus,
    showSize,
    setShowSize,
    lockSize,
    setLockSize: handleLockSizeToggle,
    onTop,
    setOnTop: handleOnTopToggle,
    charCount,
  };
}

