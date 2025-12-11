# DELIVERABLES: add-new-prompt

**Project**: next
**Feature**: add-new-prompt
**Workorder**: WO-ADD-NEW-PROMPT-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-10

---

## Executive Summary

**Goal**: Enable users to easily add custom preloaded prompts through a simple UI, with validation to ensure prompt quality and prevent duplicates.

**Description**: Wire up the "Add" button in PromptSection to allow users to create new preloaded prompts. Implement a user-friendly entry form/modal with validation, and save new prompts to the backend settings or config system.

---

## Implementation Phases

### Phase 1: Backend API & Config

**Description**: Add API endpoint and config persistence for custom prompts

**Estimated Duration**: TBD

**Deliverables**:
- AddPromptPayload schema
- POST /prompts endpoint
- Updated GET /prompts to merge defaults with custom
- Config system supports custom_prompts

### Phase 2: Frontend Modal & Form

**Description**: Create modal component with form and validation

**Estimated Duration**: TBD

**Deliverables**:
- AddPromptModal component
- Form with key, label, text fields
- Validation logic
- Error handling

### Phase 3: Integration & Testing

**Description**: Wire up Add button, integrate with API, and test

**Estimated Duration**: TBD

**Deliverables**:
- Add button opens modal
- Save functionality works
- Prompt list refreshes after save
- New prompts persist across restarts


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

- [ ] [SCHEMA-001] Add AddPromptPayload schema to schemas.py with key, label, and text fields
- [ ] [BACKEND-001] Add POST /prompts endpoint to api.py that validates and saves new prompts
- [ ] [BACKEND-002] Update GET /prompts endpoint to merge default prompts with custom prompts from config
- [ ] [BACKEND-003] Update load_config() to handle custom_prompts field
- [ ] [FRONTEND-001] Create AddPromptModal component with form fields
- [ ] [FRONTEND-002] Add validation logic to AddPromptModal
- [ ] [FRONTEND-003] Wire up Add button in PromptSection to open modal
- [ ] [FRONTEND-004] Add addPreloadedPrompt() method to api.ts and handle save
- [ ] [FRONTEND-005] Update PromptSection to refresh prompts after adding

---

## Files Created/Modified

- **frontend/src/components/ClassicLayout/AddPromptModal.tsx** - Reusable modal component for adding new prompts with form and validation
- **backend/schemas.py** - TBD
- **backend/api.py** - TBD
- **frontend/src/lib/api.ts** - TBD
- **frontend/src/components/ClassicLayout/PromptSection.tsx** - TBD

---

## Success Criteria

- User can click Add button to open modal
- User can enter key, label, and text in form
- Validation prevents invalid inputs
- New prompt is saved to config.json
- New prompt appears in prompt list immediately
- New prompt persists across app restarts
- Custom prompts merge with default prompts

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-10
