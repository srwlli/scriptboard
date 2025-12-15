# Scriptboard - Complete Reference

> Quick reference for all tools, components, and API endpoints.

---

## Frontend Components

### Feature Panels

| Component | File | Description |
|-----------|------|-------------|
| **SystemMonitor** | `components/SystemMonitor.tsx` | CPU, memory, disk monitoring dashboard |
| **FileManager** | `components/FileManager.tsx` | File organization, rename, clean, dupes tool |
| **GitIntegrationPanel** | `components/GitIntegrationPanel.tsx` | Git status and commit interface |
| **SessionManagerPanel** | `components/SessionManagerPanel.tsx` | Save/load session management |
| **KeyLogPanel** | `components/KeyLogPanel.tsx` | Keyboard macro recording |
| **LoggingConsolePanel** | `components/LoggingConsolePanel.tsx` | Application logs viewer |
| **UserFeedbackPanel** | `components/UserFeedbackPanel.tsx` | User feedback collection |
| **SystemStatsPanel** | `components/SystemStatsPanel.tsx` | System statistics display |
| **ProcessListPanel** | `components/ProcessListPanel.tsx` | Basic process list |
| **AppProcessesPanel** | `components/AppProcessesPanel.tsx` | Application processes view |
| **PromptingWorkflowStandalone** | `components/PromptingWorkflowStandalone.tsx` | LLM prompting interface |

### System Monitor Components

| Component | File | Description |
|-----------|------|-------------|
| **ProcessListV2** | `system-monitor/ProcessListV2.tsx` | Enhanced process list with filters |
| **QuickFilters** | `system-monitor/QuickFilters.tsx` | 14 quick filter buttons |
| **ProcessRow** | `system-monitor/ProcessRow.tsx` | Single process row with sparkline |
| **ProcessDetails** | `system-monitor/ProcessDetails.tsx` | Expanded process details |
| **ProcessGroup** | `system-monitor/ProcessGroup.tsx` | Category-grouped processes |
| **NetworkPanel** | `system-monitor/NetworkPanel.tsx` | Network connections & ports |
| **DiskUsagePanel** | `system-monitor/DiskUsagePanel.tsx` | Disk usage analyzer |
| **Sparkline** | `system-monitor/Sparkline.tsx` | Mini SVG line charts |

### FileManager Components

| Component | File | Description |
|-----------|------|-------------|
| **OrganizePanel** | `filemanager/OrganizePanel.tsx` | Sort files by type/date |
| **RenamePanel** | `filemanager/RenamePanel.tsx` | Batch file renaming |
| **CleanPanel** | `filemanager/CleanPanel.tsx` | Delete old/large files |
| **IndexPanel** | `filemanager/IndexPanel.tsx` | File catalog creation |
| **DupesPanel** | `filemanager/DupesPanel.tsx` | Duplicate file finder |
| **UndoPanel** | `filemanager/UndoPanel.tsx` | Operation history & undo |
| **ActionPreviewTable** | `filemanager/ActionPreviewTable.tsx` | Preview table component |
| **FolderPicker** | `filemanager/FolderPicker.tsx` | Folder selection input |
| **ProgressIndicator** | `filemanager/ProgressIndicator.tsx` | Streaming progress display |

### UI Components

| Component | File | Description |
|-----------|------|-------------|
| **CollapsibleCard** | `ui/CollapsibleCard.tsx` | Expandable card container |
| **ConfirmModal** | `ui/ConfirmModal.tsx` | Confirmation dialog |
| **Drawer** | `ui/Drawer.tsx` | Slide-out panel |
| **MenuDropdown** | `ui/MenuDropdown.tsx` | Dropdown menu |
| **FooterBar** | `ui/FooterBar.tsx` | Status footer |
| **StatusLabel** | `ui/StatusLabel.tsx` | Status indicator |
| **LogDisplay** | `ui/LogDisplay.tsx` | Log output display |
| **SectionDivider** | `ui/SectionDivider.tsx` | Section separator |
| **SectionButtonRow** | `ui/SectionButtonRow.tsx` | Button row layout |
| **WindowControls** | `ui/WindowControls.tsx` | Window minimize/maximize/close |

### Theme Components

| Component | File | Description |
|-----------|------|-------------|
| **ThemeProvider** | `theme/ThemeProvider.tsx` | Theme context provider |
| **ThemeSelector** | `theme/ThemeSelector.tsx` | Theme picker UI |
| **ModeSwitcher** | `theme/ModeSwitcher.tsx` | Light/dark mode toggle |

### Other Components

| Component | File | Description |
|-----------|------|-------------|
| **MenuBar** | `components/MenuBar.tsx` | Main application menu |
| **ConnectionStatus** | `components/ConnectionStatus.tsx` | Backend connection indicator |
| **UpdateChecker** | `components/UpdateChecker.tsx` | App update notifications |
| **LoadingSpinner** | `components/LoadingSpinner.tsx` | Loading indicator |
| **ErrorBoundary** | `components/ErrorBoundary.tsx` | Error handling wrapper |
| **ProfileSelector** | `components/ProfileSelector.tsx` | Profile switching UI |
| **ResponseDiffViewer** | `components/ResponseDiffViewer.tsx` | Response comparison view |
| **FavoritesModal** | `ClassicLayout/FavoritesModal.tsx` | Favorites management |

---

## Backend API Endpoints

### Core Session

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| GET | `/session` | Get current session |

### Prompts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/prompt` | Set current prompt |
| DELETE | `/prompt` | Clear prompt |
| GET | `/prompts` | List preloaded prompts |
| POST | `/prompts` | Add preloaded prompt |
| POST | `/prompt/preloaded` | Load preloaded prompt |

### Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attachments/text` | Add text attachment |
| GET | `/attachments` | List attachments |
| POST | `/attachments/folder` | Add folder attachment |
| DELETE | `/attachments` | Clear attachments |

### Responses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/responses` | Add response |
| GET | `/responses` | List responses |
| GET | `/responses/summary` | Get response summary |
| DELETE | `/responses` | Clear responses |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/preview` | Preview formatted output |
| GET | `/preview/full` | Full preview |
| GET | `/export/markdown` | Export as Markdown |
| GET | `/export/json` | Export as JSON |
| GET | `/export/llm/prompt` | Export prompt for LLM |
| GET | `/export/llm/attachments` | Export attachments for LLM |
| GET | `/export/llm/responses` | Export responses for LLM |
| GET | `/export/llm` | Export full LLM format |

### Sessions & Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search sessions |
| GET | `/tokens` | Get token counts |
| POST | `/sessions/save` | Save session |
| POST | `/sessions/load` | Load session |
| GET | `/autosave/status` | Autosave status |
| POST | `/autosave/recover` | Recover autosave |
| GET | `/profiles` | List profiles |
| POST | `/profiles/load` | Load profile |

### Batch & LLM

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/batch/enqueue` | Queue batch job |
| GET | `/batch/jobs` | List batch jobs |
| POST | `/batch/jobs/{job_id}/cancel` | Cancel batch job |
| GET | `/llm/providers` | List LLM providers |
| POST | `/llm/call` | Call LLM API |

### Git Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/git/status` | Get git status |
| POST | `/git/commit` | Create commit |

### Favorites & Config

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/config` | Get configuration |
| POST | `/favorites` | Add favorite |
| DELETE | `/favorites/{index}` | Remove favorite |

### Macros

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/macros/record/start` | Start recording |
| POST | `/macros/record/stop` | Stop recording |
| GET | `/macros/record/stream` | Stream recording events |
| POST | `/macros/save` | Save macro |

### System Monitor

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/system/stats` | System CPU/memory stats |
| GET | `/system/processes` | Basic process list |
| GET | `/system/processes/app` | Application processes |
| GET | `/system/processes/detailed` | Detailed process info with categories |
| GET | `/system/processes/{pid}/details` | Single process details |
| POST | `/system/processes/kill` | Kill process |
| GET | `/system/protected-processes` | List protected processes |
| GET | `/system/network/connections` | Network connections |
| GET | `/system/network/listening` | Listening ports |
| GET | `/system/network/pids-with-connections` | PIDs with network activity |
| GET | `/system/disk/usage` | Disk partition usage |
| GET | `/system/disk/largest` | Largest folders scan |
| GET | `/system/startup-apps` | Startup applications |

### FileManager

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/fileman/organize` | Organize files by type/date |
| POST | `/fileman/rename` | Batch rename files |
| POST | `/fileman/clean` | Clean old/large files |
| POST | `/fileman/index` | Index files (SSE stream) |
| POST | `/fileman/dupes` | Find duplicates (SSE stream) |
| GET | `/fileman/history` | Get operation history |
| POST | `/fileman/undo` | Undo operation |

---

## Quick Filters (System Monitor)

| Filter | Description |
|--------|-------------|
| `all` | Show all processes |
| `apps` | Regular applications |
| `browsers` | Web browsers |
| `dev` | Development tools |
| `system` | System processes |
| `media` | Media players |
| `communication` | Chat/communication apps |
| `security` | Security software |
| `high_cpu` | High CPU usage (>20%) |
| `high_memory` | High memory (>500MB or >5%) |
| `network` | Processes with network connections |
| `safe_to_kill` | Safe to terminate (score >70) |
| `startup` | Startup applications |
| `recent` | Recently started |

---

## Detailed Documentation

- **System Monitor Guide**: `coderef/docs/SYSTEM-MONITOR-GUIDE.md`
- **FileManager Guide**: `coderef/docs/FILEMANAGER-GUIDE.md`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| System APIs | psutil, winreg |
| Desktop | Electron |

---

*Last updated: December 2024*
