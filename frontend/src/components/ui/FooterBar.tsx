"use client";

import { useState, useEffect } from "react";
import { FavoritesModal } from "../ClassicLayout/FavoritesModal";

/**
 * Footer/status bar component with window controls.
 *
 * Displays:
 * - Favorites button (left)
 * - Lock Size checkbox (right) - controls window resizability
 * - On Top checkbox (right) - controls always-on-top
 *
 * Manages its own state and calls Electron APIs directly.
 */
export function FooterBar() {
  const [lockSize, setLockSize] = useState(false);
  const [onTop, setOnTop] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const handleLockSizeChange = async (locked: boolean) => {
    setLockSize(locked);
    if (isElectron) {
      try {
        await (window as any).electronAPI.setWindowResizable(!locked);
      } catch (error) {
        console.error("Failed to set window resizable:", error);
      }
    }
  };

  const handleOnTopChange = async (alwaysOnTop: boolean) => {
    setOnTop(alwaysOnTop);
    if (isElectron) {
      try {
        await (window as any).electronAPI.setAlwaysOnTop(alwaysOnTop);
      } catch (error) {
        console.error("Failed to set always on top:", error);
      }
    }
  };

  return (
    <footer className="border-t border-border bg-background px-3 py-2 flex items-center justify-between">
      {/* Left side: Favorites */}
      <div className="flex items-center">
        <FavoritesModal />
      </div>

      {/* Right side: On Top, Lock Size checkboxes */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={onTop}
            onChange={(e) => handleOnTopChange(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span>On Top</span>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={lockSize}
            onChange={(e) => handleLockSizeChange(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span>Lock Size</span>
        </label>
      </div>
    </footer>
  );
}
