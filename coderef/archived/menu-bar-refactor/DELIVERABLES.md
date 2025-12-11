# DELIVERABLES: menu-bar-refactor

**Project**: next
**Feature**: menu-bar-refactor
**Workorder**: WO-MENU-BAR-REFACTOR-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-10

---

## Executive Summary

**Goal**: TBD

**Description**: TBD

---

## Implementation Phases

### Phase 1: Electron Frameless Window Setup

**Description**: Configure Electron for frameless window and add window control IPC handlers

**Estimated Duration**: TBD

**Deliverables**:

### Phase 2: Menu Bar Component Development

**Description**: Create menu bar components (MenuBar, MenuDropdown, WindowControls) with all functionality

**Estimated Duration**: TBD

**Deliverables**:

### Phase 3: Integration and Layout

**Description**: Integrate menu bar into Header and ensure proper layout positioning

**Estimated Duration**: TBD

**Deliverables**:

### Phase 4: Testing and Validation

**Description**: Test all functionality including frameless window, window controls, menu actions, and browser compatibility

**Estimated Duration**: TBD

**Deliverables**:


---

## Metrics

### Code Changes
- **Lines of Code Added**: TBD
- **Lines of Code Deleted**: TBD
- **Net LOC**: TBD
- **Files Modified**: TBD

### Commit Activity
- **Total Commits**: TBD
- **First Commit**: TBD
- **Last Commit**: TBD
- **Contributors**: TBD

### Time Investment
- **Days Elapsed**: TBD
- **Hours Spent (Wall Clock)**: TBD

---

## Task Completion Checklist

- [ ] [SETUP-001] Review Electron BrowserWindow API documentation for frameless window configuration and window control methods
- [ ] [ELECTRON-001] Modify shell/main.js BrowserWindow configuration to add frame: false option for frameless window
- [ ] [ELECTRON-002] Add IPC handler 'minimize-window' in shell/main.js that calls mainWindow.minimize()
- [ ] [ELECTRON-003] Add IPC handler 'maximize-window' in shell/main.js that toggles mainWindow.isMaximized() state (maximize if not maximized, restore if maximized)
- [ ] [ELECTRON-004] Add IPC handler 'close-window' in shell/main.js that calls mainWindow.close()
- [ ] [ELECTRON-005] Add IPC handler 'is-window-maximized' in shell/main.js that returns mainWindow.isMaximized() state
- [ ] [ELECTRON-006] Update shell/preload.js to expose minimizeWindow, maximizeWindow, closeWindow, isWindowMaximized methods via contextBridge to electronAPI
- [ ] [UI-001] Create MenuDropdown.tsx component in frontend/src/components/ui/ with dropdown menu functionality (open/close, keyboard navigation, outside click handling, Escape key to close)
- [ ] [UI-002] Create WindowControls.tsx component in frontend/src/components/ui/ with Minimize, Maximize/Restore, and Close buttons that call Electron IPC methods
- [ ] [UI-003] Create MenuBar.tsx component in frontend/src/components/ with horizontal menu bar layout, File/Settings/Help menu buttons on left, WindowControls on right, and draggable area styling
- [ ] [UI-004] Implement File menu in MenuBar with Exit/Quit menu item that calls electronAPI.closeWindow() in Electron or shows browser message
- [ ] [UI-005] Implement Settings menu in MenuBar (placeholder - shows 'Settings' menu item that can be extended later)
- [ ] [UI-006] Implement Help menu in MenuBar with 'Open All LLMs' action that reads LLM URLs from config and opens each in new window/tab
- [ ] [UI-007] Implement Help menu 'Keyboard Shortcuts' action (placeholder - shows message or opens modal for future implementation)
- [ ] [UI-008] Implement Help menu 'About' action that displays application name, version, and description in modal or alert
- [ ] [UI-009] Add draggable region styling to MenuBar component using CSS -webkit-app-region: drag on menu bar area (excluding buttons and interactive elements)
- [ ] [UI-010] Implement window maximize state tracking in WindowControls component using electronAPI.isWindowMaximized() and updating maximize button icon (Maximize2 vs Square icon from lucide-react)
- [ ] [INTEGRATION-001] Replace Header component content with MenuBar component in frontend/src/components/Header.tsx, or integrate MenuBar into Header
- [ ] [INTEGRATION-002] Ensure MenuBar works in browser environment - hide or disable WindowControls when electronAPI is not available
- [ ] [INTEGRATION-003] Update app/page.tsx and app/layout.tsx to ensure MenuBar is positioned at very top of window (no margin/padding at top)
- [ ] [TEST-001] Test frameless window opens correctly in Electron without OS title bar
- [ ] [TEST-002] Test window controls (minimize, maximize, close) work correctly via IPC
- [ ] [TEST-003] Test menu bar is draggable for window movement
- [ ] [TEST-004] Test maximize button icon updates correctly when window is maximized/restored
- [ ] [TEST-005] Test menu bar works in browser environment (window controls hidden/disabled)
- [ ] [TEST-006] Test File menu Exit and Help menu actions work correctly

---

## Files Created/Modified

- No files listed

---

## Success Criteria

- **TBD**: Window has no title bar, custom menu bar is visible at top
- **TBD**: Clicking minimize minimizes window, maximize toggles maximize/restore, close closes window
- **TBD**: Clicking and dragging menu bar background moves window
- **TBD**: Maximize icon shows when window is normal, Restore icon shows when maximized
- **TBD**: Clicking File > Exit closes the application window
- **TBD**: Clicking Help > Open All LLMs opens each URL from config.llm_urls in new tab/window
- **TBD**: In browser, menu bar displays, window controls are hidden or disabled

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-10
