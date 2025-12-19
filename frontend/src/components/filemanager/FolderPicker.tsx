"use client";

import { useState } from "react";
import { FolderOpen, X } from "lucide-react";
import { TreePicker } from "./TreePicker";

interface FolderPickerProps {
  value: string;
  onChange: (path: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  /** Use in-app tree picker instead of native dialog */
  treeMode?: boolean;
  /** Allow selecting files in tree mode */
  allowFiles?: boolean;
}

/**
 * Folder picker input with browse button.
 * Uses Electron's native folder dialog when available,
 * falls back to manual text input in browser.
 * Set treeMode=true for in-app tree picker.
 */
export function FolderPicker({
  value,
  onChange,
  placeholder = "C:\\Users\\...\\Folder",
  disabled = false,
  label = "Target Folder",
  treeMode = true,
  allowFiles = false,
}: FolderPickerProps) {
  const [showTreePicker, setShowTreePicker] = useState(false);

  const handleBrowse = async () => {
    if (treeMode) {
      setShowTreePicker(true);
      return;
    }
    // Check if running in Electron with electronAPI available
    if (typeof window !== "undefined" && (window as any).electronAPI?.selectFolder) {
      try {
        const result = await (window as any).electronAPI.selectFolder();
        // Result is { path: string } or { error: string } or null
        if (result && result.path) {
          onChange(result.path);
        } else if (result && result.error) {
          console.error("Folder selection error:", result.error);
        }
      } catch (err) {
        console.error("Failed to open folder dialog:", err);
      }
    } else {
      // Fallback: prompt user (browser environment)
      const path = prompt("Enter folder path:");
      if (path) {
        onChange(path);
      }
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleBrowse}
          disabled={disabled}
          className="px-3 py-2 text-sm border border-border rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          title="Browse for folder"
        >
          <FolderOpen size={14} />
          Browse
        </button>
      </div>

      {/* Tree Picker Modal */}
      {treeMode && showTreePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-[400px] max-h-[500px] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium">Select {allowFiles ? "File or Folder" : "Folder"}</span>
              <button
                onClick={() => setShowTreePicker(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <TreePicker
                rootPath={value || undefined}
                onSelect={(path) => {
                  onChange(path);
                  setShowTreePicker(false);
                }}
                allowFiles={allowFiles}
                allowFolders={true}
                maxHeight="350px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
