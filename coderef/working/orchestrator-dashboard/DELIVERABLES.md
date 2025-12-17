# DELIVERABLES: orchestrator-dashboard

**Project**: next
**Feature**: orchestrator-dashboard
**Workorder**: WO-ORCHESTRATOR-DASHBOARD-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-17

---

## Executive Summary

**Goal**: Build a dynamic Orchestrator Dashboard in Scriptboard to replace static index.html files. Single source of truth for all project/workorder/plan/stub tracking.

**Description**: TBD

---

## Implementation Phases

### Phase 1: MVP Foundation

**Description**: Route, backend setup, Overview tab with stats

**Estimated Duration**: TBD

**Deliverables**:
- /orchestrator route working
- Stats endpoint
- Overview tab with counts

### Phase 2: Projects & Stubs

**Description**: Projects and Stubs tabs (read-only)

**Estimated Duration**: TBD

**Deliverables**:
- Projects table
- Stubs card grid

### Phase 3: Workorders & Plans

**Description**: Remaining tabs with filters

**Estimated Duration**: TBD

**Deliverables**:
- Workorders table
- Plans table
- Nav link


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

- [ ] [SETUP-001] Create /orchestrator route and page.tsx
- [ ] [SETUP-002] Create orchestrator components folder structure
- [ ] [BE-001] Create orchestrator.py router with project paths config
- [ ] [BE-002] Implement GET /orchestrator/stats endpoint
- [ ] [BE-003] Implement GET /orchestrator/projects (parse projects.md)
- [ ] [BE-004] Implement GET /orchestrator/stubs (scan stub.json)
- [ ] [BE-005] Implement GET /orchestrator/workorders (scan communication.json)
- [ ] [BE-006] Implement GET /orchestrator/plans (scan plan.json)
- [ ] [UI-001] Create OrchestratorDashboard.tsx shell with tab state
- [ ] [UI-002] Create OrchestratorTabs.tsx component
- [ ] [UI-003] Create StatsCards.tsx for overview
- [ ] [UI-004] Create OverviewTab.tsx with stats and principle box
- [ ] [UI-005] Create ProjectsTable.tsx
- [ ] [UI-006] Create StubCard.tsx and StubsGrid.tsx
- [ ] [UI-007] Create WorkordersTable.tsx with filters
- [ ] [UI-008] Create PlansTable.tsx with staleness indicator
- [ ] [INT-001] Add navigation link to orchestrator
- [ ] [INT-002] Add API client functions in api.ts

---

## Files Created/Modified

- **frontend/src/components/orchestrator/OrchestratorDashboard.tsx** - Main dashboard component
- **frontend/src/components/orchestrator/OrchestratorTabs.tsx** - Tab navigation
- **frontend/src/components/orchestrator/OverviewTab.tsx** - Stats and quick actions
- **frontend/src/components/orchestrator/ProjectsTable.tsx** - Projects list
- **frontend/src/components/orchestrator/WorkordersTable.tsx** - Workorders list
- **frontend/src/components/orchestrator/PlansTable.tsx** - Plans list
- **frontend/src/components/orchestrator/StubsGrid.tsx** - Stubs card grid
- **frontend/src/components/orchestrator/StubCard.tsx** - Individual stub card
- **frontend/src/components/orchestrator/StatsCards.tsx** - Overview stat cards
- **backend/orchestrator.py** - Backend API router
- **frontend/src/app/orchestrator/page.tsx** - TBD
- **backend/api.py** - TBD

---

## Success Criteria

- No success criteria defined

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-17
