"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SectionButtonRow, StatusLabel, SectionDivider, type ButtonConfig } from "@/components/ui";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

/**
 * Responses section component matching original scriptboard.py layout.
 * 
 * Buttons: LLMs, Paste, View, Clear
 * Status: Shows response count and character total
 */
export function ResponsesSection() {
  const [responseCount, setResponseCount] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [llmUrls, setLlmUrls] = useState<Array<{ label: string; url: string }>>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewContent, setViewContent] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // Listen for session refresh events
  useSessionRefresh(() => {
    loadData();
  });

  const loadData = async () => {
    try {
      const [summary, config] = await Promise.all([
        api.getResponsesSummary(),
        api.getConfig(),
      ]);
      setResponseCount(summary.count || 0);
      setTotalChars(summary.char_count || 0);
      setLlmUrls((config.llm_urls || []) as Array<{ label: string; url: string }>);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load data:", error);
      }
    }
  };

  const handleOpenAllLLMs = () => {
    if (llmUrls.length === 0) {
      alert("No LLM URLs configured");
      return;
    }
    // Open all LLM URLs in new windows
    llmUrls.forEach((llm) => {
      window.open(llm.url, "_blank");
    });
  };

  const handlePaste = async () => {
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

      // Size guard: confirm for very large content
      if (text.length > 200_000) {
        if (!confirm("Clipboard content is very large. Add anyway?")) {
          return;
        }
      }

      await api.addResponse(text);
      await loadData();
    } catch (error) {
      console.error("Failed to paste response:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        alert("Please click the button again to allow clipboard access");
      } else {
        alert("Failed to read clipboard");
      }
    }
  };

  const handleViewResponses = async () => {
    try {
      const response = await api.exportLlmFriendlyResponses();
      setViewContent(response.text);
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to load responses:", error);
      alert("No responses to view");
    }
  };

  const handleClear = async () => {
    try {
      await api.clearResponses();
      setResponseCount(0);
      setTotalChars(0);
      
      // Trigger refresh for other sections
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refresh"));
      }
    } catch (error) {
      console.error("Failed to clear responses:", error);
    }
  };

  const getStatusText = (): string => {
    return `Responses: ${responseCount} | Characters: ${totalChars.toLocaleString()}`;
  };

  const buttons: ButtonConfig[] = [
    { text: "LLMs", onClick: handleOpenAllLLMs, variant: "primary" },
    { text: "Paste", onClick: handlePaste, variant: "secondary" },
    { text: "View", onClick: handleViewResponses, variant: "secondary" },
    { text: "Clear", onClick: handleClear, variant: "secondary" },
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
            className="bg-background border border-border rounded-md p-4 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-foreground">Responses</h3>
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

