"use client";

import { useState, useEffect } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";

/**
 * Window control buttons component for frameless window.
 *
 * Features:
 * - Minimize, Maximize/Restore, and Close buttons
 * - Updates maximize icon based on window state
 * - Only renders in Electron environment
 * - Styled to match Windows window controls
 */
export function WindowControls() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check for Electron API availability
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
      // Check initial maximized state
      checkMaximizedState();
    }
  }, []);

  const checkMaximizedState = async () => {
    try {
      const result = await (window as any).electronAPI.isWindowMaximized();
      if (result && !result.error) {
        setIsMaximized(result.isMaximized);
      }
    } catch (error) {
      console.error("Failed to check window maximized state:", error);
    }
  };

  const handleMinimize = async () => {
    try {
      await (window as any).electronAPI.minimizeWindow();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const result = await (window as any).electronAPI.maximizeWindow();
      if (result && !result.error) {
        setIsMaximized(result.isMaximized);
      }
    } catch (error) {
      console.error("Failed to maximize window:", error);
    }
  };

  const handleClose = async () => {
    try {
      await (window as any).electronAPI.closeWindow();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  // Don't render in browser environment
  if (!isElectron) {
    return null;
  }

  return (
    <div
      className="flex items-center"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* Minimize */}
      <button
        onClick={handleMinimize}
        className="w-11 h-8 flex items-center justify-center hover:bg-accent transition-colors"
        aria-label="Minimize"
        title="Minimize"
      >
        <Minus size={16} className="text-foreground" />
      </button>

      {/* Maximize/Restore */}
      <button
        onClick={handleMaximize}
        className="w-11 h-8 flex items-center justify-center hover:bg-accent transition-colors"
        aria-label={isMaximized ? "Restore" : "Maximize"}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Maximize2 size={14} className="text-foreground" />
        ) : (
          <Square size={14} className="text-foreground" />
        )}
      </button>

      {/* Close */}
      <button
        onClick={handleClose}
        className="w-11 h-8 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
        aria-label="Close"
        title="Close"
      >
        <X size={16} className="text-foreground hover:text-destructive-foreground" />
      </button>
    </div>
  );
}
