Key Log Feature Plan
Scope and constraints
Windows-first.
No hotkeys initially.
Minimal flow: Start → Track → Stop → Name → Save.
Inline on modern page (no drawer/toolbar).
Data model
Event types: KeyDown, KeyUp, ClipboardSet, Delay, WindowFocus (optional).
Macro JSON: { id, name, created_at, events: [ {type, ts_delta_ms, …} ] }.
Storage path: ~/.scriptboard/macros/.json.
Backend API (FastAPI)
POST /macros/record/start → {status}
POST /macros/record/stop → {events}
POST /macros/save {name, events} → {id, path}
Implementation notes:
Recorder runs as a module with start/stop; caches latest events in memory.
Save validates name, writes JSON atomically.
Recorder (Windows)
Keyboard global hook (e.g., keyboard/pynput).
Clipboard listener (Win32 event; polling fallback).
Track timestamps to compute ts_delta_ms; clamp very long idle gaps.
Optional (behind a flag later): Window focus/title via win32 APIs.
Frontend (no hotkeys)
Component: KeyLogPanel (inline on modern page).
Buttons: Record (→ recording), Stop (→ stopped), Name + Save.
Status: Idle / Recording…
Calls new backend endpoints; disables Save until name is provided.
ApiClient additions
startRecording(): POST /macros/record/start
stopRecording(): POST /macros/record/stop
saveMacro(name, events): POST /macros/save
Testing
Unit: recorder event capture, delay computation, JSON serialization.
Integration: endpoints happy path (start→stop→save).
Manual E2E: verify UI flow and file saved under ~/.scriptboard/macros.
Rollout steps
Implement recorder module (Windows hooks + clipboard).
Add FastAPI endpoints wiring recorder + storage.
Add ApiClient methods.
Build KeyLogPanel (UI-only wiring to endpoints).
Manual E2E, then minimal docs entry.
Deliverables
Recorder module (Python).
Three FastAPI endpoints.
ApiClient methods.
KeyLogPanel integrated on modern page.
Macros saved as JSON under ~/.scriptboard/macros.