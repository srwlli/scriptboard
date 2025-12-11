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

  // Load character count from session (called once on mount and on session refresh)
  const loadCharCount = useCallback(async () => {
    try {
      const session = await api.getSession();
      setCharCount(session.total_chars || 0);
    } catch (error) {
      // Silently fail - backend might not be running
      if (process.env.NODE_ENV === 'development') {
        console.warn("Failed to load char count:", error);
      }
      setCharCount(0);
    }
  }, []);

  // Load once on mount
  useEffect(() => {
    loadCharCount();
  }, [loadCharCount]);

  // Listen for session refresh events (updates char count when session changes)
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

  const handleLockSizeToggle = useCallback(async (locked: boolean) => {
    setLockSize(locked);
    
    const electronAPI = typeof window !== "undefined" ? (window as any).electronAPI : null;
    const hasElectronAPI = electronAPI && 
      typeof electronAPI.getWindowSize === "function" &&
      typeof electronAPI.setWindowSize === "function" &&
      typeof electronAPI.setWindowResizable === "function";
    
    if (hasElectronAPI) {
      // Electron: Lock window size
      try {
        if (locked) {
          // Get current window size and lock it
          const size = await electronAPI.getWindowSize();
          if (size && size.width && size.height && !size.error) {
            await electronAPI.setWindowSize(size.width, size.height);
            await electronAPI.setWindowResizable(false);
            // showStatus("Size locked"); // Removed feedback message
          }
        } else {
          // Unlock: First explicitly reset constraints, then enable resizing
          // Order is critical: reset constraints BEFORE enabling resizing
          if (typeof electronAPI.resetWindowSizeConstraints === "function") {
            await electronAPI.resetWindowSizeConstraints();
          }
          // Small delay to ensure constraints are applied
          await new Promise(resolve => setTimeout(resolve, 50));
          await electronAPI.setWindowResizable(true);
          // showStatus("Size unlocked"); // Removed feedback message
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to toggle lock size:", error);
        }
        // showStatus("Failed to toggle lock size"); // Removed feedback message
      }
    } else {
      // Browser: Apply CSS max-width to container
      if (locked && typeof document !== "undefined") {
        const container = document.querySelector(".classic-layout-container");
        if (container) {
          const rect = (container as HTMLElement).getBoundingClientRect();
          (container as HTMLElement).style.maxWidth = `${rect.width}px`;
          // showStatus("Size locked (CSS only)"); // Removed feedback message
        }
      } else if (typeof document !== "undefined") {
        const container = document.querySelector(".classic-layout-container");
        if (container) {
          (container as HTMLElement).style.maxWidth = "";
          // showStatus("Size unlocked"); // Removed feedback message
        }
      }
    }
  }, [showStatus]);

  const handleOnTopToggle = useCallback(async (onTopValue: boolean) => {
    const electronAPI = typeof window !== "undefined" ? (window as any).electronAPI : null;
    const hasElectronAPI = electronAPI && typeof electronAPI.setAlwaysOnTop === "function";
    
    if (hasElectronAPI) {
      // Electron: Set window always on top
      try {
        setOnTop(onTopValue);
        await electronAPI.setAlwaysOnTop(onTopValue);
        // showStatus(onTopValue ? "Always on top enabled" : "Always on top disabled"); // Removed feedback message
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to toggle always on top:", error);
        }
        // showStatus("Failed to toggle always on top"); // Removed feedback message
        setOnTop(false);
      }
    } else {
      // Browser: Not supported, show message
      if (onTopValue) {
        // showStatus("Always on top requires Electron. Please use the desktop app."); // Removed feedback message
        setOnTop(false);
      } else {
        setOnTop(false);
      }
    }
  }, [showStatus]);

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

