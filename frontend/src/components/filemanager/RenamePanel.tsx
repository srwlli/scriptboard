"use client";

import { useState } from "react";
import { api, FileAction } from "@/lib/api";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import { ActionPreviewTable } from "./ActionPreviewTable";
import { FolderPicker } from "./FolderPicker";
import { Eye, Play, Loader2 } from "lucide-react";

export function RenamePanel() {
  const [path, setPath] = useState("");
  const [pattern, setPattern] = useState("");
  const [replace, setReplace] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [lower, setLower] = useState(false);
  const [upper, setUpper] = useState(false);
  const [sanitize, setSanitize] = useState(false);
  const [enumerateFiles, setEnumerateFiles] = useState(false);
  const [start, setStart] = useState(1);
  const [width, setWidth] = useState(3);
  const [extFilter, setExtFilter] = useState("");
  const [recursive, setRecursive] = useState(true);
  const [excludePatterns, setExcludePatterns] = useState("node_modules,.git");

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
      const result = await api.filemanRename({
        path: path.trim(),
        pattern: pattern || undefined,
        replace,
        prefix,
        suffix,
        lower,
        upper,
        sanitize,
        enumerate_files: enumerateFiles,
        start,
        width,
        ext_filter: extFilter || undefined,
        recursive,
        exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
        apply: false,
      });
      setPreview(result.actions);
      if (result.actions.length === 0) {
        setSuccessMessage("No files would be renamed with current settings");
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
      title: "Apply Rename?",
      message: `This will rename ${preview.length} file${preview.length !== 1 ? "s" : ""}. Continue?`,
      confirmText: "Rename",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.filemanRename({
        path: path.trim(),
        pattern: pattern || undefined,
        replace,
        prefix,
        suffix,
        lower,
        upper,
        sanitize,
        enumerate_files: enumerateFiles,
        start,
        width,
        ext_filter: extFilter || undefined,
        recursive,
        exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
        apply: true,
      });
      setPreview(null);
      setSuccessMessage(`Successfully renamed ${result.actions.length} files`);
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
        placeholder="C:\Users\...\Photos"
        disabled={isLoading}
      />

      {/* Pattern and Replace */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pattern (Regex)</label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="IMG_\d+"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Replace With</label>
          <input
            type="text"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="photo"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Prefix, Suffix, Extension Filter */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="vacation_"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Suffix</label>
          <input
            type="text"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            placeholder="_2024"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Extension Filter</label>
          <input
            type="text"
            value={extFilter}
            onChange={(e) => setExtFilter(e.target.value)}
            placeholder="jpg"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Enumeration */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enumerate"
            checked={enumerateFiles}
            onChange={(e) => setEnumerateFiles(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="enumerate" className="text-sm cursor-pointer">
            Add Numbers
          </label>
        </div>
        {enumerateFiles && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Start</label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(parseInt(e.target.value) || 1)}
                min={0}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 3)}
                min={1}
                max={6}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lower} onChange={(e) => { setLower(e.target.checked); if (e.target.checked) setUpper(false); }} className="rounded" />
          <span>Lowercase</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={upper} onChange={(e) => { setUpper(e.target.checked); if (e.target.checked) setLower(false); }} className="rounded" />
          <span>Uppercase</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={sanitize} onChange={(e) => setSanitize(e.target.checked)} className="rounded" />
          <span>Sanitize</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={recursive} onChange={(e) => setRecursive(e.target.checked)} className="rounded" />
          <span>Recursive</span>
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Apply Rename
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
