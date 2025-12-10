Here’s a **crisp, start-to-finish checklist** an agent can follow to implement the whole thing according to the integrated spec.

---

## 0. Project Bootstrap

1. **Create repo layout**

   ```text
   scriptboard/
     backend/
       core.py
       api.py
       settings.py      # copy from current Tk app
       config.json      # new per-user template
       schemas.py       # Pydantic models
       sessions/        # created at runtime
       logs/            # created at runtime
     frontend/
       package.json
       next.config.mjs
       app/             # or pages/ if using Pages Router
         page.tsx
         layout.tsx
       src/
         components/
         lib/api.ts
         lib/hotkeys.ts
         styles/
     shell/
       package.json
       main.js
       preload.js
   ```

2. **Pick versions & tools**

   * Python 3.11+
   * FastAPI + Uvicorn
   * Pydantic v2
   * Next.js 14+ (App Router)
   * TypeScript
   * Tailwind (for styling) or CSS modules
   * Electron 28+ (or similar)
   * PyInstaller for backend packaging

3. **Add base dependencies**

   Backend (`backend/requirements.txt`):

   * `fastapi`
   * `uvicorn`
   * `pydantic`
   * `tiktoken` (or tokenizer lib)
   * `gitpython`
   * `python-dotenv`
   * `reportlab` (or any PDF lib)
   * `loguru` or standard `logging`

   Frontend (`frontend/package.json`):

   * `next`, `react`, `react-dom`
   * `typescript`
   * `@types/react`, `@types/node`
   * `tailwindcss` (if used)
   * `diff` / `diff2html` for diff viewer

   Shell (`shell/package.json`):

   * `electron`
   * `node-fetch` (if needed, or use built-in `fetch`)

---

## 1. Implement `ScriptboardCore` (Backend State & Logic)

> Goal: pure Python core with NO HTTP, NO UI.

1. **Define data structures in `backend/core.py`**

   * `Attachment` dataclass: `id`, `filename`, `content`, `binary: bool`
   * `Response` dataclass: `id`, `source`, `content`
   * `BatchJob` dataclass: `id`, `prompt`, `model`, `status`, `result`

2. **Implement `ScriptboardCore.__init__`**

   * Fields:

     * `prompt`, `prompt_source`
     * `attachments: list[Attachment]`
     * `responses: list[Response]`
     * `favorites`
     * `llm_urls`
     * `current_profile`
     * `batch_jobs`
   * Receive config dict (from `config.json`) and apply defaults.

3. **Prompt operations**

   * `set_prompt(text: str)`
   * `clear_prompt()`
   * `use_preloaded_prompt(key: str, preload_map: dict)`
   * `get_prompt_status() -> dict` (has_prompt, label, source)

4. **Attachment operations**

   * `add_attachment_from_text(text: str, suggested_name: str) -> Attachment`
   * `add_attachment_from_path(path: str) -> Attachment`
   * `clear_attachments()`
   * `list_attachments() -> list[dict]` (id, filename, lines, binary)

5. **Response operations**

   * `add_response(text: str, source: str) -> Response`
   * `clear_responses()`
   * `responses_summary() -> dict` (count, char_count, ids)

6. **Preview & combined content**

   * `build_preview() -> str` (truncated sections, same style as Tk)
   * `build_combined_preview() -> str` (full but still text)

7. **Session & autosave**

   * `to_dict(schema_version="1") -> dict`
   * `load_from_dict(data: dict) -> None` (handle missing fields gracefully)
   * `get_session_summary() -> dict` (counts, total chars, profile)
   * No file I/O here; just data structures.

8. **Token counting**

   * `estimate_tokens(tokenizer) -> dict`

     * returns `{prompt_tokens, attachment_tokens, response_tokens, total_tokens}`

9. **Search**

   * `search(query: str, limit: int, offset: int) -> dict`

     * search prompt, attachments, responses
     * case-insensitive substring
     * return entries: `{id, type, name, snippet}`

10. **Batch & Direct API (data only in Core)**

    * `enqueue_batch(prompt: str, models: list[str]) -> list[BatchJob]`
    * `get_batch_jobs() -> list[dict]`
    * Direct API execution is handled by backend helpers, not Core.

---

## 2. Config, Profiles, Sessions & Autosave

1. **Define `backend/config.json` template**

   * `favorites`, `llm_urls`, `workspace_profiles`, `view_defaults`, `keymap`, `theme`

2. **Implement config loader in `backend/api.py`**

   * Load from OS user config dir (e.g. `~/.scriptboard/config.json`)
   * Validate via JSON schema or Pydantic; fallback to default if invalid.

3. **Session & autosave helpers (in a separate module or in `api.py`)**

   * Functions:

     * `save_session(core: ScriptboardCore, path: str)`
     * `load_session(core: ScriptboardCore, path: str)`
     * `write_autosave(core: ScriptboardCore)` (debounced in API layer)
     * `read_autosave() -> dict|None`

4. **Profiles**

   * In config, support:

     * `workspace_profiles: {name: {favorites, view_settings}}`
   * Implement:

     * `load_profile(core, config, name)` which updates favorites/view settings but does NOT clobber session text.

---

## 3. API Layer (FastAPI) — Contracts & Endpoints

> Use `backend/schemas.py` with Pydantic models.

1. **Define Pydantic models**

   * Request models:

     * `TextPayload { text: str }`
     * `PromptPreloadedPayload { key: str }`
     * `BatchPayload { models: list[str], prompt: str }`
     * `ProfilePayload { name: str }`
     * `KeymapPayload { bindings: dict[str, str] }`
     * `GitCommitPayload { message: str }`
   * Response models:

     * `SessionSummary`, `AttachmentSummary`, `ResponseSummary`, `PreviewResponse`, `TokensResponse`, `SearchResult`, etc.
   * Error model:

     * `ErrorResponse { error: { code: str, message: str, details: dict } }`

2. **Create FastAPI app in `api.py`**

   * Global `core = ScriptboardCore(config)`
   * Include middleware for logging and error handling.

3. **Implement endpoints (MVP first)**

   **Health & summary**

   * `GET /health` → `{ status: "ok" }`
   * `GET /session` → `SessionSummary`

   **Prompt**

   * `POST /prompt` `{text}` → set prompt, return summary
   * `DELETE /prompt` → clear, return summary
   * `POST /prompt/preloaded` `{key}` → use from `settings.PRELOADED_PROMPTS`

   **Attachments**

   * `POST /attachments/text` `{text, suggested_name?}` → add, return attachment list
   * `GET /attachments` → attachment summaries
   * `DELETE /attachments` → clear all

   **Responses**

   * `POST /responses` `{text, source?}` → add, return summary
   * `GET /responses/summary` → counts and char total
   * `DELETE /responses` → clear all

   **Preview & export**

   * `GET /preview` → `{preview: str}` (truncated)
   * `GET /preview/full` → `{preview: str}` (combined)
   * `GET /export/json` → `{json: str}` (session export)

   **Search**

   * `GET /search?q=&limit=&offset=` → search results

   **Tokens**

   * `GET /tokens` → tokens estimate

   **Sessions & autosave**

   * `POST /sessions/save` `{path?}` → saves to specified or default path
   * `POST /sessions/load` `{path}` → loads, returns summary
   * `GET /autosave/status` → exists? size? timestamp?
   * `POST /autosave/recover` → load from autosave

   **Profiles & config**

   * `GET /profiles` → list profile names
   * `POST /profiles/load` `{name}` → load profile
   * `GET /config` → non-sensitive config (no keys)

4. **Phase-2 endpoints**

   **Diff & response details (13)**

   * `GET /responses/{id}` → full content
   * Diff is computed client-side.

   **Batch (14)**

   * `POST /batch` `{models, prompt}` → create queue
   * `GET /batch` → list jobs

   **Direct API (15)**

   * `POST /llm/run` `{model, prompt, attachments?, api_mode}` → call provider when `api_mode="direct"`

   **Attachment folder (16)**

   * `POST /attachments/folder` `{path}` → only available when Electron mode, validated

   **Git (17)**

   * `GET /git/status`
   * `POST /git/commit` `{message}`

   **Markdown/PDF export (18)**

   * `GET /export/markdown`
   * `GET /export/pdf` – returns file response

   **Logs (19)**

   * `GET /logs?tail=200` → last N lines of log

   **Workspace profiles (20)**

   * integrated in `/profiles` and `/profiles/load`

5. **Add standard error handler**

   * Use FastAPI exception handlers to always wrap errors in the `{error: {...}}` envelope.

---

## 4. Frontend (Next.js) — UI & Behavior

> Use App Router (`app/`), but Pages Router is acceptable if explicitly chosen.

1. **Setup Next app in `frontend/`**

   * `npx create-next-app@latest`
   * Configure TypeScript and (optionally) Tailwind.

2. **Global theme system**

   * In `layout.tsx` / `_app.tsx`:

     * Apply `data-theme="light|dark"` to `<html>`
     * Read initial theme from `localStorage` or `prefers-color-scheme`.
   * Add `ThemeToggle` component that toggles and persists theme.

3. **API client helper (`src/lib/api.ts`)**

   * Wrap all HTTP calls:

     * `getSessionSummary`, `setPrompt`, `clearPrompt`, `addAttachmentText`, `addResponse`, `getPreview`, `exportJson`, `search`, etc.
   * Base URL from env (`NEXT_PUBLIC_BACKEND_URL`).

4. **Global state strategy**

   * Treat backend as source-of-truth.
   * Maintain local UI state but always refresh from backend after mutations.
   * For counts/status banners, use response from API calls.

5. **Build UI components (MVP)**

   * `Header`:

     * App title, theme toggle, search bar.

   * `FavoritesPanel`:

     * List favorites from `GET /session` or `GET /config`.
     * No editing in MVP (or minimal).

   * `PromptPanel`:

     * Buttons: Load (via file input), Paste, View, Clear.
     * Status label from `getSessionSummary()`.
     * Paste uses `navigator.clipboard.readText()`.

   * `AttachmentsPanel`:

     * Buttons: Load (file input), Paste, View, Clear.
     * Show counts and file list from `GET /attachments`.

   * `ResponsesPanel`:

     * Buttons: Open LLMs (frontend or Electron bridging later), Paste, View, Clear.
     * Show `Responses: N | Characters: M`.

   * `SessionManagerPanel`:

     * Buttons: Copy all JSON (front-end copies `exportJson().json` to clipboard), Save Session, Load Session (simple file picker for now), Clear All.
     * Show token counts and totals from `GET /tokens` and `GET /session`.

   * `PreviewPanel`:

     * Inline preview with expand/collapse.
     * Uses `/preview` and `/preview/full`.

   * `LoggingConsolePanel` (Phase-2):

     * Text area or scrollable panel showing `/logs?tail=200`.

   Layout:

   * Desktop: 3-column grid aligning with your Tk layout.
   * Mobile: vertical stacking.

6. **Keyboard shortcuts & remapping**

   * Create `useHotkeys` hook in `lib/hotkeys.ts`:

     * Load keymap from `GET /keymap` (Phase-2) or `GET /config` initially.
     * Add `keydown` listener for:

       * “Paste response”
       * “Paste attachment”
       * “Toggle preview”
     * Call handlers (`onResponsesPaste`, `onAttachmentsPaste`, `togglePreview`).

   * Add `KeymapSettings` component in a “Settings” panel to edit and POST new bindings.

7. **Search UI**

   * Global search bar calls `/search`.
   * Results displayed grouped by:

     * Favorites
     * Attachments
     * Responses

8. **Phase-2: Diff viewer**

   * `DiffViewer` component:

     * Two dropdowns listing responses by name/id.
     * Fetch or use cached contents.
     * Use `diff`/`diff2html` to render side-by-side diff.
   * Add “Compare” button in Responses panel to open this.

---

## 5. Electron Shell — Desktop Wrapper

1. **Initialize Electron in `shell/`**

   * `npm init -y`
   * Install `electron`, `typescript` (optional), `node-fetch` if needed.

2. **Implement `main.js`**

   * On `app.whenReady`:

     * Spawn backend:

       * In dev: `python -m uvicorn backend.api:app --port 8000`
       * In prod: spawn PyInstaller-built exe.
     * Poll `http://127.0.0.1:8000/health` every 200ms up to timeout.
     * When ready:

       * Dev: load `http://localhost:3000`
       * Prod: load local `file://` URL with built Next assets.

   * On `window-all-closed`:

     * Kill backend process.
     * `app.quit()`.

3. **Implement `preload.js` (optional)**

   * Expose limited APIs to renderer via `contextBridge` if needed (e.g. for folder selection).

4. **Folder dialogs & restricted operations**

   * In Electron main:

     * Implement IPC `selectFolder` → native folder dialog.
   * Renderer calls this for Attachment Folder feature; result path is sent to backend `/attachments/folder`.

5. **Packaging (later)**

   * Use `electron-builder` to produce installers.
   * Bundle backend exe + static frontend.

---

## 6. Phase-2 Feature Implementation Order

After MVP is stable, implement in this order:

1. **Diff Viewer** (Response compare)
2. **Search polish** (highlight, pagination)
3. **Workspace Profiles** (profile dropdown + load)
4. **Attachment Folders** (IPC + recursive import)
5. **Git Integration** (status + commit)
6. **Markdown/PDF Export**
7. **Batch Queue UI & API**
8. **Direct API Mode (OpenAI/Claude)**
9. **Logging Console & log rotation**
10. **Keyboard remapping UI** (if not done earlier)

---

## 7. Hardening, Testing & Docs

1. **Testing**

   * Backend: add pytest suite for Core + API endpoints.
   * Frontend: test component rendering and minimal flows.
   * E2E: use Playwright or Cypress to validate:

     * load → attach → paste → export → save → reload.

2. **Performance checks**

   * Simulate 50 attachments + 10 responses + 250k chars.
   * Measure search, preview, token endpoints.

3. **Documentation**

   * `README.md`: install + run instructions.
   * `docs/ARCHITECTURE.md`: architecture + state ownership.
   * `docs/MIGRATION.md`: “from Tk Scriptboard → new app”.

---

If you’d like, next I can:

* Draft the **exact Pydantic models** (`schemas.py`), or
* Sketch the **`ScriptboardCore` class skeleton** with method stubs ready to fill, or
* Design the **Next.js component tree** in a diagram-like text form.
