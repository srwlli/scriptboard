# SCRIPTBOARD — PROJECT SCRIPT MAP
# (Full architecture: Backend Core + API + Frontend + Electron Shell)

├── backend/
│   ├── core.py
│   │   - ScriptboardCore class (main state engine)
│   │   - Data classes:
│   │       • Attachment
│   │       • ResponseItem
│   │       • BatchJob (Phase-2)
│   │   - Core methods:
│   │       • set_prompt / clear_prompt / load_preloaded_prompt
│   │       • add_attachment_from_text / add_attachment_from_path
│   │       • clear_attachments / list_attachments
│   │       • add_response / clear_responses / summarize_responses
│   │       • build_preview / build_full_preview
│   │       • get_session_summary
│   │       • search(query)
│   │       • to_dict() / load_from_dict()
│   │       • estimate_tokens()
│   │       • enqueue_batch(), get_batch_jobs()  (Phase-2)
│   │   - NO I/O, NO HTTP, NO UI — pure business logic

│   ├── api.py
│   │   - FastAPI app with all HTTP routes
│   │   - Routes grouped as:
│   │       • /health
│   │       • /session (summary)
│   │       • /prompt (set, clear, load-preloaded)
│   │       • /attachments (add-text, add-file, list, clear)
│   │       • /responses (add, list/summary, clear)
│   │       • /preview (short/full)
│   │       • /export (json, markdown, pdf) (Phase-2)
│   │       • /tokens (returns token counts)
│   │       • /search
│   │       • /sessions/save /sessions/load
│   │       • /autosave/status /autosave/recover
│   │       • /profiles/list /profiles/load
│   │       • /keymap (get/update)
│   │       • /batch (create/list) (Phase-2)
│   │       • /llm/run (Phase-2 direct API mode)
│   │       • /attachments/folder (Electron-only; Phase-2)
│   │       • /git/status /git/commit (Phase-2)
│   │   - Performs:
│   │       • validation
│   │       • I/O (save/load sessions)
│   │       • path safety checks
│   │       • autosave debounce
│   │       • filesystem interactions (guarded)
│   │       • Git integration
│   │   - Uses ScriptboardCore instance for actual state manipulation

│   ├── schemas.py
│   │   - Pydantic models for all request/response types:
│   │       • TextPayload, AttachmentTextPayload, PromptPreloadedPayload
│   │       • SaveSessionPayload, LoadSessionPayload
│   │       • ProfilePayload, KeymapPayload
│   │       • BatchPayload, LlmRunPayload
│   │       • ErrorResponse envelope
│   │       • SessionSummary, AttachmentSummary, ResponseSummary
│   │       • TokensResponse
│   │       • SearchResponse, SearchResultItem
│   │       • AutosaveStatusResponse
│   │       • LogsResponse
│   │       • GitStatusResponse, GitCommitResponse
│   │       • ProfilesListResponse, ConfigResponse, KeymapResponse

│   ├── settings.py
│   │   - Constants from original Tk app:
│   │       • PRELOADED_PROMPTS
│   │       • favorite directories (defaults)
│   │       • LLM links (defaults)
│   │       • UI labels and strings
│   │   - Passed into ScriptboardCore as needed

│   ├── config.json  (generated in user config dir, not inside repo)
│   │   - User-level config:
│   │       • favorites
│   │       • llm_urls
│   │       • workspace_profiles
│   │       • view_defaults
│   │       • keymap
│   │       • theme preference
│   │   - Loaded on backend startup

│   ├── sessions/
│   │   - Stored user sessions (JSON files)
│   │   - autosave.json
│   │   - autosave.old.json (rotated)

│   ├── logs/
│       - backend logs (rotating)

│
├── frontend/
│   ├── next.config.mjs
│   ├── package.json
│   ├── app/               # App Router
│   │   ├── layout.tsx     # global providers (theme, layout)
│   │   ├── page.tsx       # main 3-column Scriptboard UI
│   │   ├── preview/       # (optional nested routes)
│   │   ├── settings/      # profile/keymap UI (Phase-2)
│   │   └── api/           # client-side API helpers only (not Next API routes)
│   │
│   ├── src/
│   │   ├── components/
│   │   │   • Header
│   │   │   • FavoritesPanel
│   │   │   • PromptPanel
│   │   │   • AttachmentsPanel
│   │   │   • ResponsesPanel
│   │   │   • SessionManagerPanel
│   │   │   • PreviewPanel
│   │   │   • SearchResults
│   │   │   • ThemeToggle
│   │   │   • KeymapEditor        (Phase-2)
│   │   │   • DiffViewer          (Phase-2)
│   │   │   • LoggingConsole      (Phase-2)
│   │   │
│   │   ├── lib/
│   │   │   • api.ts              # wrapper for backend fetch calls
│   │   │   • hotkeys.ts          # central keyboard mapping handler
│   │   │   • debounce.ts         # autosave, input debounce helpers
│   │   │
│   │   ├── styles/
│   │   │   • globals.css
│   │   │   • theme.css           # light/dark themes

│
├── shell/                     # Electron desktop wrapper
│   ├── package.json
│   ├── main.js
│   │   - Launch backend (dev: uvicorn; prod: bundled exe)
│   │   - Poll /health
│   │   - Load Next UI (dev: localhost:3000; prod: file:// build)
│   │   - Handle backend crash → dialog + restart option
│   │   - IPC handlers:
│   │       • selectFolder()
│   │       • restricted FS paths
│   │
│   ├── preload.js
│   │   - Expose safe IPC (no direct FS access from frontend)
│   │
│   ├── electron-builder.yml (later)
│       - Packaging configuration:
│           • bundled backend
│           • static Next build
│           • icons, metadata

│
├── final-spec.md
│   - Full integrated architecture & requirements
│
├── step-by-step.md
│   - Implementation plan from bootstrap → Phase-2
│
└── README.md (to be generated)
    - Dev setup
    - Running backend
    - Running frontend
    - Packaging with Electron
