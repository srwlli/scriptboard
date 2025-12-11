"use client";

import { useState, useEffect } from "react";
import { Plus, FileCode, Merge, Search, Package } from "lucide-react";
import { api } from "@/lib/api";
import { SectionButtonRow, StatusLabel, type ButtonConfig } from "@/components/ui";
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPromptLabel, setNewPromptLabel] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

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
      if (typeof window !== "undefined" && document.hasFocus()) {
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
      const response = await api.exportLlmFriendlyPrompt();
      if (response && response.text) {
        setViewContent(response.text);
        setShowViewModal(true);
      } else {
        alert("No prompt to view");
      }
    } catch (error: any) {
      console.error("Failed to load prompt:", error);
      const errorMessage = error?.message || "Failed to load prompt";
      if (errorMessage.includes("No prompt") || errorMessage.includes("No content")) {
        alert("No prompt to view");
      } else {
        alert(`Error: ${errorMessage}`);
      }
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

  const validatePromptForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate label
    if (!newPromptLabel.trim()) {
      errors.label = "Label is required";
    } else if (newPromptLabel.length > 100) {
      errors.label = "Label must be 100 characters or less";
    }

    // Validate text
    if (!newPromptText.trim()) {
      errors.text = "Prompt text is required";
    } else if (newPromptText.length > 10000) {
      errors.text = "Prompt text must be 10,000 characters or less";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePrompt = async () => {
    if (!validatePromptForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await api.addPreloadedPrompt(
        newPromptLabel.trim(),
        newPromptText.trim()
      );
      
      // Reset form
      setNewPromptLabel("");
      setNewPromptText("");
      setValidationErrors({});
      setShowAddModal(false);
      
      // Refresh prompt list
      await loadPreloadedPrompts();
    } catch (error: any) {
      console.error("Failed to add prompt:", error);
      const errorMessage = error?.message || "Failed to add prompt";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewPromptLabel("");
    setNewPromptText("");
    setValidationErrors({});
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
      <div className="mx-4 my-2 px-4 py-3 bg-background border border-border rounded-lg">
        <div className="space-y-2">
          {/* Preloaded Prompts Icons - Compact inline layout with tooltips */}
          {preloadedPrompts.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1 items-center justify-center">
                {/* Add New Prompt Icon - First position */}
                <button
                  onClick={() => setShowAddModal(true)}
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

      {/* Add Prompt Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCloseAddModal}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add New Prompt</h3>
              <button
                onClick={handleCloseAddModal}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Label Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={newPromptLabel}
                  onChange={(e) => setNewPromptLabel(e.target.value)}
                  className={`w-full px-3 py-2 bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    validationErrors.label ? "border-red-500" : "border-border"
                  }`}
                  placeholder="e.g., My Custom Prompt"
                  maxLength={100}
                />
                {validationErrors.label && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.label}</p>
                )}
              </div>

              {/* Text Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Prompt Text
                </label>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  className={`w-full px-3 py-2 bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm ${
                    validationErrors.text ? "border-red-500" : "border-border"
                  }`}
                  placeholder="Enter your prompt text here..."
                  rows={10}
                  maxLength={10000}
                />
                <div className="flex justify-between items-center mt-1">
                  {validationErrors.text && (
                    <p className="text-sm text-red-500">{validationErrors.text}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {newPromptText.length} / 10,000 characters
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCloseAddModal}
                className="px-4 py-2 bg-secondary text-foreground rounded hover:bg-accent"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

