"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { CollapsibleCard } from "@/components/ui";

export function SessionManagerPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <CollapsibleCard title="Session Manager">
      <div className="space-y-2">
        <button
          onClick={handleSaveSession}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          Save Session
        </button>
        <button
          onClick={handleLoadSession}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          Load Session
        </button>
        <button
          onClick={handleExportMarkdown}
          disabled={loading}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          Export Markdown
        </button>
        {message && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {message}
          </p>
        )}
      </div>
    </CollapsibleCard>
  );
}

