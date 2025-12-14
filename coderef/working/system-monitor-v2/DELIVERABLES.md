# System Monitor v2 - Deliverables

**Workorder ID**: WO-SYSMON-001
**Status**: Not Started
**Estimated Effort**: 4-6 hours (11 total across 3 phases)

---

## Phase 1: Backend Enhancements (3.5h)

### Tasks
- [ ] CAT-001: Create process_categories.py with category mappings and descriptions
- [ ] API-001: Add /system/processes/detailed endpoint with full process info
- [ ] API-002: Add process tree endpoint with parent/child relationships
- [ ] API-003: Add resource history tracking in backend

### Deliverables
- `backend/process_categories.py` - Category mappings, icons, descriptions
- `/system/processes/detailed` endpoint - Full process details
- Resource history tracking - CPU/memory over last 60 samples

### Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| LOC Added | TBD | - |
| Files Created | 1 | - |
| Files Modified | 1 | - |
| Time Spent | 3.5h | - |

---

## Phase 2: UI Components (3.5h)

### Tasks
- [ ] UI-001: Create Sparkline component for mini charts
- [ ] UI-002: Create ProcessRow component with expand/collapse
- [ ] UI-003: Create ProcessDetails component for expanded view
- [ ] UI-004: Create QuickFilters component with filter buttons
- [ ] UI-005: Create ProcessGroup component for category sections

### Deliverables
- `Sparkline.tsx` - Mini chart for resource history
- `ProcessRow.tsx` - Expandable row with icon and category
- `ProcessDetails.tsx` - Expanded details panel
- `QuickFilters.tsx` - Filter button bar
- `ProcessGroup.tsx` - Collapsible category sections

### Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| LOC Added | TBD | - |
| Files Created | 5 | - |
| Time Spent | 3.5h | - |

---

## Phase 3: Integration & Polish (4h)

### Tasks
- [ ] UI-006: Redesign ProcessListPanel with new components
- [ ] UI-007: Update SystemStatsPanel with compact overview mode
- [ ] HOOK-001: Update useSystemMonitor hook with history and detailed fetch
- [ ] INT-001: Integrate all components in SystemMonitor.tsx
- [ ] TEST-001: Test and refine UX

### Deliverables
- Redesigned `ProcessListPanel.tsx`
- Compact `SystemStatsPanel.tsx`
- Updated `useSystemMonitor.ts` hook
- Integrated `SystemMonitor.tsx` v2

### Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| LOC Modified | TBD | - |
| Files Modified | 4 | - |
| Time Spent | 4h | - |

---

## Success Criteria

### Functional
- [ ] User can identify process category at a glance via icons
- [ ] User can expand any process to see full details
- [ ] User can see CPU/memory history as sparkline
- [ ] User can filter by category with one click
- [ ] User can collapse/expand category groups

### Performance
- [ ] Process list refresh under 500ms
- [ ] Expand details under 200ms
- [ ] No memory leaks from history tracking

### UX
- [ ] Cleaner visual hierarchy than v1
- [ ] Intuitive expand/collapse interaction
- [ ] Quick filters reduce cognitive load

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `backend/process_categories.py` | Category mappings and descriptions |
| `frontend/src/components/Sparkline.tsx` | Mini chart component |
| `frontend/src/components/ProcessRow.tsx` | Expandable row |
| `frontend/src/components/ProcessDetails.tsx` | Expanded details |
| `frontend/src/components/QuickFilters.tsx` | Filter buttons |
| `frontend/src/components/ProcessGroup.tsx` | Category sections |

### Modified Files
| File | Changes |
|------|---------|
| `backend/api.py` | Add detailed endpoint, history tracking |
| `frontend/src/components/ProcessListPanel.tsx` | Complete redesign |
| `frontend/src/components/SystemStatsPanel.tsx` | Compact mode |
| `frontend/src/components/SystemMonitor.tsx` | Integration |
| `frontend/src/hooks/useSystemMonitor.ts` | History, detailed fetch |
| `frontend/src/lib/api.ts` | New types and endpoints |
