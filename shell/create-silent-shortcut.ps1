# Create a desktop shortcut that launches Scriptboard silently
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Scriptboard.lnk")

# Point to the VBScript launcher (runs silently)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath = Join-Path $scriptPath "start-scriptboard-silent.vbs"

$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$vbsPath`""
$Shortcut.WorkingDirectory = Split-Path -Parent $scriptPath
$Shortcut.Description = "Launch Scriptboard Application"
$Shortcut.IconLocation = "shell32.dll,1"  # Default application icon

$Shortcut.Save()

Write-Host "Desktop shortcut created: Scriptboard.lnk"
Write-Host "This shortcut will launch the app without showing a console window."

