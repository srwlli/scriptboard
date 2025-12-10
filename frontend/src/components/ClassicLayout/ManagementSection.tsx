"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SectionButtonRow, StatusLabel, SectionDivider, type ButtonConfig } from "@/components/ui";

/**
 * Management section component matching original scriptboard.py layout.
 * 
 * Buttons: Copy All, Save As, View, Clear All
 * Status: Shows counts for prompts, attachments, responses
 */
export function ManagementSection() {
  const [promptCount, setPromptCount] = useState(0);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [isElectron, setIsElectron] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewContent, setViewContent] = useState("");

  useEffect(() => {
    loadCounts();
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const loadCounts = async () => {
    try {
      const session = await api.getSession();
      setPromptCount(session.has_prompt ? 1 : 0);
      setAttachmentCount(session.attachment_count || 0);
      setResponseCount(session.response_count || 0);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load counts:", error);
      }
    }
  };

  const handleCopyAll = async () => {
    try {
      const json = await api.exportJson();
      const jsonString = JSON.stringify(json, null, 2);
      // Ensure document is focused before writing to clipboard
      if (typeof window !== "undefined" && document.hasFocus) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await navigator.clipboard.writeText(jsonString);
      
      const parts: string[] = [];
      if (promptCount > 0) parts.push("prompt");
      if (attachmentCount > 0) parts.push(`${attachmentCount} files`);
      if (responseCount > 0) parts.push(`${responseCount} responses`);
      
      alert(`Copied JSON: ${parts.join(" + ")}`);
    } catch (error) {
      console.error("Failed to copy JSON:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        alert("Please click the button again to allow clipboard access");
      } else {
        alert("Failed to copy to clipboard");
      }
    }
  };

  const handleSaveClipboardToDir = async () => {
    try {
      // Ensure document is focused before accessing clipboard
      if (typeof window !== "undefined" && document.hasFocus) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        alert("Clipboard empty");
        return;
      }

      if (isElectron) {
        const result = await (window as any).electronAPI.selectFolder();
        if (result && result.path && !result.error) {
          const baseName = "clipboard";
          const idx = attachmentCount + 1;
          const defaultName = `${baseName}-${idx}.txt`;
          const filename = prompt(`Filename:`, defaultName) || defaultName;
          
          // TODO: Save file via Electron IPC or API
          alert(`Save to ${result.path}/${filename} - to be implemented`);
        }
      } else {
        // Browser fallback: download file
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `clipboard-${attachmentCount + 1}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to save clipboard:", error);
      alert("Failed to save clipboard");
    }
  };

  const handleViewCombinedPreview = async () => {
    try {
      const preview = await api.getPreviewFull();
      setViewContent(preview.preview);
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to load preview:", error);
      alert("No content to preview");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all session data? This cannot be undone.")) {
      return;
    }

    try {
      await Promise.all([
        api.clearPrompt(),
        api.clearAttachments(),
        api.clearResponses(),
      ]);
      await loadCounts();
      
      // Trigger refresh event for all sections
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refresh"));
      }
      
      alert("Cleared all");
    } catch (error) {
      console.error("Failed to clear all:", error);
      alert("Failed to clear all");
    }
  };

  const getStatusText = (): string => {
    return `Prompts: ${promptCount} | Attachments: ${attachmentCount} | Responses: ${responseCount}`;
  };

  const buttons: ButtonConfig[] = [
    { text: "Copy All", onClick: handleCopyAll, variant: "primary" },
    { text: "Save As", onClick: handleSaveClipboardToDir, variant: "secondary" },
    { text: "View", onClick: handleViewCombinedPreview, variant: "secondary" },
    { text: "Clear All", onClick: handleClearAll, variant: "secondary" },
  ];

  return (
    <>
      <div className="px-5 py-2 bg-background">
        <div className="space-y-2">
          <SectionButtonRow buttons={buttons} />
          <StatusLabel text={getStatusText()} />
        </div>
      </div>
      <SectionDivider />

      {/* View Modal */}
      {showViewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-foreground">Preview</h3>
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

