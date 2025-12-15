"use client";

import { useState, useEffect, useCallback } from "react";
import { api, GitStatus, GitBranch, GitBranchesResponse } from "@/lib/api";
import { CollapsibleCard } from "@/components/ui";
import { FolderPicker } from "./filemanager/FolderPicker";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import {
  RefreshCw,
  GitBranch as GitBranchIcon,
  GitPullRequest,
  Upload,
  Download,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FolderGit,
  ChevronDown,
} from "lucide-react";

const STORAGE_KEY = "scriptboard_git_repo_path";

/**
 * Enhanced Git Integration Panel with user-selectable repositories
 * and expanded git operations (branches, pull/push).
 *
 * @see coderef/docs/GITINTEGRATION-GUIDE.md - Complete user guide
 */
export function GitIntegrationPanel() {
  // Repo selection
  const [repoPath, setRepoPath] = useState<string>("");

  // Status
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Branches
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  // Operations
  const [commitMessage, setCommitMessage] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [showNewBranchInput, setShowNewBranchInput] = useState(false);
  const [operating, setOperating] = useState<string | null>(null);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  // Load saved repo path on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRepoPath(saved);
    }
  }, []);

  // Load status when repoPath changes
  useEffect(() => {
    if (repoPath) {
      localStorage.setItem(STORAGE_KEY, repoPath);
      loadStatus();
      loadBranches();
    }
  }, [repoPath]);

  const loadStatus = useCallback(async () => {
    if (!repoPath) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.getGitStatus(repoPath) as GitStatus;
      setStatus(data);
      if (!data.is_git_repo) {
        setError(data.message || "Not a git repository");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [repoPath]);

  const loadBranches = useCallback(async () => {
    if (!repoPath) return;

    try {
      const data = await api.getGitBranches(repoPath) as GitBranchesResponse;
      setBranches(data.branches);
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  }, [repoPath]);

  const handleCheckout = async (branchName: string) => {
    setOperating("checkout");
    setShowBranchDropdown(false);

    try {
      await api.gitCheckout(branchName, repoPath);
      await loadStatus();
      await loadBranches();
    } catch (err: any) {
      setError(err.message || "Checkout failed");
    } finally {
      setOperating(null);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;

    setOperating("create-branch");

    try {
      await api.createGitBranch(newBranchName.trim(), { path: repoPath, checkout: true });
      setNewBranchName("");
      setShowNewBranchInput(false);
      await loadStatus();
      await loadBranches();
    } catch (err: any) {
      setError(err.message || "Failed to create branch");
    } finally {
      setOperating(null);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    const confirmed = await confirm({
      title: "Delete Branch?",
      message: `Are you sure you want to delete branch "${branchName}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    setOperating("delete-branch");

    try {
      await api.deleteGitBranch(branchName, { path: repoPath });
      await loadBranches();
    } catch (err: any) {
      setError(err.message || "Failed to delete branch");
    } finally {
      setOperating(null);
    }
  };

  const handlePull = async () => {
    setOperating("pull");
    setError(null);

    try {
      await api.gitPull(repoPath);
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Pull failed");
    } finally {
      setOperating(null);
    }
  };

  const handlePush = async () => {
    setOperating("push");
    setError(null);

    try {
      await api.gitPush({ path: repoPath });
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Push failed");
    } finally {
      setOperating(null);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError("Please enter a commit message");
      return;
    }

    setOperating("commit");
    setError(null);

    try {
      await api.commitSession(commitMessage.trim(), { path: repoPath, addAll: true });
      setCommitMessage("");
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Commit failed");
    } finally {
      setOperating(null);
    }
  };

  const localBranches = branches.filter((b) => !b.is_remote);
  const currentBranch = status?.branch || branches.find((b) => b.is_current)?.name;

  return (
    <CollapsibleCard
      title="Git Integration"
      rightContent={
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadStatus();
            loadBranches();
          }}
          disabled={loading || !repoPath}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      }
    >
      {ConfirmModalComponent}

      <div className="space-y-3">
        {/* Repo Selector */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Repository</label>
          <FolderPicker
            value={repoPath}
            onChange={setRepoPath}
            placeholder="Select a git repository..."
            disabled={!!operating}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 px-2 py-1.5 rounded">
            <AlertCircle size={12} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-400">×</button>
          </div>
        )}

        {/* Status Display */}
        {repoPath && status?.is_git_repo && (
          <>
            {/* Branch & Status Row */}
            <div className="flex items-center gap-3 text-xs">
              {/* Branch Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                  disabled={!!operating}
                >
                  <GitBranchIcon size={12} />
                  <span className="font-medium">{currentBranch || "No branch"}</span>
                  <ChevronDown size={12} />
                </button>

                {showBranchDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {/* New Branch Button */}
                    <button
                      onClick={() => {
                        setShowNewBranchInput(true);
                        setShowBranchDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-primary"
                    >
                      <Plus size={12} />
                      New Branch
                    </button>
                    <div className="border-t border-border" />

                    {/* Local Branches */}
                    {localBranches.map((branch) => (
                      <div
                        key={branch.name}
                        className="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted group"
                      >
                        <button
                          onClick={() => handleCheckout(branch.name)}
                          className="flex items-center gap-2 flex-1 text-left"
                          disabled={branch.is_current}
                        >
                          {branch.is_current && <Check size={12} className="text-green-500" />}
                          <span className={branch.is_current ? "font-medium" : ""}>{branch.name}</span>
                        </button>
                        {!branch.is_current && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBranch(branch.name);
                              setShowBranchDropdown(false);
                            }}
                            className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete branch"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  status.is_dirty
                    ? "bg-yellow-500/20 text-yellow-600"
                    : "bg-green-500/20 text-green-600"
                }`}
              >
                {status.is_dirty ? "Modified" : "Clean"}
              </span>

              {status.untracked_files && status.untracked_files.length > 0 && (
                <span className="text-muted-foreground">
                  +{status.untracked_files.length} untracked
                </span>
              )}
            </div>

            {/* New Branch Input */}
            {showNewBranchInput && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Branch name..."
                  className="flex-1 px-2 py-1.5 text-sm border border-border rounded bg-background"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateBranch();
                    if (e.key === "Escape") {
                      setShowNewBranchInput(false);
                      setNewBranchName("");
                    }
                  }}
                />
                <button
                  onClick={handleCreateBranch}
                  disabled={!newBranchName.trim() || !!operating}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewBranchInput(false);
                    setNewBranchName("");
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePull}
                disabled={!!operating}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors disabled:opacity-50"
                title="Pull from remote"
              >
                <Download size={12} />
                {operating === "pull" ? "Pulling..." : "Pull"}
              </button>
              <button
                onClick={handlePush}
                disabled={!!operating}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors disabled:opacity-50"
                title="Push to remote"
              >
                <Upload size={12} />
                {operating === "push" ? "Pushing..." : "Push"}
              </button>
            </div>

            {/* Commit Section */}
            {status.is_dirty && (
              <div className="space-y-2 pt-2 border-t border-border">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCommit();
                    }
                  }}
                />
                <button
                  onClick={handleCommit}
                  disabled={!commitMessage.trim() || !!operating}
                  className="w-full px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {operating === "commit" ? "Committing..." : "Commit All Changes"}
                </button>
              </div>
            )}
          </>
        )}

        {/* No Repo Selected */}
        {!repoPath && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
            <FolderGit size={14} />
            <span>Select a repository to get started</span>
          </div>
        )}

        {/* Loading State */}
        {repoPath && loading && !status && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
            <RefreshCw size={14} className="animate-spin" />
            <span>Loading repository...</span>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
