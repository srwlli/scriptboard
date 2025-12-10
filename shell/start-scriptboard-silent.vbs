Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
projectRoot = fso.GetParentFolderName(scriptPath)

' Check if shell directory exists
If Not fso.FolderExists(scriptPath) Then
    MsgBox "Error: Could not find shell directory", vbCritical, "Scriptboard Launcher"
    WScript.Quit
End If

' Start the Electron app silently using PowerShell with hidden window
shellDir = scriptPath
' Use PowerShell to run npm with hidden window
command = "powershell.exe -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command ""Set-Location '" & shellDir & "'; npm run dev"""

' Run the command without showing a window (0 = hidden)
WshShell.Run command, 0, False

' Script exits immediately, Electron runs in background

