"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PreviewPanel } from "@/components/PreviewPanel";

/**
 * Toggleable preview panel component matching original scriptboard.py behavior.
 * 
 * Can be shown/hidden via toggle button.
 * Uses existing PreviewPanel component for content display.
 */
interface ToggleablePreviewProps {
  visible: boolean;
  onToggle: () => void;
}

export function ToggleablePreview({ visible, onToggle }: ToggleablePreviewProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="px-5 py-4 bg-[#010409]">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-[#c9d1d9]">Preview</h3>
        <button
          onClick={onToggle}
          className="px-2 py-1 text-xs rounded-md border border-[#21262d] bg-[#161b22] text-[#8b949e] hover:bg-[#21262d] transition-colors"
        >
          Hide
        </button>
      </div>
      <div className="border border-[#21262d] rounded-md bg-[#0d1117]">
        <PreviewPanel />
      </div>
    </div>
  );
}

