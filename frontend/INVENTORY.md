# Frontend Inventory

**Location:** `/frontend/src`
**Files:** 44 TypeScript/TSX files
**Lines:** ~5,700

---

## Components (27 files)

### Core Components
| File | Purpose |
|------|---------|
| `MenuBar.tsx` | Navigation dropdown + File/Help menus + window controls |
| `DrawerNavigation.tsx` | Slide-out navigation (legacy, replaced by MenuBar nav) |
| `ConnectionStatus.tsx` | Backend connection status indicator |
| `ErrorBoundary.tsx` | React error boundary wrapper |
| `ThemeProvider.tsx` | Dark/light theme context provider |
| `ThemeToggle.tsx` | Theme switch button |

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
| `ResponseDiffViewer.tsx` | Response comparison viewer |
| `SessionManagerPanel.tsx` | Session handling panel |
| `UserFeedbackPanel.tsx` | User feedback collection |

### ClassicLayout (8 files)
| File | Purpose |
|------|---------|
| `PromptSection.tsx` | Prompt input and management |
| `AttachmentsSection.tsx` | File attachment handling |
| `ResponsesSection.tsx` | LLM response display |
| `ManagementSection.tsx` | Session/profile management |
| `FavoritesModal.tsx` | Favorites popup with search |
| `FavoritesSection.tsx` | Favorites list display |
| `FavoritesDropdownMockup.tsx` | Mockup component |
| `ToggleablePreview.tsx` | Expandable preview section |

### UI Components (9 files)
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
| `index.ts` | Barrel export file |

---

## Hooks (4 files)

| File | Purpose |
|------|---------|
| `useClassicLayout.ts` | Classic layout state management |
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

## App Router (4 files)

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with MenuBar + FooterBar |
| `app/page.tsx` | Home page with classic layout sections |
| `app/settings/page.tsx` | Settings page (theme, connection) |
| `app/view-components/page.tsx` | Component showcase grid |

---

## Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── view-components/
│       └── page.tsx
├── components/
│   ├── ClassicLayout/
│   │   ├── AttachmentsSection.tsx
│   │   ├── FavoritesDropdownMockup.tsx
│   │   ├── FavoritesModal.tsx
│   │   ├── FavoritesSection.tsx
│   │   ├── ManagementSection.tsx
│   │   ├── PromptSection.tsx
│   │   ├── ResponsesSection.tsx
│   │   └── ToggleablePreview.tsx
│   ├── ui/
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
│   ├── DrawerNavigation.tsx
│   ├── ErrorBoundary.tsx
│   ├── GitIntegrationPanel.tsx
│   ├── KeyLogPanel.tsx
│   ├── KeymapEditor.tsx
│   ├── LoggingConsolePanel.tsx
│   ├── MenuBar.tsx
│   ├── PreviewPanel.tsx
│   ├── ProfileSelector.tsx
│   ├── ResponseDiffViewer.tsx
│   ├── SessionManagerPanel.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   └── UserFeedbackPanel.tsx
├── hooks/
│   ├── useBackendConnection.ts
│   ├── useClassicLayout.ts
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
