/**
 * Terminal Settings Utility
 * Read/write Windows Terminal settings.json
 *
 * @see coderef/working/terminal-settings-sync/plan.json
 */

// ============================================
// TYPES
// ============================================

export interface TerminalProfile {
  guid: string;
  name: string;
  commandline?: string;
  startingDirectory?: string;
  tabColor?: string;
  tabTitle?: string;
  hidden?: boolean;
  source?: string;
  icon?: string;
}

export interface TerminalAction {
  command: string | { action: string; profile?: string; [key: string]: unknown };
  id: string;
}

export interface TerminalKeybinding {
  id: string | null;
  keys: string;
}

export interface TerminalSettings {
  $help?: string;
  $schema?: string;
  actions: TerminalAction[];
  keybindings: TerminalKeybinding[];
  profiles: {
    defaults: Record<string, unknown>;
    list: TerminalProfile[];
  };
  defaultProfile?: string;
  copyFormatting?: string;
  copyOnSelect?: boolean;
  newTabMenu?: unknown[];
  schemes?: unknown[];
  themes?: unknown[];
}

export interface ProjectProfile extends TerminalProfile {
  hotkey?: string;
  actionId?: string;
}

// ============================================
// CONSTANTS
// ============================================

const SETTINGS_PATH =
  "C:\\Users\\willh\\AppData\\Local\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json";

const BACKUP_PATH =
  "C:\\Users\\willh\\AppData\\Local\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.backup.json";

// Project profile GUIDs start with this pattern
const PROJECT_GUID_PREFIX = "{11111111-1111-1111-1111-";

// Preset colors for project profiles
export const PRESET_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Green", value: "#22C55E" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Slate", value: "#64748B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Amber", value: "#F59E0B" },
];

// Preset icons for project profiles (emojis)
// Note: Avoid emojis with variation selectors (U+FE0F) as Windows Terminal may not render them
export const PRESET_ICONS = [
  { name: "Rocket", value: "🚀" },
  { name: "Code", value: "💻" },
  { name: "Folder", value: "📁" },
  { name: "Tools", value: "🔧" },
  { name: "Lightning", value: "⚡" },
  { name: "Star", value: "⭐" },
  { name: "Fire", value: "🔥" },
  { name: "Gear", value: "⚙" },
  { name: "Package", value: "📦" },
  { name: "Plug", value: "🔌" },
  { name: "Globe", value: "🌐" },
  { name: "Game", value: "🎮" },
  { name: "Lock", value: "🔒" },
  { name: "Bug", value: "🐛" },
  { name: "Test", value: "🧪" },
  { name: "Book", value: "📚" },
  { name: "Chart", value: "📊" },
  { name: "Hammer", value: "🔨" },
  { name: "Football", value: "🏈" },
];

// ============================================
// FILE OPERATIONS (Electron IPC)
// ============================================

/**
 * Read Windows Terminal settings.json
 */
export async function readSettings(): Promise<TerminalSettings | null> {
  if (typeof window === "undefined") return null;

  const electronAPI = (window as any).electronAPI;
  if (!electronAPI?.readFile) {
    console.error("electronAPI.readFile not available");
    return null;
  }

  try {
    const result = await electronAPI.readFile(SETTINGS_PATH);
    if (result.error) {
      console.error("Failed to read settings:", result.error);
      return null;
    }
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Failed to parse settings:", err);
    return null;
  }
}

/**
 * Write Windows Terminal settings.json
 */
export async function writeSettings(settings: TerminalSettings): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const electronAPI = (window as any).electronAPI;
  if (!electronAPI?.writeFile) {
    console.error("electronAPI.writeFile not available");
    return false;
  }

  try {
    // Validate JSON before writing
    const content = JSON.stringify(settings, null, 4);
    JSON.parse(content); // Verify it's valid JSON

    const result = await electronAPI.writeFile(SETTINGS_PATH, content);
    if (result.error) {
      console.error("Failed to write settings:", result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to write settings:", err);
    return false;
  }
}

/**
 * Create backup of settings.json
 */
export async function createBackup(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const electronAPI = (window as any).electronAPI;
  if (!electronAPI?.readFile || !electronAPI?.writeFile) {
    console.error("electronAPI file operations not available");
    return false;
  }

  try {
    const result = await electronAPI.readFile(SETTINGS_PATH);
    if (result.error) {
      console.error("Failed to read settings for backup:", result.error);
      return false;
    }

    const writeResult = await electronAPI.writeFile(BACKUP_PATH, result.content);
    if (writeResult.error) {
      console.error("Failed to write backup:", writeResult.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to create backup:", err);
    return false;
  }
}

/**
 * Restore settings from backup
 */
export async function restoreBackup(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const electronAPI = (window as any).electronAPI;
  if (!electronAPI?.readFile || !electronAPI?.writeFile) {
    console.error("electronAPI file operations not available");
    return false;
  }

  try {
    const result = await electronAPI.readFile(BACKUP_PATH);
    if (result.error) {
      console.error("Failed to read backup:", result.error);
      return false;
    }

    const writeResult = await electronAPI.writeFile(SETTINGS_PATH, result.content);
    if (writeResult.error) {
      console.error("Failed to restore backup:", writeResult.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to restore backup:", err);
    return false;
  }
}

// ============================================
// PROFILE OPERATIONS
// ============================================

/**
 * Check if a profile is a custom project profile (not a system profile)
 */
export function isProjectProfile(profile: TerminalProfile): boolean {
  return profile.guid.startsWith(PROJECT_GUID_PREFIX);
}

/**
 * Get all project profiles with their hotkeys
 */
export function getProjectProfiles(settings: TerminalSettings): ProjectProfile[] {
  const profiles = settings.profiles.list.filter(isProjectProfile);

  return profiles.map((profile) => {
    // Find the action that opens this profile
    const action = settings.actions.find((a) => {
      if (typeof a.command === "object" && a.command.action === "newTab") {
        return a.command.profile === profile.name;
      }
      return false;
    });

    // Find the keybinding for this action
    const keybinding = action
      ? settings.keybindings.find((k) => k.id === action.id)
      : undefined;

    return {
      ...profile,
      actionId: action?.id,
      hotkey: keybinding?.keys,
    };
  });
}

/**
 * Generate a new project GUID
 */
export function generateProjectGuid(settings: TerminalSettings): string {
  const existing = settings.profiles.list
    .filter(isProjectProfile)
    .map((p) => {
      const match = p.guid.match(/1111111111(\d+)\}$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const maxNum = Math.max(0, ...existing);
  const nextNum = (maxNum + 1).toString().padStart(2, "0");
  return `${PROJECT_GUID_PREFIX}1111111111${nextNum}}`;
}

/**
 * Generate action ID for a profile
 */
export function generateActionId(profileName: string): string {
  const sanitized = profileName.replace(/[^a-zA-Z0-9]/g, "");
  return `User.open${sanitized}`;
}

/**
 * Add a new project profile
 */
export async function addProfile(
  name: string,
  startingDirectory: string,
  tabColor: string,
  hotkey?: string,
  icon?: string
): Promise<boolean> {
  const settings = await readSettings();
  if (!settings) return false;

  // Create backup first
  const backed = await createBackup();
  if (!backed) return false;

  const guid = generateProjectGuid(settings);
  const actionId = generateActionId(name);

  // Add profile
  const newProfile: TerminalProfile = {
    guid,
    name,
    commandline: "powershell.exe",
    startingDirectory,
    tabColor,
    tabTitle: name,
    hidden: false,
    ...(icon && { icon }),
  };
  settings.profiles.list.push(newProfile);

  // Add action
  const newAction: TerminalAction = {
    command: { action: "newTab", profile: name },
    id: actionId,
  };
  settings.actions.push(newAction);

  // Add keybinding if provided
  if (hotkey) {
    settings.keybindings.push({
      id: actionId,
      keys: hotkey,
    });
  }

  return writeSettings(settings);
}

/**
 * Update an existing profile
 */
export async function updateProfile(
  guid: string,
  updates: Partial<Pick<TerminalProfile, "name" | "startingDirectory" | "tabColor" | "icon">>
): Promise<boolean> {
  const settings = await readSettings();
  if (!settings) return false;

  const backed = await createBackup();
  if (!backed) return false;

  const profileIndex = settings.profiles.list.findIndex((p) => p.guid === guid);
  if (profileIndex === -1) return false;

  const profile = settings.profiles.list[profileIndex];
  const oldName = profile.name;

  // Update profile
  if (updates.name !== undefined) {
    profile.name = updates.name;
    profile.tabTitle = updates.name;
  }
  if (updates.startingDirectory !== undefined) {
    profile.startingDirectory = updates.startingDirectory;
  }
  if (updates.tabColor !== undefined) {
    profile.tabColor = updates.tabColor;
  }
  if (updates.icon !== undefined) {
    profile.icon = updates.icon;
  }

  // If name changed, update the action
  if (updates.name && updates.name !== oldName) {
    const action = settings.actions.find((a) => {
      if (typeof a.command === "object" && a.command.action === "newTab") {
        return a.command.profile === oldName;
      }
      return false;
    });
    if (action && typeof action.command === "object") {
      action.command.profile = updates.name;
    }
  }

  return writeSettings(settings);
}

/**
 * Delete a profile
 */
export async function deleteProfile(guid: string): Promise<boolean> {
  const settings = await readSettings();
  if (!settings) return false;

  const backed = await createBackup();
  if (!backed) return false;

  const profile = settings.profiles.list.find((p) => p.guid === guid);
  if (!profile) return false;

  // Remove profile
  settings.profiles.list = settings.profiles.list.filter((p) => p.guid !== guid);

  // Find and remove action
  const actionIndex = settings.actions.findIndex((a) => {
    if (typeof a.command === "object" && a.command.action === "newTab") {
      return a.command.profile === profile.name;
    }
    return false;
  });

  if (actionIndex !== -1) {
    const actionId = settings.actions[actionIndex].id;
    settings.actions.splice(actionIndex, 1);

    // Remove keybinding
    settings.keybindings = settings.keybindings.filter((k) => k.id !== actionId);
  }

  return writeSettings(settings);
}

/**
 * Set or update hotkey for a profile
 */
export async function setProfileHotkey(
  profileName: string,
  hotkey: string
): Promise<boolean> {
  const settings = await readSettings();
  if (!settings) return false;

  const backed = await createBackup();
  if (!backed) return false;

  // Find the action for this profile
  const action = settings.actions.find((a) => {
    if (typeof a.command === "object" && a.command.action === "newTab") {
      return a.command.profile === profileName;
    }
    return false;
  });

  if (!action) return false;

  // Remove any existing keybinding with this hotkey
  settings.keybindings = settings.keybindings.filter((k) => k.keys !== hotkey);

  // Find existing keybinding for this action
  const existingIndex = settings.keybindings.findIndex((k) => k.id === action.id);

  if (existingIndex !== -1) {
    settings.keybindings[existingIndex].keys = hotkey;
  } else {
    settings.keybindings.push({
      id: action.id,
      keys: hotkey,
    });
  }

  return writeSettings(settings);
}

/**
 * Remove hotkey from a profile
 */
export async function removeProfileHotkey(profileName: string): Promise<boolean> {
  const settings = await readSettings();
  if (!settings) return false;

  const backed = await createBackup();
  if (!backed) return false;

  const action = settings.actions.find((a) => {
    if (typeof a.command === "object" && a.command.action === "newTab") {
      return a.command.profile === profileName;
    }
    return false;
  });

  if (!action) return false;

  settings.keybindings = settings.keybindings.filter((k) => k.id !== action.id);

  return writeSettings(settings);
}
