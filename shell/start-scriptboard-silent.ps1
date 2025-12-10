# Scriptboard Silent Launcher (PowerShell)
# Launches the app without showing a console window

$ErrorActionPreference = "Stop"

# Get the directory where this script is located
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

# Change to project root
Set-Location $projectRoot

# Check if shell directory exists
if (-not (Test-Path "$scriptPath\package.json")) {
    [System.Windows.Forms.MessageBox]::Show(
        "Error: Could not find shell directory`nCurrent directory: $projectRoot",
        "Scriptboard Launcher",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
    exit 1
}

# Start the Electron app without showing console
$shellDir = $scriptPath
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "npm"
$processInfo.Arguments = "run dev"
$processInfo.WorkingDirectory = $shellDir
$processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$processInfo.CreateNoWindow = $true
$processInfo.UseShellExecute = $false

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null

# Exit immediately - Electron runs in background
exit 0

