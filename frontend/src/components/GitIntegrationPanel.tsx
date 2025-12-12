"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { CollapsibleCard } from "@/components/ui";

interface GitStatus {
  is_git_repo: boolean;
  is_dirty?: boolean;
  untracked_files?: string[];
  branch?: string;
  message?: string;
}

export function GitIntegrationPanel() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getGitStatus();
      setStatus(data as GitStatus);
    } catch (error) {
      // Silently fail if backend is not available or git not configured
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load git status:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert("Please enter a commit message");
      return;
    }

    setCommitting(true);
    try {
      await api.commitSession(commitMessage);
      setCommitMessage("");
      await loadStatus();
      alert("Session committed successfully!");
    } catch (error: any) {
      console.error("Failed to commit:", error);
      alert(`Failed to commit: ${error.message || "Unknown error"}`);
    } finally {
      setCommitting(false);
    }
  };

  if (loading) {
    return (
      <CollapsibleCard title="Git Integration">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </CollapsibleCard>
    );
  }

  if (!status || !status.is_git_repo) {
    return (
      <CollapsibleCard title="Git Integration">
        <p className="text-sm text-muted-foreground">
          {status?.message || "Not a git repository"}
        </p>
      </CollapsibleCard>
    );
  }

  return (
    <CollapsibleCard
      title="Git Integration"
      rightContent={
        <button
          onClick={(e) => { e.stopPropagation(); loadStatus(); }}
          className="px-2 py-1 text-xs rounded-md border border-border bg-background hover:bg-accent transition-colors"
        >
          Refresh
        </button>
      }
    >
      <div className="space-y-2 mb-3">
        <div className="text-xs">
          <span className="text-muted-foreground">Branch: </span>
          <span className="text-foreground font-medium">{status.branch || "N/A"}</span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Status: </span>
          <span className={status.is_dirty ? "text-yellow-500" : "text-green-500"}>
            {status.is_dirty ? "Dirty" : "Clean"}
          </span>
        </div>
        {status.untracked_files && status.untracked_files.length > 0 && (
          <div className="text-xs">
            <span className="text-muted-foreground">Untracked: </span>
            <span className="text-foreground">{status.untracked_files.length} files</span>
          </div>
        )}
      </div>

      {status.is_dirty && (
        <div className="space-y-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommit();
              }
            }}
          />
          <button
            onClick={handleCommit}
            disabled={committing || !commitMessage.trim()}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
          >
            {committing ? "Committing..." : "Commit Session"}
          </button>
        </div>
      )}
    </CollapsibleCard>
  );
}

