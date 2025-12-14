"use client";

import { useState, useRef, useCallback } from "react";
import { api, DupeGroup } from "@/lib/api";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import { ProgressIndicator } from "./ProgressIndicator";
import { FolderPicker } from "./FolderPicker";
import { Search, Trash2, Archive, Loader2, StopCircle, Copy, CheckCircle } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

export function DupesPanel() {
  const [path, setPath] = useState("");
  const [hashAlgo, setHashAlgo] = useState("sha256");
  const [recursive, setRecursive] = useState(true);
  const [excludePatterns, setExcludePatterns] = useState("node_modules,.git");

  const [groups, setGroups] = useState<DupeGroup[] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [totalWasted, setTotalWasted] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const [ConfirmModalComponent, confirm] = useConfirmModal();

  const handleStartScan = useCallback(() => {
    if (!path.trim()) {
      setError("Please enter a folder path");
      return;
    }

    setIsScanning(true);
    setError(null);
    setSuccessMessage(null);
    setGroups(null);
    setProgress({ current: 0, total: 0, phase: "scanning", message: "Scanning files..." });

    const url = api.getFilemanDupesStreamUrl({
      path: path.trim(),
      hash_algo: hashAlgo,
      recursive,
      exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
    });

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          setProgress({
            current: data.current || 0,
            total: data.total || 0,
            phase: data.phase || "processing",
            message: data.message || "",
          });
        } else if (data.type === "complete") {
          setGroups(data.groups || []);
          setTotalWasted(data.total_wasted_bytes || 0);
          setIsScanning(false);
          eventSource.close();
        } else if (data.type === "error") {
          setError(data.message || "Unknown error");
          setIsScanning(false);
          eventSource.close();
        }
      } catch (e) {
        console.error("Failed to parse SSE event:", e);
      }
    };

    eventSource.onerror = () => {
      setError("Connection lost");
      setIsScanning(false);
      eventSource.close();
    };
  }, [path, hashAlgo, recursive, excludePatterns]);

  const handleStop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleAction = useCallback(
    async (action: "trash" | "delete") => {
      if (!groups?.length) return;

      const totalDupes = groups.reduce((sum, g) => sum + g.duplicates.length, 0);
      const actionWord = action === "trash" ? "move to Recycle Bin" : "permanently delete";

      const confirmed = await confirm({
        title: action === "delete" ? "Permanently Delete Duplicates?" : "Remove Duplicates?",
        message: `This will ${actionWord} ${totalDupes} duplicate file${totalDupes !== 1 ? "s" : ""}, keeping the first copy of each. ${action === "delete" ? "This cannot be undone!" : ""}`,
        confirmText: action === "delete" ? "Delete Forever" : "Move to Trash",
        cancelText: "Cancel",
        danger: true,
      });

      if (!confirmed) return;

      setIsProcessing(true);
      setError(null);

      try {
        const result = await api.filemanDupes({
          path: path.trim(),
          hash_algo: hashAlgo,
          action,
          recursive,
          exclude: excludePatterns.split(",").map((p) => p.trim()).filter(Boolean),
          apply: true,
        });

        setGroups(null);
        const actionedCount = result.groups.reduce((sum, g) => sum + g.duplicates.length, 0);
        setSuccessMessage(`Successfully ${action === "trash" ? "trashed" : "deleted"} ${actionedCount} duplicate files`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process duplicates");
      } finally {
        setIsProcessing(false);
      }
    },
    [groups, path, hashAlgo, recursive, excludePatterns, confirm]
  );

  return (
    <div className="space-y-4">
      {ConfirmModalComponent}

      {/* Path Input */}
      <FolderPicker
        value={path}
        onChange={setPath}
        placeholder="C:\Users\...\Photos"
        disabled={isScanning || isProcessing}
      />

      {/* Options */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hash Algorithm</label>
          <select
            value={hashAlgo}
            onChange={(e) => setHashAlgo(e.target.value)}
            disabled={isScanning || isProcessing}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="sha256">SHA-256 (Recommended)</option>
            <option value="md5">MD5 (Faster)</option>
            <option value="sha1">SHA-1</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={recursive}
            onChange={(e) => setRecursive(e.target.checked)}
            disabled={isScanning || isProcessing}
            className="rounded"
          />
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
          disabled={isScanning || isProcessing}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isScanning ? (
          <button
            onClick={handleStartScan}
            disabled={!path.trim() || isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Search size={14} />
            Find Duplicates
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
          >
            <StopCircle size={14} />
            Stop
          </button>
        )}
        {groups && groups.length > 0 && (
          <>
            <button
              onClick={() => handleAction("trash")}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-yellow-600 text-white hover:bg-yellow-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Trash Duplicates
            </button>
            <button
              onClick={() => handleAction("delete")}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete Forever
            </button>
          </>
        )}
      </div>

      {/* Progress */}
      {isScanning && (
        <ProgressIndicator
          phase={progress.phase}
          current={progress.current}
          total={progress.total}
          message={progress.message}
        />
      )}

      {/* Messages */}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

      {/* Results Summary */}
      {groups && (
        <div className="bg-muted/30 rounded-md p-3 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Copy size={16} className="text-purple-500" />
            <span className="font-medium">
              {groups.length} duplicate group{groups.length !== 1 ? "s" : ""} found
            </span>
          </div>
          <div className="text-muted-foreground">
            {groups.reduce((sum, g) => sum + g.duplicates.length, 0)} duplicate files |{" "}
            {formatBytes(totalWasted)} wasted space
          </div>
        </div>
      )}

      {/* Duplicate Groups */}
      {groups && groups.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="border border-border rounded overflow-hidden">
              <div className="bg-muted px-3 py-2 text-xs flex justify-between items-center">
                <span className="font-medium">
                  {group.count} copies ({formatBytes(group.size_bytes)} each)
                </span>
                <span className="text-muted-foreground font-mono" title={group.hash}>
                  {group.hash.slice(0, 12)}...
                </span>
              </div>
              <div className="divide-y divide-border/50">
                {/* Keep file */}
                <div className="px-3 py-2 text-xs flex items-center gap-2 bg-green-500/10">
                  <CheckCircle size={12} className="text-green-500 shrink-0" />
                  <span className="font-medium truncate" title={group.keep}>
                    {getFileName(group.keep)}
                  </span>
                  <span className="text-muted-foreground ml-auto shrink-0">(Keep)</span>
                </div>
                {/* Duplicates */}
                {group.duplicates.map((dup, dIdx) => (
                  <div key={dIdx} className="px-3 py-2 text-xs flex items-center gap-2">
                    <Copy size={12} className="text-muted-foreground shrink-0" />
                    <span className="truncate text-muted-foreground" title={dup}>
                      {getFileName(dup)}
                    </span>
                    <span className="text-red-500 ml-auto shrink-0">(Duplicate)</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No duplicates message */}
      {groups && groups.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
          <p>No duplicate files found!</p>
        </div>
      )}
    </div>
  );
}
