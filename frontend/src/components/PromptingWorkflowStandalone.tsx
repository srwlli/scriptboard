"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileCode, Merge, Search, Package, Palette, ChevronDown, ChevronUp, FolderOpen, Globe, Clipboard, Trash2, Copy, Save, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { SectionButtonRow, StatusLabel, type ButtonConfig, useConfirmModal } from "@/components/ui";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

/**
 * PromptingWorkflowStandalone - Self-contained component with all 4 sections.
 *
 * Stacked layout with all functionality inline:
 * - Prompt Section
 * - Attachments Section
 * - Responses Section
 * - Management Section
 */

interface PreloadedPrompt {
  key: string;
  label: string;
  preview: string;
}

interface Attachment {
  id: string;
  filename: string;
  lines: number;
  binary: boolean;
}

// Map prompt labels to Lucide icons
const getPromptIcon = (label: string) => {
  const iconMap: Record<string, typeof FileCode> = {
    "Code Review": FileCode,
    "Synthesize": Merge,
    "Research": Search,
    "Consolidate": Package,
    "UI Variations": Palette,
  };
  return iconMap[label] || FileCode;
};

export function PromptingWorkflowStandalone() {
  // ============================================
  // PROMPT SECTION STATE
  // ============================================
  const [promptSource, setPromptSource] = useState<string | null>(null);
  const [promptPasteCount, setPromptPasteCount] = useState(0);
  const [preloadedPrompts, setPreloadedPrompts] = useState<PreloadedPrompt[]>([]);
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>("");
  const [showPromptViewModal, setShowPromptViewModal] = useState(false);
  const [promptViewContent, setPromptViewContent] = useState("");
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [newPromptLabel, setNewPromptLabel] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [promptValidationErrors, setPromptValidationErrors] = useState<Record<string, string>>({});
  const [isPromptSaving, setIsPromptSaving] = useState(false);

  // ============================================
  // ATTACHMENTS SECTION STATE
  // ============================================
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentsViewModal, setShowAttachmentsViewModal] = useState(false);
  const [attachmentsViewContent, setAttachmentsViewContent] = useState("");

  // ============================================
  // RESPONSES SECTION STATE
  // ============================================
  const [responseCount, setResponseCount] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [llmUrls, setLlmUrls] = useState<Array<{ label: string; url: string }>>([]);
  const [showResponsesViewModal, setShowResponsesViewModal] = useState(false);
  const [responsesViewContent, setResponsesViewContent] = useState("");

  // ============================================
  // MANAGEMENT SECTION STATE
  // ============================================
  const [promptCount, setPromptCount] = useState(0);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [managementResponseCount, setManagementResponseCount] = useState(0);
  const [showManagementViewModal, setShowManagementViewModal] = useState(false);
  const [managementViewContent, setManagementViewContent] = useState("");

  // ============================================
  // SHARED STATE
  // ============================================
  const [isElectron, setIsElectron] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ConfirmModalComponent, confirm] = useConfirmModal();

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
    loadAllData();
  }, []);

  // Listen for session refresh events
  useSessionRefresh(() => {
    loadAllData();
  });

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPromptData(),
        loadAttachments(),
        loadResponsesData(),
        loadManagementCounts(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // PROMPT SECTION FUNCTIONS
  // ============================================
  const loadPromptData = async () => {
    try {
      const [session, promptsResponse] = await Promise.all([
        api.getSession(),
        api.getPreloadedPrompts(),
      ]);
      setPromptSource(session.prompt_source || null);
      setPreloadedPrompts(promptsResponse.prompts);
      if (session.prompt_source && session.prompt_source.startsWith("preloaded:")) {
        const key = session.prompt_source.split(":")[1];
        setSelectedPromptKey(key);
      } else if (!session.prompt_source) {
        setSelectedPromptKey("");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load prompt data:", error);
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
          const fileData = await (window as any).electronAPI.readFile(result.filePath);
          if (fileData.error) {
            toast.error(`Failed to read file: ${fileData.error}`);
            return;
          }
          await api.setPrompt(fileData.content);
          setPromptSource(fileData.filename || "File");
          setPromptPasteCount(0);
          await loadPromptData();
        }
      } catch (error) {
        console.error("Failed to load prompt file:", error);
        toast.error("Failed to load prompt file");
      }
    } else {
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
            await loadPromptData();
          } catch (error) {
            console.error("Failed to set prompt:", error);
          }
        }
      };
      input.click();
    }
  };

  const handlePastePrompt = async () => {
    try {
      if (typeof window !== "undefined" && document.hasFocus()) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error("Clipboard empty");
        return;
      }
      await api.setPrompt(text);
      setPromptSource("Clipboard");
      setPromptPasteCount((prev) => prev + 1);
      await loadPromptData();
    } catch (error) {
      console.error("Failed to paste prompt:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Please click the button again to allow clipboard access");
      } else {
        toast.error("Failed to read clipboard");
      }
    }
  };

  const handleViewPrompt = async () => {
    try {
      const response = await api.exportLlmFriendlyPrompt();
      if (response && response.text) {
        setPromptViewContent(response.text);
        setShowPromptViewModal(true);
      } else {
        toast.info("No prompt to view");
      }
    } catch (error: any) {
      console.error("Failed to load prompt:", error);
      toast.info("No prompt to view");
    }
  };

  const handleClearPrompt = async () => {
    try {
      await api.clearPrompt();
      setPromptSource(null);
      setPromptPasteCount(0);
      setSelectedPromptKey("");
      await loadPromptData();
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
      await loadPromptData();
      await loadManagementCounts();
    } catch (error) {
      console.error("Failed to load preloaded prompt:", error);
      toast.error("Failed to load preloaded prompt");
    }
  };

  const validatePromptForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!newPromptLabel.trim()) {
      errors.label = "Label is required";
    } else if (newPromptLabel.length > 100) {
      errors.label = "Label must be 100 characters or less";
    }
    if (!newPromptText.trim()) {
      errors.text = "Prompt text is required";
    } else if (newPromptText.length > 10000) {
      errors.text = "Prompt text must be 10,000 characters or less";
    }
    setPromptValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePrompt = async () => {
    if (!validatePromptForm()) return;
    setIsPromptSaving(true);
    try {
      await api.addPreloadedPrompt(newPromptLabel.trim(), newPromptText.trim());
      setNewPromptLabel("");
      setNewPromptText("");
      setPromptValidationErrors({});
      setShowAddPromptModal(false);
      await loadPromptData();
    } catch (error: any) {
      console.error("Failed to add prompt:", error);
      toast.error(error?.message || "Failed to add prompt");
    } finally {
      setIsPromptSaving(false);
    }
  };

  const handleCloseAddPromptModal = () => {
    setShowAddPromptModal(false);
    setNewPromptLabel("");
    setNewPromptText("");
    setPromptValidationErrors({});
  };

  const getPromptStatusText = (): string => {
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
      return promptPasteCount === 1 ? "Prompt Accepted" : `Prompts Accepted: ${promptPasteCount}`;
    }
    return "No prompt";
  };

  // ============================================
  // ATTACHMENTS SECTION FUNCTIONS
  // ============================================
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
            { name: "All files", extensions: ["*"] },
          ],
        });
        if (result && result.filePath && !result.canceled) {
          const fileData = await (window as any).electronAPI.readFile(result.filePath);
          if (fileData.error) {
            toast.error(`Failed to read file: ${fileData.error}`);
            return;
          }
          await api.addAttachmentText(fileData.content, fileData.filename);
          await loadAttachments();
          await loadManagementCounts();
        }
      } catch (error) {
        console.error("Failed to attach file:", error);
      }
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          if (file.size > 2_000_000) {
            toast.error("File too large to attach (max 2MB)");
            return;
          }
          const text = await file.text();
          try {
            await api.addAttachmentText(text, file.name);
            await loadAttachments();
            await loadManagementCounts();
          } catch (error) {
            console.error("Failed to attach file:", error);
          }
        }
      };
      input.click();
    }
  };

  const handlePasteAttachment = async () => {
    try {
      if (typeof window !== "undefined" && document.hasFocus()) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error("Clipboard empty");
        return;
      }
      const filename = `clipboard-${attachments.length + 1}.txt`;
      await api.addAttachmentText(text, filename);
      await loadAttachments();
      await loadManagementCounts();
    } catch (error) {
      console.error("Failed to paste attachment:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Please click the button again to allow clipboard access");
      } else {
        toast.error("Failed to read clipboard");
      }
    }
  };

  const handleViewAttachments = async () => {
    if (attachments.length === 0) {
      toast.info("No attachments to view");
      return;
    }
    try {
      const response = await api.exportLlmFriendlyAttachments();
      setAttachmentsViewContent(response.text);
      setShowAttachmentsViewModal(true);
    } catch (error) {
      console.error("Failed to load attachments:", error);
      toast.info("No attachments to view");
    }
  };

  const handleClearAttachments = async () => {
    try {
      await api.clearAttachments();
      setAttachments([]);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refresh"));
      }
    } catch (error) {
      console.error("Failed to clear attachments:", error);
    }
  };

  const getAttachmentsStatusText = (): string => {
    if (attachments.length === 0) {
      return "No attachments";
    }
    const totalLines = attachments.reduce((sum, att) => sum + att.lines, 0);
    const names = attachments.map((att) => att.filename).join(", ");
    return `${names} (${totalLines} lines)`;
  };

  // ============================================
  // RESPONSES SECTION FUNCTIONS
  // ============================================
  const loadResponsesData = async () => {
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
        console.error("Failed to load responses data:", error);
      }
    }
  };

  const handleOpenAllLLMs = () => {
    if (llmUrls.length === 0) {
      toast.info("No LLM URLs configured");
      return;
    }
    llmUrls.forEach((llm) => {
      window.open(llm.url, "_blank");
    });
  };

  const handlePasteResponse = async () => {
    try {
      if (typeof window !== "undefined" && document.hasFocus()) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error("Clipboard empty");
        return;
      }
      if (text.length > 200_000) {
        const confirmed = await confirm({
          title: "Large Content",
          message: `Clipboard content is very large (${text.length.toLocaleString()} chars). Add anyway?`,
          confirmText: "Add",
          cancelText: "Cancel",
        });
        if (!confirmed) {
          return;
        }
      }
      await api.addResponse(text);
      await loadResponsesData();
      await loadManagementCounts();
      toast.success(`Response added (${text.length.toLocaleString()} chars)`);
    } catch (error) {
      console.error("Failed to paste response:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Please click the button again to allow clipboard access");
      } else {
        toast.error("Failed to read clipboard");
      }
    }
  };

  const handleViewResponses = async () => {
    try {
      const response = await api.exportLlmFriendlyResponses();
      setResponsesViewContent(response.text);
      setShowResponsesViewModal(true);
    } catch (error) {
      console.error("Failed to load responses:", error);
      toast.info("No responses to view");
    }
  };

  const handleClearResponses = async () => {
    try {
      await api.clearResponses();
      setResponseCount(0);
      setTotalChars(0);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refresh"));
      }
    } catch (error) {
      console.error("Failed to clear responses:", error);
    }
  };

  const getResponsesStatusText = (): string => {
    return `Responses: ${responseCount} | Characters: ${totalChars.toLocaleString()}`;
  };

  // ============================================
  // MANAGEMENT SECTION FUNCTIONS
  // ============================================
  const loadManagementCounts = async () => {
    try {
      const session = await api.getSession();
      setPromptCount(session.has_prompt ? 1 : 0);
      setAttachmentCount(session.attachment_count || 0);
      setManagementResponseCount(session.response_count || 0);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load counts:", error);
      }
    }
  };

  const handleCopyAll = async () => {
    try {
      const response = await api.exportLlmFriendly();
      const text = response.text;
      if (typeof window !== "undefined" && document.hasFocus()) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await navigator.clipboard.writeText(text);
      const parts: string[] = [];
      if (promptCount > 0) parts.push("prompt");
      if (attachmentCount > 0) parts.push(`${attachmentCount} files`);
      if (managementResponseCount > 0) parts.push(`${managementResponseCount} responses`);
      toast.success(`Copied to clipboard: ${parts.join(" + ")}`);
    } catch (error) {
      console.error("Failed to copy:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Please click the button again to allow clipboard access");
      } else {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  const handleSaveAs = async () => {
    try {
      if (typeof window !== "undefined" && document.hasFocus()) {
        window.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error("Clipboard empty");
        return;
      }
      if (isElectron) {
        const result = await (window as any).electronAPI.selectFolder();
        if (result && result.path && !result.error) {
          const defaultName = `clipboard-${attachmentCount + 1}.txt`;
          const filename = prompt(`Filename:`, defaultName) || defaultName;
          toast.info(`Save to ${result.path}/${filename} - to be implemented`);
        }
      } else {
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
      toast.error("Failed to save clipboard");
    }
  };

  const handleViewAll = async () => {
    try {
      const response = await api.exportLlmFriendly();
      setManagementViewContent(response.text);
      setShowManagementViewModal(true);
    } catch (error) {
      console.error("Failed to load preview:", error);
      toast.info("No content to preview");
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: "Clear All",
      message: "Clear all session data? This cannot be undone.",
      confirmText: "Clear All",
      cancelText: "Cancel",
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await Promise.all([
        api.clearPrompt(),
        api.clearAttachments(),
        api.clearResponses(),
      ]);
      await loadManagementCounts();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refresh"));
      }
      toast.success("Cleared all");
    } catch (error) {
      console.error("Failed to clear all:", error);
      toast.error("Failed to clear all");
    }
  };

  const getManagementStatusText = (): string => {
    // Show prompt name instead of count
    let promptDisplay = "No prompt";
    if (selectedPromptKey) {
      const prompt = preloadedPrompts.find((p) => p.key === selectedPromptKey);
      promptDisplay = prompt ? prompt.label : "Prompt loaded";
    } else if (promptCount > 0) {
      promptDisplay = "Prompt loaded";
    }
    return `${promptDisplay} | Attachments: ${attachmentCount} | Responses: ${managementResponseCount}`;
  };

  // ============================================
  // BUTTON CONFIGS
  // ============================================
  const promptButtons: ButtonConfig[] = [
    { text: "Load", onClick: handleLoadPrompt, variant: "primary" },
    { text: "Paste", onClick: handlePastePrompt, variant: "secondary" },
    { text: "View", onClick: handleViewPrompt, variant: "secondary" },
    { text: "Clear", onClick: handleClearPrompt, variant: "secondary" },
  ];

  const attachmentButtons: ButtonConfig[] = [
    { text: "Load", onClick: handleAttachFile, variant: "primary" },
    { text: "Paste", onClick: handlePasteAttachment, variant: "secondary" },
    { text: "View", onClick: handleViewAttachments, variant: "secondary" },
    { text: "Clear", onClick: handleClearAttachments, variant: "secondary" },
  ];

  const responseButtons: ButtonConfig[] = [
    { text: "LLMs", onClick: handleOpenAllLLMs, variant: "primary" },
    { text: "Paste", onClick: handlePasteResponse, variant: "secondary" },
    { text: "Clear", onClick: handleClearResponses, variant: "secondary" },
  ];

  const managementButtons: ButtonConfig[] = [
    { text: "Copy All", onClick: handleCopyAll, variant: "primary" },
    { text: "Save As", onClick: handleSaveAs, variant: "secondary" },
    { text: "View", onClick: handleViewAll, variant: "secondary" },
    { text: "Clear All", onClick: handleClearAll, variant: "secondary" },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {isLoading && <LoadingSpinner />}
      {/* Single Card containing all sections */}
      <div className="bg-background border border-border rounded-lg">
        {/* Header with title and collapse toggle */}
        <div
          className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className="text-sm font-medium text-foreground">Prompt Workflow</span>
          <button
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Collapsible content */}
        {!isCollapsed && (
        <div className="px-2 py-3 border-t border-border">
        <div className="flex flex-col gap-4">
          {/* Prompt Section - Preloaded Prompts Icons Only */}
          <div className="flex justify-center">
            <div className="w-[268px] flex flex-wrap gap-1 items-center justify-start">
              <button
                onClick={() => setShowAddPromptModal(true)}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border border-dashed border-border bg-secondary text-muted-foreground hover:bg-accent hover:border-accent-foreground/20 hover:text-foreground flex items-center justify-center"
                title="Add a custom prompt"
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
                  >
                    <IconComponent size={14} />
                  </button>
                );
              })}
              <button
                onClick={handleClearPrompt}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                title="Clear current prompt"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Attachments Section - Icon Buttons */}
          <div className="flex justify-center">
            <div className="w-[268px] flex flex-wrap gap-1 items-center justify-start">
              <button
                onClick={handleAttachFile}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border border-dashed border-border bg-secondary text-muted-foreground hover:bg-accent hover:border-accent-foreground/20 hover:text-foreground flex items-center justify-center"
                title="Add attachment"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={handlePasteAttachment}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                title="Paste from clipboard"
              >
                <Clipboard size={14} />
              </button>
              <button
                onClick={handleClearAttachments}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                title="Clear attachments"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Responses Section - Icon Buttons */}
          <div className="flex justify-center">
            <div className="w-[268px] flex flex-wrap gap-1 items-center justify-start">
              <button
                onClick={handlePasteResponse}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border border-dashed border-border bg-secondary text-muted-foreground hover:bg-accent hover:border-accent-foreground/20 hover:text-foreground flex items-center justify-center"
                title="Add response from clipboard"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={handleOpenAllLLMs}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                title="Open all LLMs"
              >
                <Globe size={14} />
              </button>
              <button
                onClick={handleClearResponses}
                className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                title="Clear responses"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Management Section - Icon Buttons */}
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-[268px] flex flex-wrap gap-1 items-center justify-start">
                <button
                  onClick={handleCopyAll}
                  className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-primary text-primary-foreground border-primary hover:bg-primary/90 flex items-center justify-center"
                  title="Copy all to clipboard"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={handleSaveAs}
                  className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                  title="Save as file"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={handleViewAll}
                  className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                  title="View all"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-border" />

            <StatusLabel text={getManagementStatusText()} />
          </div>
        </div>
        </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Confirm Modal */}
      {ConfirmModalComponent}

      {/* Prompt View Modal */}
      {showPromptViewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowPromptViewModal(false)}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-foreground">Prompt</h3>
              <button onClick={() => setShowPromptViewModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
              {promptViewContent || "No prompt content"}
            </pre>
          </div>
        </div>
      )}

      {/* Add Prompt Modal */}
      {showAddPromptModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCloseAddPromptModal}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add New Prompt</h3>
              <button onClick={handleCloseAddPromptModal} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Label</label>
                <input
                  type="text"
                  value={newPromptLabel}
                  onChange={(e) => setNewPromptLabel(e.target.value)}
                  className={`w-full px-3 py-2 bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    promptValidationErrors.label ? "border-red-500" : "border-border"
                  }`}
                  placeholder="e.g., My Custom Prompt"
                  maxLength={100}
                />
                {promptValidationErrors.label && (
                  <p className="text-sm text-red-500 mt-1">{promptValidationErrors.label}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Prompt Text</label>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  className={`w-full px-3 py-2 bg-background border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm ${
                    promptValidationErrors.text ? "border-red-500" : "border-border"
                  }`}
                  placeholder="Enter your prompt text here..."
                  rows={10}
                  maxLength={10000}
                />
                <div className="flex justify-between items-center mt-1">
                  {promptValidationErrors.text && (
                    <p className="text-sm text-red-500">{promptValidationErrors.text}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {newPromptText.length} / 10,000 characters
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCloseAddPromptModal}
                className="px-4 py-2 bg-secondary text-foreground rounded hover:bg-accent"
                disabled={isPromptSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPromptSaving}
              >
                {isPromptSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments View Modal */}
      {showAttachmentsViewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAttachmentsViewModal(false)}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-foreground">Attached Files</h3>
              <button onClick={() => setShowAttachmentsViewModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
              {attachmentsViewContent}
            </pre>
          </div>
        </div>
      )}

      {/* Responses View Modal */}
      {showResponsesViewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowResponsesViewModal(false)}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-foreground">Responses</h3>
              <button onClick={() => setShowResponsesViewModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
              {responsesViewContent}
            </pre>
          </div>
        </div>
      )}

      {/* Management View Modal */}
      {showManagementViewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowManagementViewModal(false)}
        >
          <div
            className="bg-background border border-border rounded-md p-4 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-foreground">Preview</h3>
              <button onClick={() => setShowManagementViewModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
              {managementViewContent}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
