# Scriptboard Build Guide

## Full .exe Build (All Updates)

Run these commands in order to create a complete build with all frontend and backend changes:

```bash
# 0. Clear Caches (ensures fresh build)
rm -rf frontend/.next
rm -rf backend/build
rm -rf backend/dist
rm -rf shell/dist

# 1. Build Frontend (Next.js)
cd frontend
npm run build

# 2. Build Backend (PyInstaller)
cd ../backend
python -m PyInstaller --onefile --noconsole --name scriptboard-backend api.py

# 3. Package Electron App
cd ../shell
npm run package:win
```

## Output

- **Installer**: `shell/dist/Scriptboard Setup 0.2.0.exe`
- **Unpacked**: `shell/dist/win-unpacked/`

## Quick Reference

| Step | Directory | Command |
|------|-----------|---------|
| Clean | root | `rm -rf frontend/.next backend/build backend/dist shell/dist` |
| Frontend | `frontend/` | `npm run build` |
| Backend | `backend/` | `pyinstaller --onefile --noconsole --name scriptboard-backend api.py` |
| Package | `shell/` | `npm run package:win` |

## One-Liner (PowerShell)

```powershell
rm -rf frontend/.next, backend/build, backend/dist, shell/dist; cd frontend; npm run build; cd ../backend; python -m PyInstaller --onefile --noconsole --name scriptboard-backend api.py; cd ../shell; npm run package:win
```

## Notes

- Frontend build outputs to `frontend/.next/standalone/`
- Backend build outputs to `backend/dist/scriptboard-backend.exe`
- Electron packager copies these into the final app bundle
- Always clear caches before building to ensure all changes are included

## Installer Behavior

The NSIS installer (`shell/build/installer.nsh`) automatically:
- Kills running `Scriptboard.exe` before install
- Kills running `scriptboard-backend.exe` before install
- Launches app after install completes
