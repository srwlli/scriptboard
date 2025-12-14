# DELIVERABLES: promptbox

**Project**: next
**Feature**: promptbox
**Workorder**: WO-PROMPTBOX-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-14

---

## Executive Summary

**Goal**: Create a distributable standalone .exe that provides prompt management, attachments, responses, and sessions with GitHub-synced prompt storage

**Description**: Standalone Prompt Library App - a lightweight Electron app for managing prompts with GitHub sync, separate from Scriptboard

---

## Implementation Phases

### Phase 1: Project Setup

**Description**: Create repo, initialize project, basic Electron shell

**Estimated Duration**: TBD

**Deliverables**:
- GitHub repo created
- Electron + Vite + React project initialized
- Sample prompts structure
- Basic window management

### Phase 2: Core Prompt Features

**Description**: Prompt library UI, template variables, clipboard, LLM links

**Estimated Duration**: TBD

**Deliverables**:
- Prompt file reader with frontmatter parsing
- PromptLibrary component with search/categories
- PromptEditor with preview
- Template variable expansion
- Copy to clipboard functionality
- LLM quick links

### Phase 3: Full Workflow

**Description**: Attachments, responses, sessions, GitHub sync

**Estimated Duration**: TBD

**Deliverables**:
- AttachmentsPanel with drag-drop
- ResponsesPanel for LLM outputs
- Session save/load
- Git sync (clone, pull, push)
- Sync status indicator

### Phase 4: MCP & Distribution

**Description**: MCP server integration, build optimization, packaging

**Estimated Duration**: TBD

**Deliverables**:
- promptbox-mcp server
- MCP tools for Claude Code
- Optimized Electron build
- Windows installer (.exe)
- Documentation


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

- [ ] [SETUP-001] Create new GitHub repo 'promptbox'
- [ ] [SETUP-002] Initialize Electron + Vite + React project
- [ ] [SETUP-003] Create sample prompts repo structure
- [ ] [SETUP-004] Basic Electron shell with window management
- [ ] [PROMPT-001] Implement prompt file reader (markdown + gray-matter)
- [ ] [PROMPT-002] Create PromptLibrary component (list, categories, search)
- [ ] [PROMPT-003] Create PromptEditor component with preview
- [ ] [PROMPT-004] Implement favorites functionality
- [ ] [TMPL-001] Implement template variable expansion
- [ ] [CLIP-001] Clipboard integration (copy expanded prompt)
- [ ] [LLM-001] LLM quick links (open browser)
- [ ] [ATTACH-001] Create AttachmentsPanel component
- [ ] [ATTACH-002] Implement drag-drop file support
- [ ] [RESP-001] Create ResponsesPanel component
- [ ] [SESS-001] Implement session save/load to JSON
- [ ] [SESS-002] Create SessionManager component
- [ ] [GIT-001] Implement git operations via simple-git
- [ ] [GIT-002] Create GitSync component (status, pull, push)
- [ ] [GIT-003] Auto-sync option (on open/close)
- [ ] [MCP-001] Create promptbox-mcp server
- [ ] [MCP-002] Add MCP tools: list_prompts, get_prompt, search_prompts
- [ ] [BUILD-001] Configure electron-builder for Windows
- [ ] [BUILD-002] Optimize bundle size (tree-shaking)
- [ ] [BUILD-003] Create installer (.exe)
- [ ] [DOC-001] Write README and documentation

---

## Files Created/Modified

- **promptbox/electron/main.js** - Electron main process entry
- **promptbox/electron/preload.js** - IPC bridge to renderer
- **promptbox/electron/prompts.js** - Prompt file operations
- **promptbox/electron/git.js** - Git sync via simple-git
- **promptbox/electron/clipboard.js** - Clipboard access
- **promptbox/src/App.tsx** - Main React app
- **promptbox/src/components/PromptLibrary.tsx** - Browse/search prompts
- **promptbox/src/components/PromptEditor.tsx** - View/edit prompt
- **promptbox/src/components/AttachmentsPanel.tsx** - File attachments
- **promptbox/src/components/ResponsesPanel.tsx** - LLM responses
- **promptbox/src/components/SessionManager.tsx** - Save/load sessions
- **promptbox/src/components/GitSync.tsx** - Sync status/controls
- **promptbox/src/hooks/usePrompts.ts** - Prompt CRUD via IPC
- **promptbox/src/hooks/useGitSync.ts** - Git operations via IPC
- **promptbox/src/hooks/useSession.ts** - Session management
- **promptbox/src/lib/electron.ts** - Electron IPC bindings
- **promptbox/package.json** - Project dependencies
- **promptbox/electron-builder.yml** - Build configuration
- **promptbox/vite.config.ts** - Vite bundler config
- **promptbox-mcp/server.py** - MCP server for Claude Code

---

## Success Criteria

- User can browse, search, and filter prompts by category
- User can copy expanded prompt to clipboard
- User can sync prompts with GitHub (pull/push)
- User can save and restore sessions
- Claude Code can access prompts via MCP

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-14
