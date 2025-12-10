"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SectionButtonRow, StatusLabel, SectionDivider, type ButtonConfig } from "@/components/ui";

/**
 * Prompt section component matching original scriptboard.py layout.
 * 
 * Buttons: Load, Paste, View, Clear
 * Status: Shows prompt source or "No prompt"
 */
export function PromptSection() {
  const [promptSource, setPromptSource] = useState<string | null>(null);
  const [promptPasteCount, setPromptPasteCount] = useState(0);
  const [isElectron, setIsElectron] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewContent, setViewContent] = useState("");

  useEffect(() => {
    loadSessionStatus();
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const loadSessionStatus = async () => {
    try {
      const session = await api.getSession();
      setPromptSource(session.prompt_source || null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load session status:", error);
      }
    }
  };

  const handleLoadPrompt = async () => {
    if (isElectron) {
      try {
        const result = await (window as any).electronAPI.openFileDialog({
          title: "Select llm-prompt.json",
          filters: [
            { name: "JSON files", extensions: ["json"] },
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
          // Set prompt via API
          await api.setPrompt(fileData.content);
          setPromptSource(fileData.filename || "File");
          setPromptPasteCount(0);
          await loadSessionStatus();
        }
      } catch (error) {
        console.error("Failed to load prompt file:", error);
        alert("Failed to load prompt file");
      }
    } else {
      // Browser fallback: use file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          try {
            await api.setPrompt(text);
            setPromptSource(file.name);
            setPromptPasteCount(0);
            await loadSessionStatus();
          } catch (error) {
            console.error("Failed to set prompt:", error);
          }
        }
      };
      input.click();
    }
  };

  const handleSetPrompt = async () => {
    try {
      // Ensure document is focused before accessing clipboard
      if (typeof window !== "undefined" && document.hasFocus) {
        window.focus();
        // Small delay to ensure focus
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        alert("Clipboard empty");
        return;
      }
      await api.setPrompt(text);
      setPromptSource("Clipboard");
      setPromptPasteCount((prev) => prev + 1);
      await loadSessionStatus();
    } catch (error) {
      console.error("Failed to paste prompt:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        alert("Please click the button again to allow clipboard access");
      } else {
        alert("Failed to read clipboard");
      }
    }
  };

  const handleViewPrompt = async () => {
    try {
      const preview = await api.getPreview();
      const promptText = preview.preview.split("\n\n")[0]?.replace("=== PROMPT ===\n", "") || "";
      setViewContent(promptText);
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to load prompt:", error);
      alert("No prompt to view");
    }
  };

  const handleClearPrompt = async () => {
    try {
      await api.clearPrompt();
      setPromptSource(null);
      setPromptPasteCount(0);
      await loadSessionStatus();
    } catch (error) {
      console.error("Failed to clear prompt:", error);
    }
  };

  const getStatusText = (): string => {
    if (!promptSource && promptPasteCount === 0) {
      return "No prompt";
    }
    if (promptSource) {
      return `[${promptSource}]`;
    }
    if (promptPasteCount > 0) {
      return promptPasteCount === 1
        ? "Prompt Accepted"
        : `Prompts Accepted: ${promptPasteCount}`;
    }
    return "No prompt";
  };

  const buttons: ButtonConfig[] = [
    { text: "Load", onClick: handleLoadPrompt, variant: "primary" },
    { text: "Paste", onClick: handleSetPrompt, variant: "secondary" },
    { text: "View", onClick: handleViewPrompt, variant: "secondary" },
    { text: "Clear", onClick: handleClearPrompt, variant: "secondary" },
  ];

  return (
    <>
      <div className="px-5 py-2 bg-[#010409]">
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
            className="bg-[#0d1117] border border-[#21262d] rounded-md p-4 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-[#c9d1d9]">Prompt</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-[#8b949e] hover:text-[#c9d1d9]"
              >
                ✕
              </button>
            </div>
            <pre className="text-sm text-[#c9d1d9] whitespace-pre-wrap break-words font-mono">
              {viewContent || "No prompt content"}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

