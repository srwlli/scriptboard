; Custom NSIS script for Scriptboard installer
; Kills running processes before installation

!macro customInit
  ; Kill Scriptboard.exe if running
  nsExec::ExecToLog 'taskkill /F /IM "Scriptboard.exe"'
  ; Kill backend process if running
  nsExec::ExecToLog 'taskkill /F /IM "scriptboard-backend.exe"'
  ; Small delay to ensure processes are terminated
  Sleep 500
!macroend
