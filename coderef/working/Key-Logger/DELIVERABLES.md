# DELIVERABLES: Key-Logger

**Project**: next
**Feature**: Key-Logger
**Workorder**: WO-KEY-LOGGER-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-10

---

## Executive Summary

**Goal**: Enable users to automatically capture sequences of keyboard and clipboard actions as reusable macros that reflect real user behavior, allowing for easy replay or scripting.

**Description**: Key logging feature that records keyboard actions and clipboard activity to capture sequences of actions that can be saved as reusable macros. Windows-first implementation with minimal flow: Start → Track → Stop → Name → Save.

---

## Implementation Phases

### Phase 1: Backend Recorder Module

**Description**: Implement the core key logger module with keyboard hooks and clipboard monitoring

**Estimated Duration**: 6 hours

**Deliverables**:
- backend/key_logger.py with KeyLogger class
- Windows keyboard hook implementation
- Clipboard monitoring with fallback
- Event timestamp tracking

### Phase 2: Backend API Endpoints

**Description**: Add FastAPI endpoints and data models for recording control and macro storage

**Estimated Duration**: 5.5 hours

**Deliverables**:
- Pydantic models in schemas.py
- POST /macros/record/start endpoint
- POST /macros/record/stop endpoint
- POST /macros/save endpoint
- Macro storage directory setup

### Phase 3: Frontend Integration

**Description**: Create KeyLogPanel component and integrate with API client and modern page

**Estimated Duration**: 5.5 hours

**Deliverables**:
- ApiClient methods for macro endpoints
- KeyLogPanel React component
- Integration on new-page
- Complete UI flow

### Phase 4: Testing and Validation

**Description**: Write unit tests, integration tests, and perform manual E2E validation

**Estimated Duration**: 7.5 hours

**Deliverables**:
- Unit tests for recorder module
- Integration tests for API endpoints
- Manual E2E test results
- Test coverage report


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

- [ ] [SETUP-001] Add pynput and pyperclip dependencies to backend/requirements.txt
- [ ] [REC-001] Create backend/key_logger.py with KeyLogger class and Windows keyboard hook setup
- [ ] [REC-002] Implement clipboard monitoring with Win32 events and polling fallback in key_logger.py
- [ ] [REC-003] Add timestamp tracking and ts_delta_ms computation with idle gap clamping
- [ ] [REC-004] Define event data structures (KeyDown, KeyUp, ClipboardSet, Delay) in key_logger.py
- [ ] [SCHEMA-001] Add MacroEvent, Macro, MacroSavePayload, MacroRecordResponse Pydantic models to backend/schemas.py
- [ ] [API-001] Add POST /macros/record/start endpoint to backend/api.py
- [ ] [API-002] Add POST /macros/record/stop endpoint to backend/api.py
- [ ] [API-003] Add POST /macros/save endpoint with name validation and atomic JSON write to backend/api.py
- [ ] [API-004] Create get_macros_dir() helper function and ensure directory exists in backend/api.py
- [ ] [CLIENT-001] Add startRecording(), stopRecording(), saveMacro() methods to frontend/src/lib/api.ts
- [ ] [UI-001] Create frontend/src/components/KeyLogPanel.tsx component with Record/Stop/Save buttons
- [ ] [UI-002] Add status display (Idle/Recording) and name input field to KeyLogPanel
- [ ] [UI-003] Integrate KeyLogPanel component inline on frontend/app/new-page/page.tsx
- [ ] [TEST-001] Write unit tests for keyboard event capture in backend/tests/test_key_logger.py
- [ ] [TEST-002] Write unit tests for clipboard monitoring in backend/tests/test_key_logger.py
- [ ] [TEST-003] Write integration tests for API endpoints (start/stop/save) in backend/tests/test_macro_api.py
- [ ] [TEST-004] Write tests for macro storage and JSON serialization in backend/tests/test_macro_api.py
- [ ] [E2E-001] Manual E2E testing: verify UI flow (Start → Track → Stop → Name → Save) and file saved

---

## Files Created/Modified

- **backend/key_logger.py** - Recorder module with keyboard hooks and clipboard monitoring for Windows
- **backend/schemas.py** - Add MacroEvent, Macro, and macro-related Pydantic models (modify existing file)
- **backend/api.py** - Add FastAPI endpoints for recording control and macro storage (modify existing file)
- **frontend/src/components/KeyLogPanel.tsx** - Frontend component with Record/Stop/Save buttons for macro recording
- **frontend/src/lib/api.ts** - Add ApiClient methods for macro endpoints (modify existing file)
- **frontend/app/new-page/page.tsx** - Integrate KeyLogPanel component inline on modern page (modify existing file)
- **backend/tests/test_key_logger.py** - Unit tests for recorder module
- **backend/tests/test_macro_api.py** - Integration tests for macro API endpoints
- **backend/schemas.py** - TBD
- **backend/api.py** - TBD
- **frontend/src/lib/api.ts** - TBD
- **frontend/app/new-page/page.tsx** - TBD
- **backend/requirements.txt** - TBD

---

## Success Criteria

- No success criteria defined

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-10
