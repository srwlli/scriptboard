"use client";

import { useState, useEffect } from "react";

/**
 * Reusable footer/status bar component matching original scriptboard.py layout.
 * 
 * Displays:
 * - Status message (left)
 * - Size label (toggleable, left)
 * - Char count (left)
 * - Lock Size checkbox (right)
 * - On Top checkbox (right)
 * 
 * @example
 * ```tsx
 * <FooterBar
 *   statusMessage="Ready"
 *   charCount={1234}
 *   showSize={true}
 *   onLockSizeChange={(locked) => setLockSize(locked)}
 *   onOnTopChange={(onTop) => setOnTop(onTop)}
 * />
 * ```
 */

interface FooterBarProps {
  statusMessage?: string;
  charCount?: number;
  showSize?: boolean;
  lockSize?: boolean;
  onTop?: boolean;
  onLockSizeChange?: (locked: boolean) => void;
  onOnTopChange?: (onTop: boolean) => void;
  className?: string;
}

export function FooterBar({
  statusMessage = "",
  charCount = 0,
  showSize = false,
  lockSize = false,
  onTop = false,
  onLockSizeChange,
  onOnTopChange,
  className = "",
}: FooterBarProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <footer
      className={`border-t border-[#21262d] bg-[#010409] px-3 py-2 flex items-center justify-between ${className}`}
    >
      {/* Left side: Status, Size, Char count */}
      <div className="flex items-center gap-2 text-sm text-[#8b949e]">
        {statusMessage && (
          <span className="px-2">{statusMessage}</span>
        )}
        {showSize && windowSize.width > 0 && (
          <span className="px-2">
            {windowSize.width} x {windowSize.height}
          </span>
        )}
        <span className="px-2">Chars: {charCount.toLocaleString()}</span>
      </div>

      {/* Right side: Lock Size, On Top checkboxes */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm text-[#8b949e] cursor-pointer">
          <input
            type="checkbox"
            checked={onTop}
            onChange={(e) => onOnTopChange?.(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span>On Top</span>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-[#8b949e] cursor-pointer">
          <input
            type="checkbox"
            checked={lockSize}
            onChange={(e) => onLockSizeChange?.(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span>Lock Size</span>
        </label>
      </div>
    </footer>
  );
}

