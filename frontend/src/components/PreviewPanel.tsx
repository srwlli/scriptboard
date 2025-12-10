"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function PreviewPanel() {
  const [preview, setPreview] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadPreview = async (full = false) => {
    setLoading(true);
    try {
      const result = full
        ? await api.getPreviewFull()
        : await api.getPreview();
      setPreview(result.preview);
      setIsExpanded(full);
    } catch (error) {
      console.error("Failed to load preview:", error);
      setPreview("Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (isExpanded) {
      loadPreview(false);
    } else {
      loadPreview(true);
    }
  };

  // Load truncated preview on mount
  useState(() => {
    if (!preview) {
      loadPreview(false);
    }
  });

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Preview</h2>
        <button
          onClick={handleToggle}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      ) : preview ? (
        <div className="p-3 rounded-md bg-muted border border-border max-h-96 overflow-y-auto">
          <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-mono">
            {preview}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No content to preview</p>
      )}
    </div>
  );
}

