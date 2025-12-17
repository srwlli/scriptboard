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
  Keyboard,
  FolderOpen,
  Check,
  AlertCircle,
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
 *
 * @see coderef/working/terminal-settings-sync/plan.json
 */
export function TerminalManager() {
  // State
  const [settings, setSettings] = useState<TerminalSettings | null>(null);
  const [profiles, setProfiles] = useState<ProjectProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit mode
  const [editingGuid, setEditingGuid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", directory: "", color: "" });

  // Add mode
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", directory: "", color: PRESET_COLORS[0].value, hotkey: "" });

  // Hotkey capture
  const [capturingHotkey, setCapturingHotkey] = useState<string | null>(null);
  const hotkeyInputRef = useRef<HTMLInputElement>(null);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  // Load settings on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Clear success message after 3s
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await readSettings();
      if (!data) {
        setError("Could not read Terminal settings. Make sure Windows Terminal is installed.");
        return;
      }
      setSettings(data);
      setProfiles(getProjectProfiles(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle folder selection
  const handleSelectFolder = async (setDirectory: (dir: string) => void) => {
    if (typeof window === "undefined") return;

    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.selectFolder) {
      setError("Folder selection not available");
      return;
    }

    const result = await electronAPI.selectFolder();
    if (result?.path) {
      setDirectory(result.path);
    }
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
        // Update existing profile hotkey
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

  // CRUD Operations
  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.directory.trim()) {
      setError("Name and directory are required");
      return;
    }

    setLoading(true);
    try {
      const result = await addProfile(
        addForm.name.trim(),
        addForm.directory.trim(),
        addForm.color,
        addForm.hotkey || undefined
      );

      if (result) {
        setSuccess(`Created profile "${addForm.name}"`);
        setShowAddForm(false);
        setAddForm({ name: "", directory: "", color: PRESET_COLORS[0].value, hotkey: "" });
        await loadProfiles();
      } else {
        setError("Failed to add profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add profile");
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
      const result = await updateProfile(editingGuid, {
        name: editForm.name.trim(),
        startingDirectory: editForm.directory.trim(),
        tabColor: editForm.color,
      });

      if (result) {
        setSuccess(`Updated profile "${editForm.name}"`);
        setEditingGuid(null);
        await loadProfiles();
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profile: ProjectProfile) => {
    const confirmed = await confirm({
      title: "Delete Profile",
      message: `Delete "${profile.name}" profile? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await deleteProfile(profile.guid);
      if (result) {
        setSuccess(`Deleted profile "${profile.name}"`);
        await loadProfiles();
      } else {
        setError("Failed to delete profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSetHotkey = async (profileName: string, hotkey: string) => {
    setLoading(true);
    try {
      const result = await setProfileHotkey(profileName, hotkey);
      if (result) {
        setSuccess(`Set hotkey ${hotkey} for "${profileName}"`);
        await loadProfiles();
      } else {
        setError("Failed to set hotkey");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set hotkey");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHotkey = async (profileName: string) => {
    setLoading(true);
    try {
      const result = await removeProfileHotkey(profileName);
      if (result) {
        setSuccess(`Removed hotkey from "${profileName}"`);
        await loadProfiles();
      } else {
        setError("Failed to remove hotkey");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove hotkey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CollapsibleCard
      title="Terminal Manager"
      defaultCollapsed={false}
    >
      {ConfirmModalComponent}

      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-zinc-500">
          {profiles.length} project profile{profiles.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            onClick={loadProfiles}
            disabled={loading}
            className="p-1.5 rounded hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={loading || showAddForm}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 p-2 mb-3 text-xs text-red-400 bg-red-900/20 rounded border border-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-2 mb-3 text-xs text-green-400 bg-green-900/20 rounded border border-green-800">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="p-3 mb-3 bg-zinc-800/50 rounded border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">New Profile</span>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-zinc-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="My Project"
                className="w-full px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Directory */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Directory</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addForm.directory}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, directory: e.target.value }))}
                  placeholder="C:\Projects\MyProject"
                  className="flex-1 px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleSelectFolder((dir) => setAddForm((prev) => ({ ...prev, directory: dir })))}
                  className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                  title="Browse"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Tab Color</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setAddForm((prev) => ({ ...prev, color: color.value }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      addForm.color === color.value ? "border-white scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Hotkey */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Hotkey (optional)</label>
              <div className="flex gap-2">
                <input
                  ref={hotkeyInputRef}
                  type="text"
                  value={capturingHotkey === "add" ? "Press keys..." : addForm.hotkey}
                  readOnly
                  placeholder="Click to capture"
                  onClick={() => setCapturingHotkey("add")}
                  className={`flex-1 px-2 py-1.5 text-sm bg-zinc-900 border rounded cursor-pointer ${
                    capturingHotkey === "add" ? "border-blue-500 bg-blue-900/20" : "border-zinc-700"
                  }`}
                />
                {addForm.hotkey && (
                  <button
                    onClick={() => setAddForm((prev) => ({ ...prev, hotkey: "" }))}
                    className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdd}
                disabled={loading || !addForm.name.trim() || !addForm.directory.trim()}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Create
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profiles List */}
      {loading && profiles.length === 0 ? (
        <div className="text-center text-sm text-zinc-500 py-8">Loading...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center text-sm text-zinc-500 py-8">
          No project profiles found.
          <br />
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 text-blue-400 hover:text-blue-300"
          >
            Create one
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.guid}
              className="p-3 bg-zinc-800/50 rounded border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              {editingGuid === profile.guid ? (
                // Edit mode
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.directory}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, directory: e.target.value }))}
                      className="flex-1 px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSelectFolder((dir) => setEditForm((prev) => ({ ...prev, directory: dir })))}
                      className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setEditForm((prev) => ({ ...prev, color: color.value }))}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          editForm.color === color.value ? "border-white scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGuid(null)}
                      className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: profile.tabColor || "#64748B" }}
                    />
                    <span className="font-medium text-sm truncate">{profile.name}</span>
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => handleEdit(profile)}
                        className="p-1 hover:bg-zinc-700 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(profile)}
                        className="p-1 hover:bg-red-900/50 text-red-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500 truncate mb-2" title={profile.startingDirectory}>
                    {profile.startingDirectory}
                  </div>

                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3 h-3 text-zinc-500" />
                    {profile.hotkey ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono bg-zinc-700 px-1.5 py-0.5 rounded">
                          {profile.hotkey}
                        </span>
                        <button
                          onClick={() => setCapturingHotkey(profile.name)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          change
                        </button>
                        <button
                          onClick={() => handleRemoveHotkey(profile.name)}
                          className="text-xs text-zinc-500 hover:text-zinc-400"
                        >
                          remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCapturingHotkey(profile.name)}
                        className={`text-xs ${
                          capturingHotkey === profile.name
                            ? "text-blue-400"
                            : "text-zinc-500 hover:text-zinc-400"
                        }`}
                      >
                        {capturingHotkey === profile.name ? "Press keys..." : "Set hotkey"}
                      </button>
                    )}
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
