@echo off
REM Scriptboard Desktop Launcher
REM This script starts the Scriptboard application

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
cd ..

REM Check if we're in the right directory
if not exist "shell\package.json" (
    echo Error: Could not find shell directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Activate Python virtual environment if it exists
if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
)

REM Start the Electron app
cd shell
echo Starting Scriptboard...
npm run dev

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Scriptboard failed to start. Check the error messages above.
    pause
)

