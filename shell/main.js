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
    // Production: try to use system Python or bundled executable
    // First, try bundled executable (if packaged with PyInstaller)
    const bundledBackend = path.join(process.resourcesPath, "backend", "scriptboard-backend.exe");
    if (fs.existsSync(bundledBackend)) {
      console.log("Using bundled backend executable");
      backendProcess = spawn(bundledBackend, [], {
        cwd: path.dirname(bundledBackend),
        stdio: "inherit",
      });
    } else {
      // Fallback: use system Python (requires Python to be installed)
      const backendPath = path.join(process.resourcesPath, "backend");
      const pythonCmd = process.platform === "win32" ? "python.exe" : "python3";
      
      console.log("Using system Python for backend");
      backendProcess = spawn(pythonCmd, ["-m", "uvicorn", "api:app", "--host", "127.0.0.1", "--port", BACKEND_PORT.toString()], {
        cwd: backendPath,
        stdio: "inherit",
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      });
    }
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
      if (isDev) {
        // Development: load from Next.js dev server
        mainWindow.loadURL(FRONTEND_URL);
      } else {
        // Production: load from built Next.js app
        const frontendPath = path.join(process.resourcesPath, "frontend", ".next");
        const indexPath = path.join(frontendPath, "server", "pages", "index.html");
        
        // Try to load built Next.js app, fallback to dev server if not found
        if (fs.existsSync(indexPath)) {
          mainWindow.loadFile(indexPath);
        } else {
          // Fallback: try to use Next.js standalone server
          const standalonePath = path.join(frontendPath, "standalone");
          if (fs.existsSync(standalonePath)) {
            const serverPath = path.join(standalonePath, "server.js");
            if (fs.existsSync(serverPath)) {
              // Spawn Next.js standalone server
              const nodeCmd = process.platform === "win32" ? "node.exe" : "node";
              spawn(nodeCmd, [serverPath], {
                cwd: standalonePath,
                env: { ...process.env, PORT: "3000" },
              });
              setTimeout(() => {
                mainWindow.loadURL("http://localhost:3000");
              }, 2000);
            } else {
              mainWindow.loadURL(FRONTEND_URL);
            }
          } else {
            mainWindow.loadURL(FRONTEND_URL);
          }
        }
      }
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

ipcMain.handle("open-file-dialog", async (event, options = {}) => {
  if (!mainWindow) return { canceled: true };

  const dialogOptions = {
    title: options.title || "Select File",
    properties: ["openFile"],
    filters: options.filters || [{ name: "All Files", extensions: ["*"] }],
  };

  // Convert filters format from frontend to Electron format
  if (options.filters) {
    dialogOptions.filters = options.filters.map((filter) => ({
      name: filter.name,
      extensions: Array.isArray(filter.extensions) ? filter.extensions : [filter.extensions],
    }));
  }

  const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  return {
    canceled: false,
    filePath: result.filePaths[0],
  };
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    if (!filePath) {
      return { error: "No file path provided" };
    }

    // Validate file exists
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return { error: "Path is not a file" };
    }

    // Size guard: 2MB limit
    if (stats.size > 2_000_000) {
      return { error: "File too large (max 2MB)" };
    }

    // Read file as UTF-8 text
    const content = fs.readFileSync(filePath, "utf-8");
    return { content, filename: path.basename(filePath) };
  } catch (error) {
    return { error: error.message };
  }
});

