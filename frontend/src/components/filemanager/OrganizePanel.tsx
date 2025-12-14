"use client";

import { useState } from "react";
import { api, FileAction } from "@/lib/api";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import { ActionPreviewTable } from "./ActionPreviewTable";
import { FolderPicker } from "./FolderPicker";
import { Eye, Play, Loader2 } from "lucide-react";

export function OrganizePanel() {
  const [path, setPath] = useState("");
  const [organizeBy, setOrganizeBy] = useState<"ext" | "date" | "month">("ext");
  const [recursive, setRecursive] = useState(true);
  const [excludePatterns, setExcludePatterns] = useState("node_modules,.git");
  const [removeEmpty, setRemoveEmpty] = useState(false);

  const [preview, setPreview] = useState<FileAction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  const handlePreview = async () => {
    if (!path.trim()) {
      setError("Please enter a folder path");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await api.filemanOrganize({
        path: path.trim(),
        by: organizeBy,
        recursive,
        exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
        remove_empty: removeEmpty,
        apply: false,
      });
      setPreview(result.actions);
      if (result.actions.length === 0) {
        setSuccessMessage("No files found to organize");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview");
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview?.length) return;

    const confirmed = await confirm({
      title: "Apply Changes?",
      message: `This will move ${preview.length} file${preview.length !== 1 ? "s" : ""} into organized folders. Continue?`,
      confirmText: "Apply",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.filemanOrganize({
        path: path.trim(),
        by: organizeBy,
        recursive,
        exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
        remove_empty: removeEmpty,
        apply: true,
      });
      setPreview(null);
      setSuccessMessage(`Successfully organized ${result.actions.length} files`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {ConfirmModalComponent}

      {/* Path Input */}
      <FolderPicker
        value={path}
        onChange={setPath}
        placeholder="C:\Users\...\Downloads"
        disabled={isLoading}
      />

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Organize By</label>
          <select
            value={organizeBy}
            onChange={(e) => setOrganizeBy(e.target.value as typeof organizeBy)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ext">File Extension</option>
            <option value="date">Date (YYYY-MM-DD)</option>
            <option value="month">Month (YYYY-MM)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Exclude Patterns</label>
          <input
            type="text"
            value={excludePatterns}
            onChange={(e) => setExcludePatterns(e.target.value)}
            placeholder="node_modules,.git,*.tmp"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={recursive}
            onChange={(e) => setRecursive(e.target.checked)}
            className="rounded"
          />
          <span>Recursive</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={removeEmpty}
            onChange={(e) => setRemoveEmpty(e.target.checked)}
            className="rounded"
          />
          <span>Remove Empty Folders</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePreview}
          disabled={!path.trim() || isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          Preview
        </button>
        <button
          onClick={handleApply}
          disabled={!preview?.length || isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Apply Changes
        </button>
      </div>

      {/* Messages */}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

      {/* Preview Table */}
      {preview && preview.length > 0 && <ActionPreviewTable actions={preview} />}
    </div>
  );
}
