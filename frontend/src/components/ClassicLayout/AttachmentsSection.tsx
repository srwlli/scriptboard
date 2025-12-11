"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SectionButtonRow, StatusLabel, type ButtonConfig } from "@/components/ui";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

interface Attachment {
  id: string;
  filename: string;
  lines: number;
  binary: boolean;
}

/**
 * Attachments section component matching original scriptboard.py layout.
 * 
 * Buttons: Load, Paste, View, Clear
 * Status: Shows attachment count and total lines
 */
export function AttachmentsSection() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isElectron, setIsElectron] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewContent, setViewContent] = useState("");

  useEffect(() => {
    loadAttachments();
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  // Listen for session refresh events
  useSessionRefresh(() => {
    loadAttachments();
  });

  const loadAttachments = async () => {
    try {
      const atts = await api.listAttachments();
      setAttachments(atts as Attachment[]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load attachments:", error);
      }
    }
  };

  const handleAttachFile = async () => {
    if (isElectron) {
      try {
        const result = await (window as any).electronAPI.openFileDialog({
          title: "Select file to attach",
          filters: [
            { name: "Code files", extensions: ["py", "js", "ts", "tsx", "jsx", "json", "md", "txt", "html", "css"] },
            { name: "Python", extensions: ["py"] },
            { name: "JavaScript", extensions: ["js", "jsx"] },
            { name: "TypeScript", extensions: ["ts", "tsx"] },
            { name: "All files", extensions: ["*"] },
          ],
        });
        if (result && result.filePath && !result.canceled) {
          // Read file via Electron IPC
          const fileData = await (window as any).electronAPI.readFile(result.filePath);
          if (fileData.error) {
            alert(`Failed to read file: ${fileData.error}`);
            return;
          }
          // Add attachment via API
          await api.addAttachmentText(fileData.content, fileData.filename);
          await loadAttachments();
        }
      } catch (error) {
        console.error("Failed to attach file:", error);
      }
    } else {
      // Browser fallback: use file input
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          if (file.size > 2_000_000) {
            alert("File too large to attach (max 2MB)");
            return;
          }
          const text = await file.text();
          try {
            await api.addAttachmentText(text, file.name);
            await loadAttachments();
          } catch (error) {
            console.error("Failed to attach file:", error);
          }
        }
      };
      input.click();
    }
  };

  const handlePasteCode = async () => {
    try {
      // Ensure document is focused before accessing clipboard
      if (typeof window !== "undefined" && document.hasFocus()) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        alert("Clipboard empty");
        return;
      }
      const baseName = "clipboard";
      const idx = attachments.length + 1;
      const filename = `${baseName}-${idx}.txt`;
      await api.addAttachmentText(text, filename);
      await loadAttachments();
    } catch (error) {
      console.error("Failed to paste attachment:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        alert("Please click the button again to allow clipboard access");
      } else {
        alert("Failed to read clipboard");
      }
    }
  };

  const handleViewAttachments = async () => {
    if (attachments.length === 0) {
      alert("No attachments to view");
      return;
    }
    try {
      const response = await api.exportLlmFriendlyAttachments();
      setViewContent(response.text);
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to load attachments:", error);
      alert("No attachments to view");
    }
  };

  const handleClearAttachments = async () => {
    try {
      await api.clearAttachments();
      setAttachments([]);
      
      // Trigger refresh for other sections
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refresh"));
      }
    } catch (error) {
      console.error("Failed to clear attachments:", error);
    }
  };

  const getStatusText = (): string => {
    if (attachments.length === 0) {
      return "No attachments";
    }
    const totalLines = attachments.reduce((sum, att) => sum + att.lines, 0);
    const names = attachments.map((att) => att.filename).join(", ");
    return `📎 ${names} (${totalLines} lines)`;
  };

  const buttons: ButtonConfig[] = [
    { text: "Load", onClick: handleAttachFile, variant: "primary" },
    { text: "Paste", onClick: handlePasteCode, variant: "secondary" },
    { text: "View", onClick: handleViewAttachments, variant: "secondary" },
    { text: "Clear", onClick: handleClearAttachments, variant: "secondary" },
  ];

  return (
    <>
      <div className="mx-4 my-2 px-4 py-3 bg-background border border-border rounded-lg">
        <div className="space-y-2">
          <SectionButtonRow buttons={buttons} />
          <StatusLabel text={getStatusText()} />
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-foreground">Attached Files</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
              {viewContent}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

