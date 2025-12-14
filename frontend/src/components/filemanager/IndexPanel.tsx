"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { ProgressIndicator } from "./ProgressIndicator";
import { FolderPicker } from "./FolderPicker";
import { FileSearch, Download, Loader2, StopCircle } from "lucide-react";

interface FileInfo {
  path: string;
  name: string;
  size_bytes: number;
  mtime_epoch: number;
  [key: string]: unknown;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(epoch: number): string {
  return new Date(epoch * 1000).toLocaleDateString();
}

export function IndexPanel() {
  const [path, setPath] = useState("");
  const [includeHash, setIncludeHash] = useState(false);
  const [hashAlgo, setHashAlgo] = useState("sha256");
  const [recursive, setRecursive] = useState(true);
  const [excludePatterns, setExcludePatterns] = useState("node_modules,.git");

  const [files, setFiles] = useState<FileInfo[] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "", currentFile: "" });
  const [error, setError] = useState<string | null>(null);
  const [totalBytes, setTotalBytes] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleStartScan = useCallback(() => {
    if (!path.trim()) {
      setError("Please enter a folder path");
      return;
    }

    setIsScanning(true);
    setError(null);
    setFiles(null);
    setProgress({ current: 0, total: 0, phase: "scanning", currentFile: "" });

    const url = api.getFilemanIndexStreamUrl({
      path: path.trim(),
      include_hash: includeHash,
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
            currentFile: data.current_file || "",
          });
        } else if (data.type === "complete") {
          setFiles(data.files || []);
          setTotalBytes(data.total_bytes || 0);
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
  }, [path, includeHash, hashAlgo, recursive, excludePatterns]);

  const handleStop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!files?.length) return;

    const headers = ["Name", "Path", "Size (Bytes)", "Modified", ...(includeHash ? [hashAlgo.toUpperCase()] : [])];
    const rows = files.map((f) => [
      f.name,
      f.path,
      f.size_bytes.toString(),
      formatDate(f.mtime_epoch),
      ...(includeHash ? [String(f[hashAlgo] || "")] : []),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `file_index_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [files, includeHash, hashAlgo]);

  return (
    <div className="space-y-4">
      {/* Path Input */}
      <FolderPicker
        value={path}
        onChange={setPath}
        placeholder="C:\Users\...\Documents"
        disabled={isScanning}
      />

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeHash}
              onChange={(e) => setIncludeHash(e.target.checked)}
              disabled={isScanning}
              className="rounded"
            />
            <span>Include Hash</span>
          </label>
          {includeHash && (
            <select
              value={hashAlgo}
              onChange={(e) => setHashAlgo(e.target.value)}
              disabled={isScanning}
              className="px-2 py-1 text-sm border border-border rounded-md bg-background"
            >
              <option value="sha256">SHA-256</option>
              <option value="md5">MD5</option>
              <option value="sha1">SHA-1</option>
            </select>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={recursive}
            onChange={(e) => setRecursive(e.target.checked)}
            disabled={isScanning}
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
          disabled={isScanning}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isScanning ? (
          <button
            onClick={handleStartScan}
            disabled={!path.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileSearch size={14} />
            Scan Files
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
        {files && files.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* Progress */}
      {isScanning && (
        <ProgressIndicator
          phase={progress.phase}
          current={progress.current}
          total={progress.total}
          currentFile={progress.currentFile}
        />
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Results */}
      {files && (
        <div className="border border-border rounded overflow-hidden">
          <div className="bg-muted px-3 py-2 text-sm font-medium border-b border-border">
            {files.length} files indexed ({formatBytes(totalBytes)})
          </div>
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted border-b border-border">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-right p-2">Size</th>
                  <th className="text-left p-2">Modified</th>
                  {includeHash && <th className="text-left p-2">{hashAlgo.toUpperCase()}</th>}
                </tr>
              </thead>
              <tbody>
                {files.map((file, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-2">
                      <span className="truncate block max-w-[200px]" title={file.path}>
                        {file.name}
                      </span>
                    </td>
                    <td className="p-2 text-right text-muted-foreground">
                      {formatBytes(file.size_bytes)}
                    </td>
                    <td className="p-2 text-muted-foreground">{formatDate(file.mtime_epoch)}</td>
                    {includeHash && (
                      <td className="p-2 font-mono text-muted-foreground">
                        <span className="truncate block max-w-[100px]" title={String(file[hashAlgo] || "")}>
                          {String(file[hashAlgo] || "—").slice(0, 8)}...
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
