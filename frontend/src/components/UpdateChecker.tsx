"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Download, Check, AlertCircle, Loader2 } from "lucide-react";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

interface UpdateInfo {
  version?: string;
  percent?: number;
  error?: string;
}

/**
 * UpdateChecker - Native Electron auto-updater component.
 * Uses electron-updater via IPC for in-app updates.
 */
export function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [info, setInfo] = useState<UpdateInfo>({});
  const [currentVersion, setCurrentVersion] = useState<string>("...");

  // Get current version on mount
  useEffect(() => {
    const electronAPI = (window as any)?.electronAPI;
    if (electronAPI?.getAppVersion) {
      electronAPI.getAppVersion().then((result: { version: string }) => {
        setCurrentVersion(result.version);
      });
    }

    // Listen for update status from main process
    if (electronAPI?.onUpdateStatus) {
      electronAPI.onUpdateStatus((data: any) => {
        setStatus(data.status);
        setInfo({
          version: data.version,
          percent: data.percent,
          error: data.error,
        });
      });
    }

    return () => {
      if (electronAPI?.removeUpdateStatusListener) {
        electronAPI.removeUpdateStatusListener();
      }
    };
  }, []);

  const checkForUpdates = async () => {
    const electronAPI = (window as any)?.electronAPI;
    if (!electronAPI?.checkForUpdates) {
      setStatus("error");
      setInfo({ error: "Updates not available in browser" });
      return;
    }

    setStatus("checking");
    setInfo({});

    const result = await electronAPI.checkForUpdates();
    if (result.error) {
      setStatus("error");
      setInfo({ error: result.error });
    }
    // Status will be updated via onUpdateStatus listener
  };

  const downloadUpdate = async () => {
    const electronAPI = (window as any)?.electronAPI;
    if (!electronAPI?.downloadUpdate) return;

    const result = await electronAPI.downloadUpdate();
    if (result.error) {
      setStatus("error");
      setInfo({ error: result.error });
    }
  };

  const installUpdate = async () => {
    const electronAPI = (window as any)?.electronAPI;
    if (!electronAPI?.installUpdate) return;

    await electronAPI.installUpdate();
    // App will restart automatically
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Version</p>
          <p className="text-sm text-muted-foreground">
            Current: v{currentVersion}
          </p>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={status === "checking" || status === "downloading"}
          className="px-4 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={14} className={status === "checking" ? "animate-spin" : ""} />
          {status === "checking" ? "Checking..." : "Check for Updates"}
        </button>
      </div>

      {/* Up to date */}
      {status === "not-available" && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check size={14} />
          You're running the latest version
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          {info.error || "Failed to check for updates"}
        </div>
      )}

      {/* Update available */}
      {status === "available" && (
        <div className="p-3 rounded-md border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              v{info.version} available
            </span>
            <button
              onClick={downloadUpdate}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Download size={12} />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Downloading */}
      {status === "downloading" && (
        <div className="p-3 rounded-md border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-sm text-foreground">
              Downloading... {info.percent?.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${info.percent || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Downloaded - ready to install */}
      {status === "downloaded" && (
        <div className="p-3 rounded-md border border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              v{info.version} ready to install
            </span>
            <button
              onClick={installUpdate}
              className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Check size={12} />
              Install & Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
