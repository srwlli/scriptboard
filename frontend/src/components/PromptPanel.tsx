"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function PromptPanel() {
  const [prompt, setPrompt] = useState("");
  const [promptSource, setPromptSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showView, setShowView] = useState(false);

  useEffect(() => {
    loadSessionStatus();
  }, []);

  const loadSessionStatus = async () => {
    try {
      const session = await api.getSession();
      setPromptSource(session.prompt_source || null);
    } catch (error) {
      console.error("Failed to load session status:", error);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      await api.setPrompt(text);
      setPrompt(text);
      setPromptSource("manual");
    } catch (error) {
      console.error("Failed to paste prompt:", error);
    }
  };

  const handleView = async () => {
    try {
      const preview = await api.getPreview();
      setPrompt(preview.preview.split("\n\n")[0]?.replace("=== PROMPT ===\n", "") || "");
      setShowView(true);
    } catch (error) {
      console.error("Failed to load prompt:", error);
    }
  };

  const handleClear = async () => {
    try {
      await api.clearPrompt();
      setPrompt("");
      setPromptSource(null);
      setShowView(false);
    } catch (error) {
      console.error("Failed to clear prompt:", error);
    }
  };

  const statusText = promptSource
    ? `Source: ${promptSource}`
    : "No prompt set";

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Prompt</h2>

      <div className="space-y-2 mb-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePaste}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Paste
          </button>
          <button
            onClick={handleView}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            View
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>

      {showView && prompt && (
        <div className="mt-3 p-3 rounded-md bg-muted border border-border">
          <pre className="text-xs text-foreground whitespace-pre-wrap break-words">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  );
}

