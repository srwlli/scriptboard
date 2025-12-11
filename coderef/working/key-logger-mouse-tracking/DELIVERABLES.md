# DELIVERABLES: key-logger-mouse-tracking

**Project**: next
**Feature**: key-logger-mouse-tracking
**Workorder**: WO-KEY-LOGGER-MOUSE-TRACKING-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-10

---

## Executive Summary

**Goal**: Enable comprehensive input recording for macro creation that includes mouse interactions and window context, allowing users to record and replay complex multi-step workflows.

**Description**: Enhance the existing key logger to capture mouse clicks with coordinates, track active window focus changes, and provide context for clipboard operations (copy source/paste target).

---

## Implementation Phases

### Phase 1: Mouse Click Capture

**Description**: Add mouse click recording with coordinates

**Estimated Duration**: TBD

**Deliverables**:
- MouseClick/MouseUp event types in EventType enum
- mouse_button, x, y fields in MacroEvent
- Mouse listener integration in KeyLogger class

### Phase 2: Window Tracking

**Description**: Add active window tracking and focus change detection

**Estimated Duration**: TBD

**Deliverables**:
- _get_active_window() helper method
- process_name field in MacroEvent
- WindowFocus events on focus change

### Phase 3: Clipboard Context

**Description**: Associate window context with clipboard operations

**Estimated Duration**: TBD

**Deliverables**:
- source_window field in ClipboardSet events
- Paste target window tracking via Ctrl+V detection

### Phase 4: Schema & Frontend Updates

**Description**: Update schemas and frontend to support new event types

**Estimated Duration**: TBD

**Deliverables**:
- Updated Pydantic schemas
- Updated TypeScript interfaces
- KeyLogPanel showing event type breakdown
- Unit tests passing


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

- [ ] [MOUSE-001] Add MouseClick and MouseUp event types to EventType enum
- [ ] [MOUSE-002] Add mouse_button, x, y fields to MacroEvent dataclass
- [ ] [MOUSE-003] Import pynput.mouse and create mouse listener
- [ ] [MOUSE-004] Implement _on_mouse_click callback
- [ ] [MOUSE-005] Start/stop mouse listener in start_recording/stop_recording
- [ ] [WINDOW-001] Add _get_active_window() helper method using win32gui
- [ ] [WINDOW-002] Add process_name field to MacroEvent dataclass
- [ ] [WINDOW-003] Implement window focus change detection thread
- [ ] [WINDOW-004] Record WindowFocus events on focus change
- [ ] [CLIP-001] Add source_window field to ClipboardSet events
- [ ] [CLIP-002] Track paste target by detecting Ctrl+V and recording active window
- [ ] [SCHEMA-001] Update MacroEventType enum in schemas.py
- [ ] [SCHEMA-002] Update MacroEvent Pydantic model with new fields
- [ ] [FE-001] Update event type interface in api.ts
- [ ] [FE-002] Update KeyLogPanel to show event type breakdown
- [ ] [TEST-001] Write unit tests for mouse click capture
- [ ] [TEST-002] Write unit tests for window tracking

---

## Files Created/Modified

- **backend/tests/test_mouse_tracking.py** - Unit tests for mouse and window tracking
- **backend/key_logger.py** - Add mouse listener, window tracking, new event types
- **backend/schemas.py** - Add MouseClick, WindowFocus event types and fields
- **backend/api.py** - Update imports if needed
- **frontend/src/components/KeyLogPanel.tsx** - Display mouse and window events in status
- **frontend/src/lib/api.ts** - Update event type interfaces

---

## Success Criteria

- Mouse clicks captured with x, y coordinates and button type
- Active window title and process name tracked
- Window focus changes recorded as events
- Clipboard events include source window context
- All existing keyboard/clipboard functionality unchanged

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-10
