# Installing Scriptboard as a Desktop App

## Quick Start (Development Mode)

For development, you can run the app directly without building an installer:

```bash
# 1. Install dependencies
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

cd ../frontend
npm install

cd ../shell
npm install

# 2. Run in development mode
npm run dev
```

This will:
- Start the Python backend automatically
- Start the Next.js frontend automatically  
- Open the Electron window

## Building a Desktop Installer

To create a distributable desktop app installer:

### Step 1: Build the Frontend

```bash
cd frontend
npm run build
```

This creates a production build of the Next.js app.

### Step 2: Install Packaging Tools

```bash
cd shell
npm install
```

This installs `electron-builder` as a dev dependency.

### Step 3: Package the App

**For Windows:**
```bash
cd shell
npm run package:win
```

This creates a Windows installer (`.exe`) in `shell/dist/`.

**For macOS:**
```bash
cd shell
npm run package:mac
```

This creates a macOS DMG in `shell/dist/`.

**For Linux:**
```bash
cd shell
npm run package:linux
```

This creates an AppImage in `shell/dist/`.

### Step 4: Install the App

**Windows:**
- Run the `.exe` installer from `shell/dist/`
- Follow the installation wizard
- The app will be installed to your Program Files

**macOS:**
- Open the `.dmg` file from `shell/dist/`
- Drag Scriptboard to Applications folder
- You may need to allow the app in System Preferences > Security

**Linux:**
- Make the AppImage executable: `chmod +x Scriptboard-*.AppImage`
- Run it: `./Scriptboard-*.AppImage`

## Important Notes

### Backend Requirements

**Current Implementation:** The app requires Python 3.10+ to be installed on the user's system. The Electron app will:
1. Try to find a bundled Python backend executable (if packaged with PyInstaller)
2. Fall back to using system Python with `python -m uvicorn`

**For Standalone Distribution (Future):**
To create a fully standalone app that doesn't require Python:

1. **Package Python backend with PyInstaller:**
   ```bash
   cd backend
   pip install pyinstaller
   pyinstaller --onefile --name scriptboard-backend api.py
   ```

2. **Include the executable in Electron build:**
   - Copy `dist/scriptboard-backend.exe` to `shell/build/backend/`
   - Update `electron-builder` config to include it

### Icons

Add app icons to `shell/build/`:
- `icon.ico` (Windows, 256x256)
- `icon.icns` (macOS, multiple sizes)  
- `icon.png` (Linux, 512x512)

If icons are missing, electron-builder will use defaults.

## Troubleshooting

**Build fails:**
- Make sure all dependencies are installed (`npm install` in both frontend and shell)
- Check that frontend build completed successfully (`cd frontend && npm run build`)
- Ensure Python 3.10+ is in PATH

**App won't start:**
- Check that Python 3.10+ is installed: `python --version`
- Verify backend dependencies: `cd backend && pip install -r requirements.txt`
- Check Electron console for error messages (View > Toggle Developer Tools)

**Backend not found:**
- In production, ensure backend files are included in the package
- Check that Python is accessible from the packaged app's context
- Verify `shell/main.js` production path configuration

## Development vs Production

- **Development** (`npm run dev`): 
  - Uses live Next.js dev server at `http://localhost:3000`
  - Uses Python venv directly
  - Hot reload enabled
  
- **Production** (packaged installer):
  - Uses built Next.js standalone server
  - Requires system Python or bundled executable
  - All files bundled together

## Alternative: Desktop Shortcut (Simplest)

If you don't need a full installer, you can create a desktop shortcut:

### Method 1: Use the Provided Script (Easiest)

1. **Run the PowerShell script** (creates shortcut automatically):
   ```powershell
   cd shell
   powershell -ExecutionPolicy Bypass -File create-shortcut.ps1
   ```

   This creates `Scriptboard.lnk` on your desktop.

2. **Or manually create shortcut:**
   - Right-click on `shell/start-scriptboard.bat`
   - Select "Create shortcut"
   - Drag the shortcut to your desktop
   - Rename it to "Scriptboard"

### Method 2: Manual Shortcut Creation

1. **Right-click on your desktop** → New → Shortcut

2. **Enter the target:**
   ```
   cmd.exe /c "cd /d C:\Users\willh\Desktop\clipboard_compannion\next\shell && npm run dev"
   ```
   (Replace the path with your actual project path)

3. **Name it:** "Scriptboard"

4. **Optional - Change icon:**
   - Right-click shortcut → Properties → Change Icon
   - Browse to `shell32.dll` and pick an icon

### Method 3: PowerShell One-Liner

Run this in PowerShell (replace path with your actual path):
```powershell
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Scriptboard.lnk")
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = '/c "cd /d C:\Users\willh\Desktop\clipboard_compannion\next\shell && npm run dev"'
$Shortcut.WorkingDirectory = "C:\Users\willh\Desktop\clipboard_compannion\next\shell"
$Shortcut.Description = "Launch Scriptboard"
$Shortcut.Save()
```

This is the simplest way to "install" for personal use without building an installer.
