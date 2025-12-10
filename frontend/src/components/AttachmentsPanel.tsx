"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Attachment {
  id: string;
  filename: string;
  lines: number;
  binary: boolean;
}

export function AttachmentsPanel() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    loadAttachments();
    // Check for Electron API availability on client side only
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const loadAttachments = async () => {
    try {
      const atts = await api.listAttachments();
      setAttachments(atts as Attachment[]);
    } catch (error) {
      console.error("Failed to load attachments:", error);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      await api.addAttachmentText(text);
      await loadAttachments();
    } catch (error) {
      console.error("Failed to paste attachment:", error);
    }
  };

  const handleView = async (attachmentId: string) => {
    // TODO: Show attachment content in modal or expandable view
    console.log("View attachment:", attachmentId);
  };

  const handleImportFolder = async () => {
    // Check if we're in Electron
    if (isElectron) {
      try {
        const result = await (window as any).electronAPI.selectFolder();
        if (result && result.path && !result.error) {
          setLoading(true);
          try {
            const data = await api.importFolder(result.path);
            await loadAttachments();
            alert(`Imported ${data.imported} files from folder`);
          } catch (error) {
            console.error("Failed to import folder:", error);
            alert("Failed to import folder");
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to select folder:", error);
      }
    } else {
      alert("Folder import requires Electron. Please use the desktop app.");
    }
  };

  const handleClear = async () => {
    try {
      await api.clearAttachments();
      setAttachments([]);
    } catch (error) {
      console.error("Failed to clear attachments:", error);
    }
  };

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Attachments</h2>

      <div className="space-y-2 mb-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePaste}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Paste
          </button>
          {isElectron && (
            <button
              onClick={handleImportFolder}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? "Importing..." : "Import Folder"}
            </button>
          )}
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {attachments.length} attachment{attachments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="px-2 py-1.5 rounded hover:bg-accent transition-colors"
            >
              <button
                onClick={() => handleView(att.id)}
                className="w-full text-left"
              >
                <span className="text-sm font-medium text-foreground">
                  {att.filename}
                </span>
                <br />
                <span className="text-xs text-muted-foreground">
                  {att.lines} lines {att.binary && "(binary)"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

