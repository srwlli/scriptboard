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
  openFileDialog: (options) => ipcRenderer.invoke("open-file-dialog", options),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  setWindowResizable: (resizable) => ipcRenderer.invoke("set-window-resizable", resizable),
  setWindowSize: (width, height) => ipcRenderer.invoke("set-window-size", width, height),
  getWindowSize: () => ipcRenderer.invoke("get-window-size"),
  resetWindowSizeConstraints: () => ipcRenderer.invoke("reset-window-size-constraints"),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke("set-always-on-top", flag),
});

