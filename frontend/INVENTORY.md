# Frontend Inventory

**Location:** `/frontend/src`
**Files:** ~35 TypeScript/TSX files
**Lines:** ~4,500

---

## Components

### Core Components
| File | Purpose |
|------|---------|
| `MenuBar.tsx` | Navigation dropdown + File/Help menus + window controls |
| `ConnectionStatus.tsx` | Backend connection status indicator |
| `ErrorBoundary.tsx` | React error boundary wrapper |
| `PromptingWorkflowStandalone.tsx` | Unified prompt workflow (main dashboard component) |

### Theme System (`theme/`)
| File | Purpose |
|------|---------|
| `ThemeProvider.tsx` | Theme + mode context provider |
| `ThemeSwitcher.tsx` | Light/dark/system mode toggle |
| `useTheme.ts` | Theme hook |
| `themes.ts` | Theme registry and types |
| `theme-script.ts` | Flash prevention script |
| `index.ts` | Barrel export |

### Feature Panels
| File | Purpose |
|------|---------|
| `BatchQueuePanel.tsx` | Batch processing queue display |
| `GitIntegrationPanel.tsx` | Git operations panel |
| `KeyLogPanel.tsx` | Key logger event display |
| `KeymapEditor.tsx` | Keyboard shortcut customization |
| `LoggingConsolePanel.tsx` | Application log viewer |
| `PreviewPanel.tsx` | Content preview panel |
| `ProfileSelector.tsx` | Profile management selector |
| `SessionManagerPanel.tsx` | Session handling panel |
| `UserFeedbackPanel.tsx` | User feedback collection |

### ClassicLayout (1 file)
| File | Purpose |
|------|---------|
| `FavoritesModal.tsx` | Favorites popup with search |

### UI Components (`ui/`)
| File | Purpose |
|------|---------|
| `FooterBar.tsx` | App footer with On Top/Lock Size controls |
| `MenuDropdown.tsx` | Reusable dropdown menu |
| `WindowControls.tsx` | Minimize/Maximize/Close buttons |
| `Drawer.tsx` | Slide-out drawer container |
| `LogDisplay.tsx` | Log entry rendering |
| `SectionButtonRow.tsx` | Horizontal button layout |
| `SectionDivider.tsx` | Visual section divider |
| `StatusLabel.tsx` | Status indicator label |
| `ConfirmModal.tsx` | Confirmation dialog component |
| `index.ts` | Barrel export file |

---

## Hooks (3 files)

| File | Purpose |
|------|---------|
| `useBackendConnection.ts` | Backend health check polling |
| `useRecentFolders.ts` | Recent folders persistence |
| `useSessionRefresh.ts` | Session data polling |

---

## Lib (2 files)

| File | Purpose |
|------|---------|
| `api.ts` | Backend API client functions |
| `hotkeys.ts` | Keyboard shortcut definitions |

---

## Types (1 file)

| File | Purpose |
|------|---------|
| `jest-dom.d.ts` | Jest DOM type definitions |

---

## App Router (5 files)

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with MenuBar + FooterBar |
| `app/page.tsx` | Home page with PromptingWorkflowStandalone |
| `app/test/page.tsx` | Test page for component development |
| `app/settings/page.tsx` | Settings page (theme, connection) |
| `app/staged/page.tsx` | Staged components showcase grid |

---

## Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── test/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── staged/
│       └── page.tsx
├── components/
│   ├── ClassicLayout/
│   │   └── FavoritesModal.tsx
│   ├── theme/
│   │   ├── index.ts
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   ├── useTheme.ts
│   │   ├── themes.ts
│   │   ├── theme-script.ts
│   │   └── README.md
│   ├── ui/
│   │   ├── ConfirmModal.tsx
│   │   ├── Drawer.tsx
│   │   ├── FooterBar.tsx
│   │   ├── index.ts
│   │   ├── LogDisplay.tsx
│   │   ├── MenuDropdown.tsx
│   │   ├── SectionButtonRow.tsx
│   │   ├── SectionDivider.tsx
│   │   ├── StatusLabel.tsx
│   │   └── WindowControls.tsx
│   ├── BatchQueuePanel.tsx
│   ├── ConnectionStatus.tsx
│   ├── ErrorBoundary.tsx
│   ├── GitIntegrationPanel.tsx
│   ├── KeyLogPanel.tsx
│   ├── KeymapEditor.tsx
│   ├── LoggingConsolePanel.tsx
│   ├── MenuBar.tsx
│   ├── PreviewPanel.tsx
│   ├── ProfileSelector.tsx
│   ├── PromptingWorkflowStandalone.tsx
│   ├── SessionManagerPanel.tsx
│   └── UserFeedbackPanel.tsx
├── hooks/
│   ├── useBackendConnection.ts
│   ├── useRecentFolders.ts
│   └── useSessionRefresh.ts
├── lib/
│   ├── api.ts
│   └── hotkeys.ts
├── styles/
│   └── globals.css
└── types/
    └── jest-dom.d.ts
```

---

## Archived Components

The following were moved to `coderef/archived/` after dash-update:

- `DrawerNavigation.tsx` - replaced by MenuBar nav
- `PromptingWorkflow.tsx` - replaced by PromptingWorkflowStandalone
- `useClassicLayout.ts` - no longer used
- `ClassicLayout/PromptSection.tsx`
- `ClassicLayout/AttachmentsSection.tsx`
- `ClassicLayout/ResponsesSection.tsx`
- `ClassicLayout/ManagementSection.tsx`
- `ClassicLayout/ToggleablePreview.tsx`
- `ClassicLayout/FavoritesSection.tsx`
- `ClassicLayout/FavoritesDropdownMockup.tsx`
- `ResponseDiffViewer.tsx`
- `ThemeProvider.tsx` (root) - moved to theme/
- `ThemeToggle.tsx` - replaced by ThemeSwitcher
