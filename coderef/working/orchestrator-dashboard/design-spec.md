# Orchestrator Dashboard - Design Spec

> WO-ORCHESTRATOR-DASHBOARD-001
> Target: Scriptboard Frontend
> Source: assistant/index.html standardization
> Updated: 2025-12-17

---

## Current Data (as of 2025-12-17)

| Metric | Count | Source |
|--------|-------|--------|
| Projects | 9 | projects.md |
| Stubs | 38 | assistant/coderef/working/*/stub.json |
| Active WOs | 10 | workorders.json |
| Completed WOs | 1 | workorders.json |
| Working Features | 35 | All project coderef/working/ |
| Archived Features | 109 | All project coderef/archived/ |

**Reference:** `assistant/coderef-index.md` - Full scan of all project coderef folders

---

## Goal

Replace static `index.html` files across projects with a dynamic Orchestrator Dashboard in Scriptboard. Single source of truth for all project/workorder/plan/stub tracking.

---

## Route

```
/dashboard/orchestrator
```

Or add as a new top-level page: `/orchestrator`

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator Dashboard                        [Refresh]    │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Projects] [Workorders] [Plans] [Stubs]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 9       │ │ 38      │ │ 10      │ │ 144     │           │
│  │Projects │ │ Stubs   │ │ Active  │ │ Features│           │
│  └─────────┘ └─────────┘ │ WOs     │ └─────────┘           │
│                          └─────────┘                        │
│                                                             │
│  [Tab Content Area]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tab Specifications

### 1. Overview Tab (Default)

**Purpose:** At-a-glance status, principle reminder, quick actions

**Content:**
- Stats cards (Projects, Stubs, Active WOs, Plans)
- Core Principle box: "Do not execute work in other projects. Identify, delegate, collect."
- Recent activity feed (last 5 status changes)
- Quick actions: New Stub, View Stale Plans, Pending WOs

**Data Source:**
- Aggregate counts from other tabs
- Recent timestamps from communication.json files

---

### 2. Projects Tab

**Purpose:** All tracked projects with status and links

**Table Columns:**
| Column | Source |
|--------|--------|
| ID | STUB-XXX from projects.md |
| Name | Project name |
| Description | Short description |
| Path | Local path (clickable to open) |
| Active WOs | Count from communication.json |
| Active Plans | Count from coderef/working/*/plan.json |
| Deploy | Link to deployed app |

**Data Source:**
- `C:\Users\willh\Desktop\assistant\projects.md` (parse Active Projects table)
- Scan each project's `coderef/working/` for counts

**Actions:**
- Click row to expand details
- Open in terminal (if Electron)
- View project's plans/WOs filtered

---

### 3. Workorders Tab

**Purpose:** Track all active workorders across projects

**Table Columns:**
| Column | Source |
|--------|--------|
| WO-ID | From communication.json |
| Feature | feature_name |
| Project | Target project |
| Status | handoff.status |
| Type | delegated / audit / internal |
| Last Update | Latest communication_log timestamp |
| Next Action | From communication.json |

**Filters:**
- By project (dropdown)
- By status (pending, approved, implementing, complete)
- By type (delegated, audit, internal)

**Data Source:**
- Scan all project `coderef/working/*/communication.json`
- Scan `coderef/features/*/communication.json`

**Actions:**
- Click to view full communication.json
- Mark complete
- Add log entry

---

### 4. Plans Tab

**Purpose:** All plan.json files across all projects

**Table Columns:**
| Column | Source |
|--------|--------|
| Feature | feature_name from plan.json |
| Project | Which project |
| Location | working / archived |
| Status | Plan status field |
| Phase | Current phase |
| Tasks | X/Y completed |
| Last Modified | File timestamp |
| Stale | Yes if >7 days old |

**Filters:**
- By project
- By location (working/archived)
- Stale only toggle
- Has WO-ID toggle

**Data Source:**
- Scan all projects:
  - `coderef/working/*/plan.json`
  - `coderef/archived/*/plan.json`

**Actions:**
- Click to view plan details
- Archive (move working → archived)
- Create WO from plan

**Visual:**
- Highlight stale plans (yellow/orange)
- Show completion progress bar

---

### 5. Stubs Tab

**Purpose:** Ideas captured but not yet promoted to workorders

**Card Grid Layout:**
```
┌──────────────────────┐
│ STUB-037        high │
│ file-front-matter    │
│ Front matter for...  │
│ Tags: workflow, orch │
│ Created: 2025-12-16  │
└──────────────────────┘
```

**Card Fields:**
- STUB-ID
- Feature name
- Description (truncated)
- Tags (chips)
- Priority (badge color)
- Category
- Created date

**Filters:**
- By priority (high/medium/low)
- By category (feature/fix/improvement/idea/refactor)
- By tag (multi-select)
- Search by name/description

**Data Source:**
- `C:\Users\willh\Desktop\assistant\coderef\working\*/stub.json`

**Actions:**
- Click to view full stub
- Promote to WO (creates communication.json)
- Edit priority/tags
- Delete stub

---

## Data Fetching Strategy

### Option A: File System Scanning (Recommended for MVP)

Backend endpoints:
```
GET /api/orchestrator/projects     → Parse projects.md
GET /api/orchestrator/workorders   → Scan communication.json files
GET /api/orchestrator/plans        → Scan plan.json files
GET /api/orchestrator/stubs        → Scan stub.json files
GET /api/orchestrator/stats        → Aggregate counts
```

### Option B: File Indexer Integration

Use existing Scriptboard file indexer to:
1. Register patterns: `**/coderef/**/communication.json`, `**/stub.json`, `**/plan.json`
2. Index on startup + watch for changes
3. Query indexed data

---

## Project Paths to Scan

```python
PROJECT_PATHS = [
    "C:/Users/willh/Desktop/clipboard_compannion/next",      # scriptboard
    "C:/Users/willh/Desktop/scrapper",                        # scrapper
    "C:/Users/willh/Desktop/latest-sim/gridiron-franchise",  # gridiron
    "C:/Users/willh/Desktop/projects/noted",                  # noted
    "C:/Users/willh/Desktop/app_documents",                   # app-documents
    "C:/Users/willh/Desktop/projects/coderef-system",        # coderef-system
    "C:/Users/willh/Desktop/Business-Dash/latest-app",       # multi-tenant
]

ORCHESTRATOR_PATH = "C:/Users/willh/Desktop/assistant"
```

---

## UI Components Needed

### New Components
- `OrchestratorDashboard.tsx` - Main page component
- `OrchestratorTabs.tsx` - Tab navigation
- `ProjectsTable.tsx` - Projects tab content
- `WorkordersTable.tsx` - Workorders tab content
- `PlansTable.tsx` - Plans tab content
- `StubsGrid.tsx` - Stubs tab content (card grid)
- `StatsCards.tsx` - Overview stat cards
- `StubCard.tsx` - Individual stub card

### Reuse Existing
- `CollapsibleCard` - For detail views
- `StatusLabel` - For status badges
- Table components from existing patterns

---

## Styling

Match existing Scriptboard theme:
- Use existing color palette
- Consistent with PromptingWorkflowStandalone
- Dark mode support

Priority badge colors:
```css
.priority-high { background: #fef2f2; color: #dc2626; }
.priority-medium { background: #fefce8; color: #ca8a04; }
.priority-low { background: #f0fdf4; color: #16a34a; }
```

Status badge colors:
```css
.status-pending { background: #fef3c7; color: #92400e; }
.status-approved { background: #d1fae5; color: #065f46; }
.status-implementing { background: #dbeafe; color: #1e40af; }
.status-complete { background: #d1fae5; color: #065f46; }
```

---

## Backend Endpoints (FastAPI)

```python
# orchestrator.py router

@router.get("/orchestrator/projects")
async def get_projects():
    """Parse projects.md and return project list"""

@router.get("/orchestrator/workorders")
async def get_workorders():
    """Scan all communication.json files"""

@router.get("/orchestrator/plans")
async def get_plans(project: str = None, location: str = None, stale: bool = False):
    """Scan all plan.json files with filters"""

@router.get("/orchestrator/stubs")
async def get_stubs(priority: str = None, category: str = None, tag: str = None):
    """Scan all stub.json files with filters"""

@router.get("/orchestrator/stats")
async def get_stats():
    """Return aggregate counts"""

@router.post("/orchestrator/stubs/{stub_id}/promote")
async def promote_stub(stub_id: str, target_project: str):
    """Create communication.json from stub"""
```

---

## Phase 1 MVP

1. Create `/dashboard/orchestrator` route
2. Implement Overview tab with stats
3. Implement Projects tab (read-only)
4. Implement Stubs tab (read-only)

## Phase 2

5. Implement Workorders tab
6. Implement Plans tab
7. Add filters and search

## Phase 3

8. Add actions (promote stub, archive plan)
9. Real-time updates (file watching)
10. Deprecate static index.html files

---

## Success Criteria

- [ ] Dashboard loads with accurate counts
- [ ] All 9 projects visible
- [ ] All stubs visible with correct data
- [ ] Workorders show current status
- [ ] Plans show completion progress
- [ ] Filters work correctly
- [ ] Replaces need for assistant/index.html
