"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CollapsibleCard } from "@/components/ui";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import {
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  FolderOpen,
} from "lucide-react";
import {
  readSettings,
  getProjectProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
  setProfileHotkey,
  removeProfileHotkey,
  PRESET_COLORS,
  ProjectProfile,
  TerminalSettings,
} from "@/lib/terminal-settings";

/**
 * Terminal Manager - Manage Windows Terminal project profiles
 * Minimal UI for viewing/editing terminal profiles and hotkeys.
 */
export function TerminalManager() {
  const [profiles, setProfiles] = useState<ProjectProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editingGuid, setEditingGuid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", directory: "", color: "" });

  // Add mode
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", directory: "", color: PRESET_COLORS[0].value, hotkey: "" });

  // Hotkey capture
  const [capturingHotkey, setCapturingHotkey] = useState<string | null>(null);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readSettings();
      if (!data) {
        setError("Could not read Terminal settings");
        return;
      }
      setProfiles(getProjectProfiles(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = async (setDirectory: (dir: string) => void) => {
    const electronAPI = (window as any)?.electronAPI;
    if (!electronAPI?.selectFolder) return;
    const result = await electronAPI.selectFolder();
    if (result?.path) setDirectory(result.path);
  };

  // Hotkey capture
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!capturingHotkey) return;
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");

    const key = e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
      parts.push(key);
      const hotkey = parts.join("+");
      if (capturingHotkey === "add") {
        setAddForm((prev) => ({ ...prev, hotkey }));
      } else {
        handleSetHotkey(capturingHotkey, hotkey);
      }
      setCapturingHotkey(null);
    }
  }, [capturingHotkey]);

  useEffect(() => {
    if (capturingHotkey) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [capturingHotkey, handleKeyDown]);

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.directory.trim()) return;
    setLoading(true);
    try {
      await addProfile(addForm.name.trim(), addForm.directory.trim(), addForm.color, addForm.hotkey || undefined);
      setShowAddForm(false);
      setAddForm({ name: "", directory: "", color: PRESET_COLORS[0].value, hotkey: "" });
      await loadProfiles();
    } catch {
      setError("Failed to add profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: ProjectProfile) => {
    setEditingGuid(profile.guid);
    setEditForm({
      name: profile.name,
      directory: profile.startingDirectory || "",
      color: profile.tabColor || PRESET_COLORS[0].value,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingGuid || !editForm.name.trim()) return;
    setLoading(true);
    try {
      await updateProfile(editingGuid, {
        name: editForm.name.trim(),
        startingDirectory: editForm.directory.trim(),
        tabColor: editForm.color,
      });
      setEditingGuid(null);
      await loadProfiles();
    } catch {
      setError("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profile: ProjectProfile) => {
    const confirmed = await confirm({
      title: "Delete Profile",
      message: `Delete "${profile.name}"?`,
      confirmText: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteProfile(profile.guid);
      await loadProfiles();
    } catch {
      setError("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleSetHotkey = async (profileName: string, hotkey: string) => {
    try {
      await setProfileHotkey(profileName, hotkey);
      await loadProfiles();
    } catch {
      setError("Failed to set hotkey");
    }
  };

  const handleRemoveHotkey = async (profileName: string) => {
    try {
      await removeProfileHotkey(profileName);
      await loadProfiles();
    } catch {
      setError("Failed to remove hotkey");
    }
  };

  // Header with refresh and add buttons
  const rightContent = (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); loadProfiles(); }}
        disabled={loading}
        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
        title="Refresh"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setShowAddForm(true); }}
        disabled={loading || showAddForm}
        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
        title="Add profile"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <CollapsibleCard title="Terminal Profiles" defaultCollapsed={true} rightContent={rightContent}>
      {ConfirmModalComponent}

      {error && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Add Form - Minimal */}
      {showAddForm && (
        <div className="mb-3 p-2 border border-border rounded bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">New Profile</span>
            <button onClick={() => setShowAddForm(false)} className="p-0.5 hover:bg-muted rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
              className="w-full px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:border-muted-foreground"
            />
            <div className="flex gap-1">
              <input
                type="text"
                value={addForm.directory}
                onChange={(e) => setAddForm((prev) => ({ ...prev, directory: e.target.value }))}
                placeholder="Directory path"
                className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:border-muted-foreground"
              />
              <button
                onClick={() => handleSelectFolder((dir) => setAddForm((prev) => ({ ...prev, directory: dir })))}
                className="px-1.5 py-1 border border-border rounded hover:bg-muted"
              >
                <FolderOpen className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Color:</span>
              {PRESET_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAddForm((prev) => ({ ...prev, color: color.value }))}
                  className={`w-4 h-4 rounded-full border ${
                    addForm.color === color.value ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <input
              type="text"
              value={capturingHotkey === "add" ? "Press keys..." : addForm.hotkey}
              readOnly
              placeholder="Hotkey (click to set)"
              onClick={() => setCapturingHotkey("add")}
              className="w-full px-2 py-1 text-xs bg-background border border-border rounded cursor-pointer focus:outline-none"
            />
            <div className="flex gap-1">
              <button
                onClick={handleAdd}
                disabled={loading || !addForm.name.trim() || !addForm.directory.trim()}
                className="flex-1 px-2 py-1 text-xs border border-border rounded hover:bg-muted disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profiles List */}
      {loading && profiles.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4">Loading...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4">
          No profiles.{" "}
          <button onClick={() => setShowAddForm(true)} className="underline hover:text-foreground">
            Add one
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {profiles.map((profile) => (
            <div key={profile.guid} className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50">
              {editingGuid === profile.guid ? (
                // Inline edit
                <div className="flex-1 space-y-1">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="flex-1 px-1.5 py-0.5 text-xs bg-background border border-border rounded"
                    />
                    <div className="flex gap-0.5">
                      {PRESET_COLORS.slice(0, 6).map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setEditForm((prev) => ({ ...prev, color: color.value }))}
                          className={`w-3 h-3 rounded-full border ${
                            editForm.color === color.value ? "border-foreground" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editForm.directory}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, directory: e.target.value }))}
                      className="flex-1 px-1.5 py-0.5 text-xs bg-background border border-border rounded"
                    />
                    <button onClick={handleSaveEdit} className="p-0.5 hover:bg-muted rounded" title="Save">
                      <Save className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingGuid(null)} className="p-0.5 hover:bg-muted rounded" title="Cancel">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: profile.tabColor || "#666" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{profile.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{profile.startingDirectory}</div>
                  </div>
                  {profile.hotkey ? (
                    <span
                      className="text-[10px] font-mono text-muted-foreground px-1 py-0.5 bg-muted rounded cursor-pointer hover:bg-muted/80"
                      onClick={() => setCapturingHotkey(profile.name)}
                      title="Click to change"
                    >
                      {profile.hotkey}
                    </span>
                  ) : (
                    <button
                      onClick={() => setCapturingHotkey(profile.name)}
                      className={`text-[10px] text-muted-foreground hover:text-foreground ${
                        capturingHotkey === profile.name ? "text-foreground" : ""
                      }`}
                    >
                      {capturingHotkey === profile.name ? "Press..." : "+key"}
                    </button>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                    <button onClick={() => handleEdit(profile)} className="p-0.5 hover:bg-muted rounded" title="Edit">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(profile)} className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </CollapsibleCard>
  );
}
