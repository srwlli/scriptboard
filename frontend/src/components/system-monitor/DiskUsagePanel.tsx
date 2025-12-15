"use client";

import { useState, useEffect, useCallback } from "react";
import {
  api,
  DiskPartition,
  FolderSize,
  DiskUsageResponse,
  LargestFoldersResponse,
} from "@/lib/api";
import {
  RefreshCw,
  HardDrive,
  Folder,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export interface DiskUsagePanelProps {
  className?: string;
}

/**
 * Disk usage analyzer panel showing drive usage and largest folders.
 * Features:
 * - Drive partition overview with usage bars
 * - Largest folders scan (expensive, manual trigger)
 * - Folder navigation
 */
export function DiskUsagePanel({ className = "" }: DiskUsagePanelProps) {
  // Data state
  const [partitions, setPartitions] = useState<DiskPartition[]>([]);
  const [folders, setFolders] = useState<FolderSize[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningFolders, setIsScanningFolders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [scanPath, setScanPath] = useState("C:\\Users");
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null);

  // Fetch disk partitions
  const fetchPartitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data: DiskUsageResponse = await api.getDiskUsage();
      setPartitions(data.partitions);
      if (data.partitions.length > 0 && !selectedDrive) {
        setSelectedDrive(data.partitions[0].mountpoint);
        setScanPath(data.partitions[0].mountpoint);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch disk usage");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDrive]);

  // Scan for largest folders
  const scanFolders = useCallback(async () => {
    setIsScanningFolders(true);
    setError(null);

    try {
      const data: LargestFoldersResponse = await api.getLargestFolders({
        path: scanPath,
        depth: 2,
        limit: 15,
      });
      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan folders");
    } finally {
      setIsScanningFolders(false);
    }
  }, [scanPath]);

  // Initial fetch
  useEffect(() => {
    fetchPartitions();
  }, [fetchPartitions]);

  const getUsageColor = (percent: number): string => {
    if (percent > 90) return "bg-red-500";
    if (percent > 75) return "bg-orange-500";
    if (percent > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatSize = (gb: number): string => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">Disk Usage</span>
        </div>
        <button
          onClick={fetchPartitions}
          disabled={isLoading}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 rounded hover:bg-muted"
          title="Refresh"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      {/* Partitions overview */}
      <div className="space-y-2 mb-4">
        {partitions.map((partition) => (
          <div
            key={partition.mountpoint}
            className={`p-2 rounded-md border cursor-pointer transition-colors ${
              selectedDrive === partition.mountpoint
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            }`}
            onClick={() => {
              setSelectedDrive(partition.mountpoint);
              setScanPath(partition.mountpoint);
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <HardDrive size={12} />
                <span className="text-sm font-medium">{partition.mountpoint}</span>
                <span className="text-xs text-muted-foreground">({partition.fstype})</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatSize(partition.free_gb)} free
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getUsageColor(partition.percent)} transition-all`}
                  style={{ width: `${partition.percent}%` }}
                />
              </div>
              <span className="text-xs font-mono w-12 text-right">
                {partition.percent.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>{formatSize(partition.used_gb)} used</span>
              <span>{formatSize(partition.total_gb)} total</span>
            </div>
          </div>
        ))}
      </div>

      {/* Folder scan section */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Largest Folders</span>
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-yellow-500" />
            <span className="text-[10px] text-muted-foreground">Scan may take time</span>
          </div>
        </div>

        {/* Scan controls */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            placeholder="Path to scan..."
            className="flex-1 px-2 py-1.5 text-sm border border-border rounded-md bg-background"
          />
          <button
            onClick={scanFolders}
            disabled={isScanningFolders}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isScanningFolders ? "Scanning..." : "Scan"}
          </button>
        </div>

        {/* Folder results */}
        {folders.length > 0 && (
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {folders.map((folder, idx) => (
              <div
                key={folder.path}
                className="flex items-center gap-2 p-1.5 text-xs hover:bg-muted/50 rounded cursor-pointer"
                onClick={() => setScanPath(folder.path)}
                title={folder.path}
              >
                <Folder size={12} className="text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{folder.name}</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${Math.min(100, (folder.size_bytes / folders[0].size_bytes) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-muted-foreground">
                    {folder.size_gb >= 1
                      ? `${folder.size_gb.toFixed(1)} GB`
                      : `${folder.size_mb.toFixed(0)} MB`}
                  </span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {folders.length === 0 && !isScanningFolders && (
          <div className="text-center text-muted-foreground text-xs py-4">
            Click Scan to analyze folder sizes
          </div>
        )}
      </div>
    </div>
  );
}
