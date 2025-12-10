"use client";

import { useState, useEffect } from "react";
import { Plus, FileCode, Merge, Search, Package } from "lucide-react";
import { api } from "@/lib/api";
import { SectionButtonRow, StatusLabel, SectionDivider, type ButtonConfig } from "@/components/ui";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

/**
 * Prompt section component matching original scriptboard.py layout.
 * 
 * Buttons: Load, Paste, View, Clear
 * Status: Shows prompt source or "No prompt"
 */
interface PreloadedPrompt {
  key: string;
  label: string;
  preview: string;
}

// Map prompt labels to Lucide icons
const getPromptIcon = (label: string) => {
  const iconMap: Record<string, typeof FileCode> = {
    "Code Review": FileCode,
    "Synthesize": Merge,
    "Research": Search,
    "Consolidate": Package,
  };
  return iconMap[label] || FileCode; // Default to FileCode if not found
};

export function PromptSection() {
  const [promptSource, setPromptSource] = useState<string | null>(null);
  const [promptPasteCount, setPromptPasteCount] = useState(0);
  const [isElectron, setIsElectron] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewContent, setViewContent] = useState("");
  const [preloadedPrompts, setPreloadedPrompts] = useState<PreloadedPrompt[]>([]);
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>("");

  useEffect(() => {
    loadSessionStatus();
    loadPreloadedPrompts();
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const loadPreloadedPrompts = async () => {
    try {
      const response = await api.getPreloadedPrompts();
      setPreloadedPrompts(response.prompts);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load preloaded prompts:", error);
      }
    }
  };

  // Listen for session refresh events
  useSessionRefresh(() => {
    loadSessionStatus();
    setPromptPasteCount(0);
    // Reset selected prompt if cleared
    if (!promptSource || !promptSource.startsWith("preloaded:")) {
      setSelectedPromptKey("");
    }
  });

  const loadSessionStatus = async () => {
    try {
      const session = await api.getSession();
      setPromptSource(session.prompt_source || null);
      // Update selected prompt key if source is preloaded
      if (session.prompt_source && session.prompt_source.startsWith("preloaded:")) {
        const key = session.prompt_source.split(":")[1];
        setSelectedPromptKey(key);
      } else if (!session.prompt_source) {
        setSelectedPromptKey("");
      }
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
      setSelectedPromptKey("");
      await loadSessionStatus();
      
      // Trigger refresh for other sections
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refresh"));
      }
    } catch (error) {
      console.error("Failed to clear prompt:", error);
    }
  };

  const handleSelectPrompt = async (key: string) => {
    try {
      await api.usePreloadedPrompt(key);
      setSelectedPromptKey(key);
      setPromptPasteCount(0);
      await loadSessionStatus();
    } catch (error) {
      console.error("Failed to load preloaded prompt:", error);
      alert("Failed to load preloaded prompt");
    }
  };

  const getStatusText = (): string => {
    if (!promptSource && promptPasteCount === 0 && !selectedPromptKey) {
      return "No prompt";
    }
    if (promptSource) {
      return `[${promptSource}]`;
    }
    if (selectedPromptKey) {
      const prompt = preloadedPrompts.find((p) => p.key === selectedPromptKey);
      return prompt ? `[Preloaded: ${prompt.label}]` : "[Preloaded]";
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
      <div className="px-5 py-2 bg-background">
        <div className="space-y-2">
          {/* Preloaded Prompts Icons - Compact inline layout with tooltips */}
          {preloadedPrompts.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1 items-center justify-center">
                {/* Add New Prompt Icon - First position */}
                <button
                  onClick={() => {
                    // TODO: Wire up add new prompt functionality
                    console.log("Add new prompt clicked - not yet implemented");
                  }}
                  className="p-1.5 rounded font-medium cursor-pointer transition-colors border border-dashed border-border bg-secondary text-muted-foreground hover:bg-accent hover:border-accent-foreground/20 hover:text-foreground flex items-center justify-center"
                  title="Add a new preloaded prompt"
                  aria-label="Add new preloaded prompt"
                >
                  <Plus size={14} />
                </button>
                {preloadedPrompts.map((prompt) => {
                  const isSelected = selectedPromptKey === prompt.key;
                  const IconComponent = getPromptIcon(prompt.label);
                  return (
                    <button
                      key={prompt.key}
                      onClick={() => handleSelectPrompt(prompt.key)}
                      className={`p-1.5 rounded font-medium cursor-pointer transition-colors border flex items-center justify-center ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                          : "bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20"
                      }`}
                      title={`${prompt.label}\n\n${prompt.preview}`}
                      aria-label={`Load preloaded prompt: ${prompt.label}`}
                    >
                      <IconComponent size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
              <h3 className="text-lg font-semibold text-foreground">Prompt</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
              {viewContent || "No prompt content"}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

