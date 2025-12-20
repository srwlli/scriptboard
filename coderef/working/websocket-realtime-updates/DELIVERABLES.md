# DELIVERABLES: websocket-realtime-updates

**Project**: next
**Feature**: websocket-realtime-updates
**Workorder**: WO-WEBSOCKET-REALTIME-UPDATES-001
**Status**: 🚧 Not Started
**Generated**: 2025-12-20

---

## Executive Summary

**Goal**: Add WebSocket-based real-time updates to the Orchestrator Dashboard to eliminate manual refresh. File watchers monitor all tracked projects (coderef/working/, coderef/archived/, coderef/stubs/) and broadcast events to connected clients via WebSocket.

**Description**: TBD

---

## Implementation Phases

### Phase 1: Backend WebSocket Infrastructure

**Description**: Set up WebSocket connection management and endpoint in FastAPI backend

**Estimated Duration**: TBD

**Deliverables**:
- backend/websocket_manager.py with connection pool and broadcast function
- WebSocket endpoint at /orchestrator/ws in backend/orchestrator.py
- Heartbeat ping/pong implementation (30s interval)

### Phase 2: File System Monitoring

**Description**: Implement watchdog-based file watcher with debouncing and event broadcasting

**Estimated Duration**: TBD

**Deliverables**:
- watchdog dependency added to requirements.txt
- backend/file_watcher.py with FileSystemEventHandler
- Debouncing logic (500ms batching)
- Integration with websocket_manager for event broadcasting
- Lifecycle hooks in main.py (startup/shutdown events)

### Phase 3: Frontend WebSocket Integration

**Description**: Create React hook for WebSocket connection with auto-reconnect logic

**Estimated Duration**: TBD

**Deliverables**:
- frontend/src/hooks/useOrchestratorWebSocket.ts
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Connection status tracking (connecting, connected, disconnected)
- Event callback system for plan/stub/workorder events

### Phase 4: Dashboard UI Integration & Build

**Description**: Integrate WebSocket hook into dashboard and all tabs, add connection status UI, rebuild and package

**Estimated Duration**: TBD

**Deliverables**:
- OrchestratorDashboard.tsx with WebSocket integration
- Connection status indicator (green/yellow/red dot)
- Toast notifications for disconnect/reconnect
- All tabs (Plans, Stubs, Workorders, Projects) with event-driven reloads
- Rebuilt backend executable with watchdog
- Rebuilt frontend bundle with WebSocket code
- New installer package


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

- [ ] [WSOCK-001] Create websocket_manager.py with connection pool and broadcast function
- [ ] [WSOCK-002] Add WebSocket endpoint /orchestrator/ws to orchestrator.py
- [ ] [WSOCK-003] Add heartbeat ping/pong to WebSocket endpoint (30s interval)
- [ ] [WATCH-001] Add watchdog to requirements.txt
- [ ] [WATCH-002] Create file_watcher.py with watchdog FileSystemEventHandler
- [ ] [WATCH-003] Implement debouncing logic (500ms) in file_watcher.py
- [ ] [WATCH-004] Integrate file_watcher with websocket_manager to broadcast events
- [ ] [LIFECYCLE-001] Add startup event to main.py to initialize file watcher
- [ ] [LIFECYCLE-002] Add shutdown event to main.py to stop file watcher gracefully
- [ ] [HOOK-001] Create useOrchestratorWebSocket.ts hook with connection management
- [ ] [HOOK-002] Implement auto-reconnect with exponential backoff in WebSocket hook
- [ ] [HOOK-003] Add connection status tracking (connecting, connected, disconnected) to hook
- [ ] [UI-001] Integrate useOrchestratorWebSocket hook into OrchestratorDashboard.tsx
- [ ] [UI-002] Add connection status indicator (green/yellow/red dot) to dashboard header
- [ ] [UI-003] Add toast notifications for disconnect/reconnect events
- [ ] [UI-004] Update PlansTab.tsx to accept onReload prop and reload on plan events
- [ ] [UI-005] Update StubsTab.tsx to accept onReload prop and reload on stub events
- [ ] [UI-006] Update WorkordersTab.tsx to accept onReload prop and reload on workorder events
- [ ] [UI-007] Update ProjectsTab.tsx to accept onReload prop and reload on project events
- [ ] [BUILD-001] Rebuild backend with PyInstaller including new dependencies
- [ ] [BUILD-002] Rebuild frontend with Next.js including WebSocket integration
- [ ] [BUILD-003] Package new installer with electron-builder

---

## Files Created/Modified

- **backend/websocket_manager.py** - Manage WebSocket connections and broadcast events
- **backend/file_watcher.py** - Monitor file system changes across all projects using watchdog
- **frontend/src/hooks/useOrchestratorWebSocket.ts** - React hook for WebSocket connection with auto-reconnect
- **backend/requirements.txt** - Add watchdog==4.0.0
- **backend/orchestrator.py** - Add /orchestrator/ws WebSocket route, import websocket_manager
- **backend/main.py** - Add startup event to initialize file watcher, shutdown event to stop watcher
- **frontend/src/components/orchestrator/OrchestratorDashboard.tsx** - Add useOrchestratorWebSocket hook, handle events, show connection status
- **frontend/src/components/orchestrator/PlansTab.tsx** - Accept onReload prop, reload plans when plan_added/updated/deleted events received
- **frontend/src/components/orchestrator/StubsTab.tsx** - Accept onReload prop, reload stubs when stub_added/updated/deleted events received
- **frontend/src/components/orchestrator/WorkordersTab.tsx** - Accept onReload prop, reload workorders when workorder_added event received
- **frontend/src/components/orchestrator/ProjectsTab.tsx** - Accept onReload prop, reload projects when project_added/removed events received

---

## Success Criteria

- WebSocket endpoint /orchestrator/ws accepts connections and maintains heartbeat
- File watcher monitors all projects in projects.json for plan.json, stub.json, workorder-log.txt changes
- Events broadcast within 500ms of file changes
- Frontend auto-reconnects with exponential backoff (max 30s)
- Dashboard tabs auto-reload on relevant events (plan_added, stub_updated, etc.)
- Connection status indicator shows accurate state (green/yellow/red)
- Manual refresh button remains functional as backup

---

## Notes

*This deliverables report was automatically generated from plan.json.*
*Use `/update-deliverables` to populate metrics from git history after implementation.*

**Last Updated**: 2025-12-20
