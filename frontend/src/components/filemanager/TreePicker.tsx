"use client";

import { useState, useCallback, useEffect } from "react";
import { TreeNode, TreeItem } from "./TreeNode";
import { FolderOpen } from "lucide-react";

interface TreePickerProps {
  /** Initial root directory to display */
  rootPath?: string;
  /** Called when user selects a file or folder */
  onSelect: (path: string, isDirectory: boolean) => void;
  /** Whether to allow selecting files (default: true) */
  allowFiles?: boolean;
  /** Whether to allow selecting folders (default: true) */
  allowFolders?: boolean;
  /** Max height of the tree container */
  maxHeight?: string;
}

interface TreeState {
  [path: string]: {
    children: TreeItem[];
    isLoading: boolean;
    isExpanded: boolean;
  };
}

/**
 * Tree picker component for browsing and selecting files/folders.
 * Lazy loads directory contents on expand.
 */
export function TreePicker({
  rootPath,
  onSelect,
  allowFiles = true,
  allowFolders = true,
  maxHeight = "300px",
}: TreePickerProps) {
  const [treeState, setTreeState] = useState<TreeState>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [root, setRoot] = useState<string | null>(rootPath || null);

  // Load directory contents
  const loadDirectory = useCallback(async (dirPath: string) => {
    const electronAPI = (window as any)?.electronAPI;
    if (!electronAPI?.listDirectory) {
      console.error("electronAPI.listDirectory not available");
      return [];
    }

    try {
      const result = await electronAPI.listDirectory(dirPath);
      if (result.error) {
        console.error("Failed to list directory:", result.error);
        return [];
      }
      return result.items || [];
    } catch (err) {
      console.error("Error listing directory:", err);
      return [];
    }
  }, []);

  // Initialize root directory
  useEffect(() => {
    if (root && !treeState[root]) {
      setTreeState((prev) => ({
        ...prev,
        [root]: { children: [], isLoading: true, isExpanded: true },
      }));

      loadDirectory(root).then((children) => {
        setTreeState((prev) => ({
          ...prev,
          [root]: { children, isLoading: false, isExpanded: true },
        }));
      });
    }
  }, [root, loadDirectory, treeState]);

  // Select root folder via native dialog
  const handleSelectRoot = async () => {
    const electronAPI = (window as any)?.electronAPI;
    if (!electronAPI?.selectFolder) return;

    const result = await electronAPI.selectFolder();
    if (result?.path) {
      setRoot(result.path);
      setSelectedPath(null);
      setTreeState({});
    }
  };

  // Toggle folder expand/collapse
  const handleToggle = useCallback(
    async (item: TreeItem) => {
      if (!item.isDirectory) return;

      const current = treeState[item.path];

      if (current?.isExpanded) {
        // Collapse
        setTreeState((prev) => ({
          ...prev,
          [item.path]: { ...current, isExpanded: false },
        }));
      } else if (current?.children.length > 0) {
        // Expand (already loaded)
        setTreeState((prev) => ({
          ...prev,
          [item.path]: { ...current, isExpanded: true },
        }));
      } else {
        // Load and expand
        setTreeState((prev) => ({
          ...prev,
          [item.path]: { children: [], isLoading: true, isExpanded: true },
        }));

        const children = await loadDirectory(item.path);
        setTreeState((prev) => ({
          ...prev,
          [item.path]: { children, isLoading: false, isExpanded: true },
        }));
      }
    },
    [treeState, loadDirectory]
  );

  // Handle item selection
  const handleSelect = useCallback(
    (item: TreeItem) => {
      // Check if selection is allowed
      if (item.isDirectory && !allowFolders) return;
      if (!item.isDirectory && !allowFiles) return;

      setSelectedPath(item.path);
      onSelect(item.path, item.isDirectory);
    },
    [onSelect, allowFiles, allowFolders]
  );

  // Render tree recursively
  const renderTree = (items: TreeItem[], depth: number) => {
    return items.map((item) => {
      const state = treeState[item.path];
      const isExpanded = state?.isExpanded || false;
      const isLoading = state?.isLoading || false;
      const children = state?.children || [];

      return (
        <TreeNode
          key={item.path}
          item={item}
          isExpanded={isExpanded}
          isSelected={selectedPath === item.path}
          isLoading={isLoading}
          depth={depth}
          onToggle={() => handleToggle(item)}
          onSelect={() => handleSelect(item)}
        >
          {isExpanded && children.length > 0 && renderTree(children, depth + 1)}
        </TreeNode>
      );
    });
  };

  return (
    <div className="border border-border rounded-md bg-background">
      {/* Header with browse button */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/30">
        <span className="text-xs font-medium truncate flex-1">
          {root || "No folder selected"}
        </span>
        <button
          onClick={handleSelectRoot}
          className="flex items-center gap-1 px-2 py-0.5 text-xs border border-border rounded hover:bg-muted"
        >
          <FolderOpen className="w-3 h-3" />
          Browse
        </button>
      </div>

      {/* Tree content */}
      <div
        className="overflow-auto p-1"
        style={{ maxHeight }}
      >
        {!root ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            Click Browse to select a folder
          </div>
        ) : treeState[root]?.isLoading ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            Loading...
          </div>
        ) : treeState[root]?.children.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            Folder is empty
          </div>
        ) : (
          renderTree(treeState[root]?.children || [], 0)
        )}
      </div>

      {/* Selected path footer */}
      {selectedPath && (
        <div className="px-2 py-1 border-t border-border bg-muted/30">
          <span className="text-[10px] text-muted-foreground truncate block">
            {selectedPath}
          </span>
        </div>
      )}
    </div>
  );
}
