/**
 * Electron preload script.
 * Exposes safe IPC APIs via contextBridge for folder selection.
 */

const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  openFolder: (path) => ipcRenderer.invoke("open-folder", path),
});

