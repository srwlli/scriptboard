"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function SessionManagerPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCopyAll = async () => {
    try {
      const json = await api.exportJson();
      const jsonString = JSON.stringify(json, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setMessage("Copied to clipboard!");
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Failed to copy JSON:", error);
      setMessage("Failed to copy");
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleExportMarkdown = async () => {
    setLoading(true);
    try {
      const data = await api.exportMarkdown();
      const blob = new Blob([data.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "scriptboard.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("Markdown exported!");
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Failed to export markdown:", error);
      setMessage("Failed to export");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSession = async () => {
    setLoading(true);
    try {
      const result = await api.saveSession();
      setMessage(`Saved: ${result.filename}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save session:", error);
      setMessage("Failed to save");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async () => {
    // TODO: Implement file picker (requires Electron IPC)
    setMessage("Load session - requires file picker (Electron)");
    setTimeout(() => setMessage(null), 2000);
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all session data? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
        api.clearPrompt(),
        api.clearAttachments(),
        api.clearResponses(),
      ]);
      setMessage("All cleared!");
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Failed to clear all:", error);
      setMessage("Failed to clear");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Session Manager</h2>

      <div className="space-y-2">
        <button
          onClick={handleCopyAll}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          Copy All JSON
        </button>
        <button
          onClick={handleSaveSession}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          Save Session
        </button>
        <button
          onClick={handleExportMarkdown}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          Export Markdown
        </button>
        <button
          onClick={handleLoadSession}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          Load Session
        </button>
        <button
          onClick={handleClearAll}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-red-500 bg-background hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
        >
          Clear All
        </button>
        {message && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

