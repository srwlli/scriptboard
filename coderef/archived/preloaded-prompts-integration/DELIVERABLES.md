# DELIVERABLES: preloaded-prompts-integration

**Project**: next
**Feature**: preloaded-prompts-integration
**Workorder**: WO-PRELOADED-PROMPTS-INTEGRATION-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-10

---

## Executive Summary

**Goal**: Enable users to access preloaded prompts (Code Review, Synthesize, Research, Consolidate, etc.) from the new web-based UI, matching the functionality of the original Tkinter "Prompts" menu.

**Description**: Integrate preloaded prompts from settings.py into the new Next.js/Electron build. Add API endpoint to list available prompts, add UI component to access prompts (similar to original "Prompts" menu), and ensure prompts from original settings.py are available in the new system.

---

## Implementation Phases

### Phase 1: Backend API Setup

**Description**: Add API endpoint to list preloaded prompts and sync settings

**Estimated Duration**: TBD

**Deliverables**:
- GET /prompts endpoint implemented
- Schemas added for prompt responses
- Settings synchronized

### Phase 2: Frontend Integration

**Description**: Add frontend API method and UI component for prompt selection

**Estimated Duration**: TBD

**Deliverables**:
- getPreloadedPrompts() method in api.ts
- Prompt selection dropdown in PromptSection

### Phase 3: Testing & Validation

**Description**: Write tests and verify functionality

**Estimated Duration**: TBD

**Deliverables**:
- Unit tests for API endpoint
- Unit tests for UI component
- Integration tests
- Manual testing in Electron and browser


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

- [ ] [API-001] Add PreloadedPromptItem and PreloadedPromptsResponse schemas to schemas.py
- [ ] [API-002] Add GET /prompts endpoint to api.py that returns list of preloaded prompts
- [ ] [SYNC-001] Compare and merge PRELOADED_PROMPTS from original settings.py into backend/settings.py
- [ ] [FRONTEND-001] Add getPreloadedPrompts() method to frontend api.ts
- [ ] [UI-001] Add dropdown/select component to PromptSection for preloaded prompts
- [ ] [TEST-001] Test prompt loading from preloaded prompts and verify source tracking

---

## Files Created/Modified

- **frontend/src/components/ui/PromptSelect.tsx** - Reusable dropdown component for selecting preloaded prompts (optional)
- **backend/api.py** - TBD
- **backend/schemas.py** - TBD
- **backend/settings.py** - TBD
- **frontend/src/lib/api.ts** - TBD
- **frontend/src/components/ClassicLayout/PromptSection.tsx** - TBD

---

## Success Criteria

- GET /prompts endpoint returns all available preloaded prompts
- PromptSection displays dropdown with all available prompts
- Selecting a prompt loads it and sets prompt_source to "preloaded:X"
- All prompts from original settings.py are accessible

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-10
