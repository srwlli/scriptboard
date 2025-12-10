"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Keymap {
  [key: string]: string; // e.g., "paste_response": "Ctrl+V"
}

export function KeymapEditor() {
  const [keymap, setKeymap] = useState<Keymap>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [capturedKey, setCapturedKey] = useState<string>("");

  useEffect(() => {
    loadKeymap();
  }, []);

  const loadKeymap = async () => {
    try {
      const config = await api.getConfig();
      setKeymap((config.keymap || {}) as Keymap);
    } catch (error) {
      // Silently fail if backend is not available
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load keymap:", error);
      }
    }
  };

  const handleStartEdit = (action: string) => {
    setEditingKey(action);
    setCapturedKey("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: string) => {
    if (editingKey !== action) return;

    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");

    const key = e.key.toLowerCase();
    if (key !== "control" && key !== "alt" && key !== "shift" && key !== "meta") {
      parts.push(key.charAt(0).toUpperCase() + key.slice(1));
      const combination = parts.join("+");
      setCapturedKey(combination);
    }
  };

  const handleSave = (action: string) => {
    if (capturedKey) {
      setKeymap((prev) => ({
        ...prev,
        [action]: capturedKey,
      }));
      // Note: In a real implementation, this would save to backend
      // For now, we'll just update local state and show a message
      alert(`Keymap updated: ${action} = ${capturedKey}\n\nNote: To persist, update config.json manually or implement save endpoint.`);
    }
    setEditingKey(null);
    setCapturedKey("");
  };

  const handleCancel = () => {
    setEditingKey(null);
    setCapturedKey("");
  };

  const keymapActions = [
    { key: "paste_response", label: "Paste Response" },
    { key: "paste_prompt", label: "Paste Prompt" },
    { key: "load_prompt", label: "Load Prompt" },
    { key: "clear_all", label: "Clear All" },
    { key: "save_session", label: "Save Session" },
    { key: "load_session", label: "Load Session" },
    { key: "toggle_preview", label: "Toggle Preview" },
  ];

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Keyboard Shortcuts</h2>

      <div className="space-y-2">
        {keymapActions.map((action) => (
          <div
            key={action.key}
            className="flex items-center justify-between p-2 border border-border rounded hover:bg-accent transition-colors"
          >
            <span className="text-sm text-foreground">{action.label}</span>
            <div className="flex items-center gap-2">
              {editingKey === action.key ? (
                <>
                  <input
                    type="text"
                    value={capturedKey || "Press keys..."}
                    onKeyDown={(e) => handleKeyDown(e, action.key)}
                    readOnly
                    className="px-2 py-1 text-xs rounded border border-border bg-background text-foreground w-32 text-center"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(action.key)}
                    className="px-2 py-1 text-xs rounded border border-border bg-background hover:bg-accent transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-2 py-1 text-xs rounded border border-border bg-background hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
                    {keymap[action.key] || "Not set"}
                  </span>
                  <button
                    onClick={() => handleStartEdit(action.key)}
                    className="px-2 py-1 text-xs rounded border border-border bg-background hover:bg-accent transition-colors"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Note: Keymap changes are temporary. To persist, update config.json or implement save endpoint.
      </p>
    </div>
  );
}

