"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, Check, AlertCircle } from "lucide-react";

// Current app version - should match shell/package.json
const CURRENT_VERSION = "0.2.2";

// GitHub releases API URL
const RELEASES_URL = "https://api.github.com/repos/srwlli/scriptboard/releases/latest";
const DOWNLOAD_URL = "https://github.com/srwlli/scriptboard/releases/latest";

type UpdateStatus = "idle" | "checking" | "up-to-date" | "update-available" | "error";

interface ReleaseInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
}

/**
 * UpdateChecker - Manual update check component for Settings page.
 *
 * Checks GitHub releases for newer versions and displays download link.
 */
export function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = async () => {
    setStatus("checking");
    setError(null);
    setReleaseInfo(null);

    try {
      const response = await fetch(RELEASES_URL);

      if (!response.ok) {
        throw new Error("Failed to check for updates");
      }

      const data = await response.json();
      const latestVersion = data.tag_name?.replace(/^v/, "") || data.name;

      if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
        setReleaseInfo({
          version: latestVersion,
          releaseNotes: data.body || "No release notes available",
          downloadUrl: data.html_url || DOWNLOAD_URL,
        });
        setStatus("update-available");
      } else {
        setStatus("up-to-date");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check for updates");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Version</p>
          <p className="text-sm text-muted-foreground">
            Current: v{CURRENT_VERSION}
          </p>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={status === "checking"}
          className="px-4 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={14} className={status === "checking" ? "animate-spin" : ""} />
          {status === "checking" ? "Checking..." : "Check for Updates"}
        </button>
      </div>

      {/* Status messages */}
      {status === "up-to-date" && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check size={14} />
          You're running the latest version
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {status === "update-available" && releaseInfo && (
        <div className="p-3 rounded-md border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              v{releaseInfo.version} available
            </span>
            <a
              href={releaseInfo.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              Download
              <ExternalLink size={12} />
            </a>
          </div>
          {releaseInfo.releaseNotes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {releaseInfo.releaseNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compare semantic versions. Returns true if latest > current.
 */
function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = latest.split(".").map(Number);
  const currentParts = current.split(".").map(Number);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}
