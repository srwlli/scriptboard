"use client";

import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";

export interface TreeItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface TreeNodeProps {
  item: TreeItem;
  isExpanded: boolean;
  isSelected: boolean;
  isLoading: boolean;
  depth: number;
  onToggle: () => void;
  onSelect: () => void;
  children?: React.ReactNode;
}

/**
 * Individual tree node for folder/file display.
 * Shows expand chevron for folders, appropriate icon, and name.
 */
export function TreeNode({
  item,
  isExpanded,
  isSelected,
  isLoading,
  depth,
  onToggle,
  onSelect,
  children,
}: TreeNodeProps) {
  const handleClick = () => {
    if (item.isDirectory) {
      onToggle();
    }
    onSelect();
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer text-xs hover:bg-muted/50 ${
          isSelected ? "bg-primary/20 text-primary" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Expand/collapse chevron for directories */}
        {item.isDirectory ? (
          <span className="w-3 h-3 flex items-center justify-center flex-shrink-0">
            {isLoading ? (
              <span className="w-2 h-2 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="w-3 h-3 flex-shrink-0" />
        )}

        {/* Icon */}
        {item.isDirectory ? (
          <Folder className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
        ) : (
          <File className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        )}

        {/* Name */}
        <span className="truncate">{item.name}</span>
      </div>

      {/* Children (rendered when expanded) */}
      {isExpanded && children}
    </div>
  );
}
