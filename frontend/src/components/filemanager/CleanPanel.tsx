"use client";

import { useState } from "react";
import { api, FileAction } from "@/lib/api";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import { ActionPreviewTable } from "./ActionPreviewTable";
import { FolderPicker } from "./FolderPicker";
import { Eye, Play, Loader2, Trash2, Archive } from "lucide-react";

export function CleanPanel() {
  const [path, setPath] = useState("");
  const [olderThanDays, setOlderThanDays] = useState<number | undefined>(30);
  const [largerThanMb, setLargerThanMb] = useState<number | undefined>(undefined);
  const [useTrash, setUseTrash] = useState(true);
  const [archiveDir, setArchiveDir] = useState("");
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [recursive, setRecursive] = useState(true);
  const [excludePatterns, setExcludePatterns] = useState("node_modules,.git");

  const [preview, setPreview] = useState<FileAction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  const mode = archiveDir.trim() ? "archive" : useTrash ? "trash" : "delete";

  const handlePreview = async () => {
    if (!path.trim()) {
      setError("Please enter a folder path");
      return;
    }

    if (!olderThanDays && !largerThanMb) {
      setError("Please specify at least one filter (older than or larger than)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await api.filemanClean({
        path: path.trim(),
        older_than_days: olderThanDays,
        larger_than_mb: largerThanMb,
        archive_dir: archiveDir.trim() || undefined,
        use_trash: useTrash && !archiveDir.trim(),
        delete_permanently: !useTrash && !archiveDir.trim(),
        remove_empty: removeEmpty,
        recursive,
        exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
        apply: false,
      });
      setPreview(result.actions);
      if (result.actions.length === 0) {
        setSuccessMessage("No files match the specified criteria");
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

    const actionWord = mode === "archive" ? "archive" : mode === "trash" ? "move to Recycle Bin" : "permanently delete";

    const confirmed = await confirm({
      title: mode === "delete" ? "Permanently Delete?" : "Clean Files?",
      message: `This will ${actionWord} ${preview.length} file${preview.length !== 1 ? "s" : ""}. ${mode === "delete" ? "This cannot be undone!" : "Continue?"}`,
      confirmText: mode === "delete" ? "Delete Forever" : "Clean",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.filemanClean({
        path: path.trim(),
        older_than_days: olderThanDays,
        larger_than_mb: largerThanMb,
        archive_dir: archiveDir.trim() || undefined,
        use_trash: useTrash && !archiveDir.trim(),
        delete_permanently: !useTrash && !archiveDir.trim(),
        remove_empty: removeEmpty,
        recursive,
        exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
        apply: true,
      });
      setPreview(null);
      setSuccessMessage(`Successfully cleaned ${result.actions.length} files`);
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
        placeholder="C:\Users\...\Temp"
        disabled={isLoading}
      />

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Older Than (Days)</label>
          <input
            type="number"
            value={olderThanDays ?? ""}
            onChange={(e) => setOlderThanDays(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="30"
            min={1}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Larger Than (MB)</label>
          <input
            type="number"
            value={largerThanMb ?? ""}
            onChange={(e) => setLargerThanMb(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="100"
            min={1}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Archive Directory */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Archive To (optional - overrides delete)
        </label>
        <input
          type="text"
          value={archiveDir}
          onChange={(e) => setArchiveDir(e.target.value)}
          placeholder="C:\Archive"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Delete Mode Toggle */}
      {!archiveDir.trim() && (
        <div className="flex gap-4 p-3 bg-muted/30 rounded-md">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={useTrash}
              onChange={() => setUseTrash(true)}
              className="rounded"
            />
            <Trash2 size={14} className="text-yellow-500" />
            <span>Move to Recycle Bin (Safe)</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={!useTrash}
              onChange={() => setUseTrash(false)}
              className="rounded"
            />
            <Trash2 size={14} className="text-red-500" />
            <span>Delete Permanently</span>
          </label>
        </div>
      )}

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={recursive} onChange={(e) => setRecursive(e.target.checked)} className="rounded" />
          <span>Recursive</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={removeEmpty} onChange={(e) => setRemoveEmpty(e.target.checked)} className="rounded" />
          <span>Remove Empty Folders</span>
        </label>
      </div>

      {/* Exclude */}
      <div>
        <label className="block text-sm font-medium mb-1">Exclude Patterns</label>
        <input
          type="text"
          value={excludePatterns}
          onChange={(e) => setExcludePatterns(e.target.value)}
          placeholder="node_modules,.git"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
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
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            mode === "delete"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : mode === "archive" ? (
            <Archive size={14} />
          ) : (
            <Trash2 size={14} />
          )}
          {mode === "archive" ? "Archive" : mode === "trash" ? "Move to Trash" : "Delete"}
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
