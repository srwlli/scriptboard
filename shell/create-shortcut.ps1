# PowerShell script to create a desktop shortcut for Scriptboard
# Run this script: powershell -ExecutionPolicy Bypass -File create-shortcut.ps1

$shell = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath("Desktop")
$shortcut = $shell.CreateShortcut("$desktop\Scriptboard.lnk")

# Get the full path to the batch file
$scriptPath = Join-Path $PSScriptRoot "start-scriptboard.bat"
$shortcut.TargetPath = $scriptPath
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.Description = "Launch Scriptboard Desktop App"
$shortcut.IconLocation = "shell32.dll,137"  # Folder icon, you can change this

$shortcut.Save()
Write-Host "Desktop shortcut created: $desktop\Scriptboard.lnk" -ForegroundColor Green

