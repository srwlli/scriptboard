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
    <div className="px-5 py-4 bg-background">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Preview</h3>
        <button
          onClick={onToggle}
          className="px-2 py-1 text-xs rounded-md border border-border bg-secondary text-muted-foreground hover:bg-accent transition-colors"
        >
          Hide
        </button>
      </div>
      <div className="border border-border rounded-md bg-background">
        <PreviewPanel />
      </div>
    </div>
  );
}

