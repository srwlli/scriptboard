/**
 * Keyboard shortcuts system for Scriptboard.
 * Loads keymap from config and handles keydown events.
 */

import { useHotkeys } from "react-hotkeys-hook";
import { api } from "./api";

interface Keymap {
  [key: string]: string; // e.g., "ctrl+v": "paste_response"
}

let globalKeymap: Keymap = {};

/**
 * Load keymap from config.
 */
export async function loadKeymap(): Promise<Keymap> {
  try {
    const config = await api.getConfig();
    globalKeymap = (config.keymap || {}) as Keymap;
    return globalKeymap;
  } catch (error) {
    console.error("Failed to load keymap:", error);
    return {};
  }
}

/**
 * Get current keymap.
 */
export function getKeymap(): Keymap {
  return globalKeymap;
}

/**
 * Hook to use keyboard shortcuts with config-loaded keymap.
 */
export function useScriptboardHotkeys() {
  // Load keymap on mount
  useHotkeys("*", async (event, handler) => {
    if (Object.keys(globalKeymap).length === 0) {
      await loadKeymap();
    }
  }, { enableOnFormTags: true });

  // Paste response shortcut (default: Ctrl+V)
  useHotkeys(
    globalKeymap["paste_response"] || "ctrl+v",
    async () => {
      try {
        const text = await navigator.clipboard.readText();
        await api.addResponse(text);
      } catch (error) {
        console.error("Failed to paste response:", error);
      }
    },
    { enableOnFormTags: true, preventDefault: true }
  );

  // Paste prompt shortcut (default: Ctrl+Shift+V)
  useHotkeys(
    globalKeymap["paste_prompt"] || "ctrl+shift+v",
    async () => {
      try {
        const text = await navigator.clipboard.readText();
        await api.setPrompt(text);
      } catch (error) {
        console.error("Failed to paste prompt:", error);
      }
    },
    { enableOnFormTags: true, preventDefault: true }
  );

  // Clear all shortcut (default: Ctrl+Shift+C)
  useHotkeys(
    globalKeymap["clear_all"] || "ctrl+shift+c",
    async () => {
      if (confirm("Clear all session data?")) {
        try {
          await Promise.all([
            api.clearPrompt(),
            api.clearAttachments(),
            api.clearResponses(),
          ]);
        } catch (error) {
          console.error("Failed to clear all:", error);
        }
      }
    },
    { enableOnFormTags: true, preventDefault: true }
  );

  // Save session shortcut (default: Ctrl+S)
  useHotkeys(
    globalKeymap["save_session"] || "ctrl+s",
    async (event) => {
      event.preventDefault();
      try {
        await api.saveSession();
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    },
    { enableOnFormTags: true, preventDefault: true }
  );
}

