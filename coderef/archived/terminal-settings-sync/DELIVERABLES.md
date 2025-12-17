# DELIVERABLES: terminal-settings-sync

**Project**: next
**Feature**: terminal-settings-sync
**Workorder**: WO-TERMINAL-SETTINGS-SYNC-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-16

---

## Executive Summary

**Goal**: Replace manual JSON editing with intuitive visual management of Windows Terminal profiles

**Description**: Visual UI in Scriptboard to manage Windows Terminal project profiles - add/edit/remove projects, set tab colors, configure hotkeys, and manage starting directories. Implemented as both a direct Scriptboard tool AND a reusable MCP server.

---

## Implementation Phases

### Phase 1: Foundation

**Description**: Core utilities and types for settings manipulation

**Estimated Duration**: TBD

**Deliverables**:
- terminal-settings.ts utility with read/parse/backup
- TypeScript interfaces for Windows Terminal schema

### Phase 2: Core Operations

**Description**: CRUD operations for profiles and keybindings

**Estimated Duration**: TBD

**Deliverables**:
- Write settings with validation
- Profile add/update/delete functions
- Keybinding management functions

### Phase 3: Scriptboard UI

**Description**: Visual interface in Scriptboard app

**Estimated Duration**: TBD

**Deliverables**:
- TerminalManager component with full UI
- ProfileCard and ProfileForm components
- Color picker, hotkey capture, directory browser
- Navigation integration

### Phase 4: MCP Server

**Description**: Standalone MCP server for LLM access

**Estimated Duration**: TBD

**Deliverables**:
- terminal-mcp server package
- 5 MCP tools: list, add, update, delete, set_hotkey
- Claude config registration


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

- [ ] [SETUP-001] Create terminal-settings.ts utility for reading/parsing settings.json
- [ ] [SETUP-002] Create TypeScript types for Windows Terminal settings schema
- [ ] [UI-001] Create TerminalManager.tsx component shell with profile list
- [ ] [UI-002] Create ProfileCard component for individual profile display
- [ ] [UI-003] Create ProfileForm component for add/edit functionality
- [ ] [UI-004] Implement color picker with preset project colors
- [ ] [UI-005] Implement hotkey capture input component
- [ ] [UI-006] Implement directory browser/picker
- [ ] [CORE-001] Implement backup functionality before writes
- [ ] [CORE-002] Implement write settings with validation
- [ ] [CORE-003] Implement add/update/delete profile operations
- [ ] [CORE-004] Implement keybinding management (add/update/remove)
- [ ] [MCP-001] Create terminal-mcp server scaffold with package.json
- [ ] [MCP-002] Implement list_profiles MCP tool
- [ ] [MCP-003] Implement add_profile MCP tool
- [ ] [MCP-004] Implement update_profile and delete_profile MCP tools
- [ ] [MCP-005] Implement set_hotkey MCP tool
- [ ] [INT-001] Add Terminal Manager to Scriptboard navigation/routing
- [ ] [INT-002] Register terminal-mcp in Claude config

---

## Files Created/Modified

- **frontend/src/components/tools/TerminalManager.tsx** - Main UI component for terminal profile management
- **frontend/src/components/tools/TerminalManager.css** - Styles for terminal manager UI
- **frontend/src/lib/terminal-settings.ts** - TypeScript utilities for reading/writing settings.json
- **terminal-mcp/src/index.ts** - MCP server entry point
- **terminal-mcp/src/tools.ts** - MCP tool definitions
- **terminal-mcp/src/terminal-settings.ts** - Shared settings manipulation logic
- **terminal-mcp/package.json** - MCP server package configuration
- **frontend/src/app/page.tsx** - TBD
- **frontend/src/components/Sidebar.tsx** - TBD

---

## Success Criteria

- Can list all Windows Terminal profiles in Scriptboard
- Can add new project profile with name, path, color, hotkey
- Can edit existing profile properties
- Can delete profiles
- Can assign custom hotkeys that work in Windows Terminal
- MCP tools work via Claude CLI

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-16
