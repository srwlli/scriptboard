/**
 * Electron main process for Scriptboard.
 * Spawns backend process and loads Next.js UI.
 */

const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

const isDev = process.argv.includes("--dev") || !app.isPackaged;

function spawnBackend() {
  if (backendProcess) {
    console.log("Backend already running");
    return;
  }

  if (isDev) {
    // Development: spawn uvicorn
    const backendPath = path.join(__dirname, "..", "backend");
    const venvPython = path.join(backendPath, "..", "venv", "Scripts", "python.exe");
    const apiPath = path.join(backendPath, "api.py");

    console.log("Spawning backend (dev mode):", venvPython, apiPath);

    backendProcess = spawn(venvPython, ["-m", "uvicorn", "api:app", "--host", "127.0.0.1", "--port", BACKEND_PORT.toString()], {
      cwd: backendPath,
      stdio: "inherit",
    });
  } else {
    // Production: spawn executable (TODO: implement when packaging)
    console.log("Production mode: backend executable not yet implemented");
    return;
  }

  backendProcess.on("error", (error) => {
    console.error("Backend spawn error:", error);
    showBackendError("Failed to start backend", error.message);
  });

  backendProcess.on("exit", (code, signal) => {
    console.log(`Backend process exited with code ${code} and signal ${signal}`);
    backendProcess = null;

    if (code !== 0 && code !== null) {
      showBackendError("Backend crashed", `Exit code: ${code}`);
    }
  });
}

function pollBackendHealth(callback) {
  const maxAttempts = 30;
  let attempts = 0;

  const checkHealth = () => {
    attempts++;
    const req = http.get(`${BACKEND_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        callback(true);
      } else {
        if (attempts < maxAttempts) {
          setTimeout(checkHealth, 500);
        } else {
          callback(false);
        }
      }
    });

    req.on("error", () => {
      if (attempts < maxAttempts) {
        setTimeout(checkHealth, 500);
      } else {
        callback(false);
      }
    });

    req.setTimeout(1000, () => {
      req.destroy();
      if (attempts < maxAttempts) {
        setTimeout(checkHealth, 500);
      } else {
        callback(false);
      }
    });
  };

  checkHealth();
}

function showBackendError(title, message) {
  if (!mainWindow) return;

  dialog
    .showMessageBox(mainWindow, {
      type: "error",
      title: "Backend Error",
      message: title,
      detail: message,
      buttons: ["Restart Backend", "Close"],
      defaultId: 0,
    })
    .then((result) => {
      if (result.response === 0) {
        // Restart backend
        spawnBackend();
        pollBackendHealth((healthy) => {
          if (healthy && mainWindow) {
            mainWindow.reload();
          } else {
            showBackendError("Backend restart failed", "Could not restart backend. Please check logs.");
          }
        });
      }
    });
}

// Monitor backend process for crashes
if (backendProcess) {
  backendProcess.on("exit", (code, signal) => {
    if (code !== 0 && code !== null && mainWindow) {
      showBackendError("Backend crashed", `The backend process exited unexpectedly (code: ${code}).`);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Start backend
  spawnBackend();

  // Poll backend health, then load UI
  pollBackendHealth((healthy) => {
    if (healthy) {
      mainWindow.loadURL(FRONTEND_URL);
    } else {
      showBackendError("Backend not responding", "Failed to connect to backend after 15 seconds");
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC handlers
ipcMain.handle("select-folder", async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Folder",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];

  // Validate path exists and is a directory
  try {
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      return { error: "Selected path is not a directory" };
    }

    // Send to backend (TODO: implement /attachments/folder endpoint)
    // For now, return the path
    return { path: folderPath };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("open-folder", async (event, folderPath) => {
  // Open folder in system file explorer for quick drag-and-drop access
  try {
    if (!folderPath) {
      return { error: "No path provided" };
    }

    // Validate path exists and is a directory
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      return { error: "Path is not a directory" };
    }

    // Open in system file explorer (Windows Explorer, macOS Finder, Linux file manager)
    shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

