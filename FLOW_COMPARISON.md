# Flow Comparison: Original Tkinter vs Modern Architecture

## Overview

This document compares the execution flow and architecture patterns between the original Tkinter-based Scriptboard (`scriptboard.py`) and the new modern architecture (Python Core + FastAPI + Next.js + Electron).

## Architecture Comparison

### Original: Monolithic Tkinter Application

```
┌─────────────────────────────────────┐
│     Scriptboard Class (scriptboard.py)│
│  ┌─────────────────────────────────┐ │
│  │  State Management               │ │
│  │  - self.prompt                  │ │
│  │  - self.attachments             │ │
│  │  - self.responses               │ │
│  │  - self.favorites               │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │  UI Building                    │ │
│  │  - _build_ui()                  │ │
│  │  - _build_favorites()           │ │
│  │  - _build_prompt_section()      │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │  Business Logic                 │ │
│  │  - load_prompt()                │ │
│  │  - add_attachment()              │ │
│  │  - add_response()                │ │
│  │  - save_session()                │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │  File I/O                       │ │
│  │  - Direct file operations        │ │
│  │  - JSON serialization            │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Characteristics:**
- **Single Class**: All functionality in one `Scriptboard` class
- **Tight Coupling**: UI, state, and business logic intertwined
- **Direct File I/O**: File operations happen directly in event handlers
- **Synchronous**: All operations block the UI thread
- **State in Memory**: Application state stored as instance variables

### New: Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js/React)                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Components (Stateless)                                 │ │
│  │  - PromptPanel.tsx                                     │ │
│  │  - AttachmentsPanel.tsx                                │ │
│  │  - ResponsesPanel.tsx                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Client (api.ts)                                    │ │
│  │  - HTTP requests to backend                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│  Backend API (FastAPI)                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Endpoints (api.py)                                    │ │
│  │  - POST /prompt                                        │ │
│  │  - POST /attachments                                   │ │
│  │  - POST /responses                                    │ │
│  │  - POST /sessions                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  File I/O Layer                                        │ │
│  │  - Session save/load                                   │ │
│  │  - Config management                                   │ │
│  │  - Autosave with debouncing                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    ↓ Method Calls
┌─────────────────────────────────────────────────────────────┐
│  Core (Python - Pure Business Logic)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ScriptboardCore (core.py)                            │ │
│  │  - set_prompt()                                       │ │
│  │  - add_attachment()                                   │ │
│  │  - add_response()                                      │ │
│  │  - generate_preview()                                  │ │
│  │  - search()                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  State Management (In-Memory)                         │ │
│  │  - self.prompt                                         │ │
│  │  - self.attachments                                   │ │
│  │  - self.responses                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- **Separation of Concerns**: Each layer has distinct responsibilities
- **Stateless Frontend**: UI components query API for current state
- **API Layer**: Handles HTTP, validation, file I/O
- **Pure Core**: Business logic with no I/O dependencies
- **Asynchronous**: Non-blocking operations via HTTP

## Flow Comparison: Loading a Prompt

### Original Flow

```python
# User clicks "Load" button
def load_prompt(self) -> None:
    # 1. Direct file dialog (blocks UI)
    filepath = self._file_picker(...)
    
    # 2. Direct file read (blocks UI)
    if filepath:
        self._load_file(filepath)

def _load_file(self, filepath: str) -> None:
    # 3. Read file synchronously
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 4. Update state directly
    self.prompt = data.get('prompt', '')
    self.prompt_source = filepath
    
    # 5. Update UI directly
    self._update_prompt_status()
    self._mark_preview_dirty()
```

**Flow:**
1. Button click → Event handler
2. File dialog (blocking)
3. File read (blocking)
4. State update (direct)
5. UI update (direct)

**Issues:**
- UI freezes during file operations
- No error handling separation
- State and UI tightly coupled
- Hard to test business logic independently

### New Flow

```typescript
// Frontend: PromptPanel.tsx
const handleLoadPrompt = async () => {
  // 1. Electron file dialog (non-blocking)
  const filepath = await window.electronAPI?.openFileDialog();
  
  if (filepath) {
    // 2. HTTP request to backend
    const response = await api.loadPrompt(filepath);
    
    // 3. Update local UI state (loading indicator)
    setLoading(true);
    
    // 4. Backend handles file I/O
    // 5. Backend calls Core to update state
    // 6. Backend returns updated session
    
    // 7. Frontend re-renders with new data
    await loadData();
  }
};
```

```python
# Backend: api.py
@app.post("/prompt/load")
async def load_prompt(filepath: str):
    # 1. Validate file path (security)
    if not os.path.exists(filepath):
        raise HTTPException(400, "File not found")
    
    # 2. Read file (async, non-blocking)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 3. Call Core to update state
    core.set_prompt(data.get('prompt', ''))
    
    # 4. Trigger autosave (debounced)
    trigger_autosave()
    
    # 5. Return updated session
    return {"session": core.to_session_dict()}
```

```python
# Core: core.py
def set_prompt(self, prompt: str) -> None:
    """Pure business logic - no I/O"""
    self.prompt = prompt
    self.prompt_source = None  # Core doesn't track file paths
```

**Flow:**
1. Button click → Event handler
2. Electron IPC (non-blocking)
3. HTTP request (async)
4. Backend validates & reads file
5. Core updates state
6. Backend triggers autosave
7. Frontend receives response
8. UI re-renders

**Benefits:**
- UI remains responsive
- Clear error boundaries
- Testable layers
- Separation of concerns

## Flow Comparison: Adding an Attachment

### Original Flow

```python
def attach_file(self) -> None:
    # 1. File dialog (blocking)
    filepath = self._file_picker(...)
    
    if filepath:
        # 2. Read file content (blocking, entire file in memory)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            # Binary file - store as metadata only
            content = ""
        
        # 3. Create attachment object
        att = Attachment(
            filename=os.path.basename(filepath),
            content=content
        )
        
        # 4. Add to state
        self.attachments.append(att)
        
        # 5. Update UI directly
        self._update_attach_status()
        self._mark_preview_dirty()
```

**Issues:**
- Entire file loaded into memory
- UI blocks during file read
- No size limits
- Binary files handled inconsistently

### New Flow

```typescript
// Frontend: AttachmentsPanel.tsx
const handleAttachFile = async () => {
  const filepath = await window.electronAPI?.openFileDialog();
  
  if (filepath) {
    // 1. Read file in chunks (if large)
    const formData = new FormData();
    formData.append('file', file);
    
    // 2. HTTP POST with multipart/form-data
    await api.addAttachment(filepath);
    
    // 3. Refresh attachment list
    await loadAttachments();
};
```

```python
# Backend: api.py
@app.post("/attachments")
async def add_attachment(file: UploadFile):
    # 1. Validate file size
    if file.size > MAX_ATTACHMENT_SIZE:
        raise HTTPException(400, "File too large")
    
    # 2. Read file content (async)
    content = await file.read()
    
    # 3. Detect binary files
    is_binary = not is_text_file(content)
    
    # 4. Call Core
    attachment = core.add_attachment(
        filename=file.filename,
        content=content.decode('utf-8') if not is_binary else "",
        binary=is_binary
    )
    
    # 5. Trigger autosave
    trigger_autosave()
    
    return {"attachment": attachment.to_dict()}
```

**Benefits:**
- Async file handling
- Size validation
- Consistent binary file handling
- Better memory management

## Flow Comparison: Session Save/Load

### Original Flow

```python
def save_session(self) -> None:
    # 1. Direct file dialog (blocking)
    filepath = filedialog.asksaveasfilename(...)
    
    if filepath:
        # 2. Build session dict directly
        session = {
            "prompt": self.prompt,
            "attachments": [att.__dict__ for att in self.attachments],
            "responses": self.responses,
        }
        
        # 3. Write file synchronously (blocking)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(session, f, indent=2)
        
        # 4. Update UI
        self.show_status("Session saved")
```

**Issues:**
- No autosave
- No session versioning
- No recovery mechanism
- Manual save only

### New Flow

```python
# Backend: api.py
@app.post("/sessions")
async def save_session(session_name: str):
    # 1. Get current state from Core
    session_dict = core.to_session_dict()
    
    # 2. Add metadata
    session_dict["schema_version"] = "1.0"
    session_dict["saved_at"] = datetime.now().isoformat()
    
    # 3. Save to file (async)
    session_path = get_session_path(session_name)
    async with aiofiles.open(session_path, 'w') as f:
        await f.write(json.dumps(session_dict, indent=2))
    
    # 4. Update session list
    update_session_index()
    
    return {"session_id": session_name}

# Autosave (debounced)
def trigger_autosave():
    # Debounce: only save 1 second after last change
    schedule_autosave(delay=1.0)
```

**Benefits:**
- Automatic saving
- Session versioning
- Recovery from crashes
- Background operations

## Key Differences Summary

| Aspect | Original (Tkinter) | New (Modern) |
|--------|-------------------|--------------|
| **State Location** | Instance variables in UI class | Core class (separated) |
| **File I/O** | Direct in event handlers | API layer (async) |
| **UI Updates** | Direct widget manipulation | React re-renders from API |
| **Error Handling** | Try/except in handlers | Structured error responses |
| **Testing** | Hard (UI + logic coupled) | Easy (layers testable) |
| **Concurrency** | Single-threaded (blocking) | Async (non-blocking) |
| **Persistence** | Manual save only | Autosave + manual |
| **Session Format** | Ad-hoc JSON | Versioned schema |
| **Search** | Not implemented | Full-text search with pagination |
| **Token Counting** | Not implemented | tiktoken with caching |
| **Profiles** | Not implemented | Workspace profiles |
| **Batch Processing** | Not implemented | Queue-based batch jobs |
| **Git Integration** | Not implemented | Status check + commit |
| **Export** | Copy to clipboard | Markdown export |

## Migration Impact

### What Changed
1. **State Management**: Moved from UI class to Core class
2. **File Operations**: Moved from event handlers to API layer
3. **UI Framework**: Tkinter → React/Next.js
4. **Desktop Integration**: Direct Tkinter → Electron wrapper
5. **Persistence**: Manual → Autosave with recovery

### What Stayed the Same
1. **Core Concepts**: Prompt, attachments, responses
2. **User Workflow**: Load prompt → Add attachments → Collect responses
3. **Data Structures**: Similar Attachment and Response models
4. **Favorites System**: Same concept, different implementation

### New Capabilities
1. **Search**: Full-text search across all content
2. **Token Counting**: LLM token estimation
3. **Profiles**: Workspace-specific configurations
4. **Batch Processing**: Queue-based job management
5. **Git Integration**: Version control for sessions
6. **Export**: Markdown export
7. **Real-time Logging**: Console panel for debugging
8. **Response Comparison**: Diff viewer for responses

## Performance Considerations

### Original
- **Blocking Operations**: File I/O blocks UI thread
- **Memory**: All attachments loaded into memory
- **No Caching**: Token counting recalculated every time

### New
- **Async Operations**: Non-blocking file I/O
- **Lazy Loading**: Attachments loaded on demand
- **Caching**: Token counts cached for performance
- **Debouncing**: Autosave prevents excessive disk writes

## Code Example: Session Save

### Original Implementation

```python
# scriptboard.py lines ~1300-1350
def save_session(self) -> None:
    filepath = filedialog.asksaveasfilename(
        title="Save Session",
        defaultextension=".json",
        filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
        initialdir=self.feature_folder or os.path.expanduser("~"),
    )
    if not filepath:
        return
    
    # Build session dict directly from instance variables
    session = {
        "prompt": self.prompt,
        "prompt_source": self.prompt_source,
        "attachments": [
            {"filename": att.filename, "content": att.content}
            for att in self.attachments
        ],
        "responses": self.responses,
        "favorites": self.favorites,
    }
    
    # Write synchronously (blocks UI)
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(session, f, indent=2)
        self.show_status("Session saved")
    except Exception as e:
        self.show_status(f"Save error: {e}")
```

**Issues:**
- No versioning
- No metadata (timestamp, schema version)
- Blocks UI during write
- No recovery mechanism
- Manual save only

### New Implementation

```python
# backend/api.py
@app.post("/sessions")
async def save_session(payload: SaveSessionPayload):
    # 1. Get current state from Core
    session_dict = core.to_session_dict()
    
    # 2. Add metadata and versioning
    session_dict["schema_version"] = "1.0"
    session_dict["saved_at"] = datetime.now().isoformat()
    session_dict["app_version"] = "1.0.0"
    
    # 3. Save asynchronously (non-blocking)
    session_path = save_session(session_dict, payload.session_name)
    
    # 4. Update session index for listing
    update_session_index()
    
    return SaveSessionResponse(
        session_id=payload.session_name,
        path=str(session_path)
    )

# Autosave (automatic, debounced)
def trigger_autosave():
    """Schedule autosave after state change."""
    global _autosave_task
    
    # Cancel previous autosave if pending
    if _autosave_task and not _autosave_task.done():
        _autosave_task.cancel()
    
    # Schedule new autosave
    _autosave_task = asyncio.create_task(_autosave_after_delay())

async def _autosave_after_delay(delay: float = 1.0):
    """Wait for delay, then save."""
    await asyncio.sleep(delay)
    
    session_dict = core.to_session_dict()
    session_dict["schema_version"] = "1.0"
    session_dict["saved_at"] = datetime.now().isoformat()
    
    autosave_path = get_autosave_path()
    async with aiofiles.open(autosave_path, 'w') as f:
        await f.write(json.dumps(session_dict, indent=2))
```

**Benefits:**
- Versioned schema for future compatibility
- Automatic saving (no data loss)
- Non-blocking operations
- Recovery from crashes
- Metadata tracking

## Code Example: Preview Generation

### Original Implementation

```python
# scriptboard.py lines ~600-700
def _build_preview_content(self) -> str:
    """Build combined preview of prompt, attachments, responses."""
    parts = []
    
    # Prompt section
    if self.prompt:
        parts.append("=== PROMPT ===\n")
        parts.append(self.prompt)
        parts.append("\n\n")
    
    # Attachments section
    if self.attachments:
        parts.append("=== ATTACHMENTS ===\n")
        for att in self.attachments:
            parts.append(f"--- {att.filename} ---\n")
            parts.append(att.content)
            parts.append("\n\n")
    
    # Responses section
    if self.responses:
        parts.append("=== RESPONSES ===\n")
        for resp in self.responses:
            parts.append(f"--- {resp.get('source', 'Unknown')} ---\n")
            parts.append(resp.get('content', ''))
            parts.append("\n\n")
    
    return "".join(parts)

def view_combined_preview(self) -> None:
    """Show preview in a window."""
    if self.preview_dirty:
        content = self._build_preview_content()
        self.preview.delete("1.0", tk.END)
        self.preview.insert("1.0", content)
        self.preview_dirty = False
```

**Issues:**
- Rebuilds entire preview every time
- No token counting
- No caching
- Blocks UI during large content generation

### New Implementation

```python
# backend/core.py
def generate_preview(self) -> str:
    """Generate combined preview with token counting."""
    parts = []
    
    # Prompt section
    if self.prompt:
        parts.append("=== PROMPT ===\n")
        parts.append(self.prompt)
        parts.append("\n\n")
    
    # Attachments section
    if self.attachments:
        parts.append("=== ATTACHMENTS ===\n")
        for att in self.attachments:
            if att.binary:
                parts.append(f"--- {att.filename} (binary) ---\n")
            else:
                parts.append(f"--- {att.filename} ---\n")
                parts.append(att.content)
            parts.append("\n\n")
    
    # Responses section
    if self.responses:
        parts.append("=== RESPONSES ===\n")
        for resp in self.responses:
            parts.append(f"--- {resp.source} ---\n")
            parts.append(resp.content)
            parts.append("\n\n")
    
    return "".join(parts)

def estimate_tokens(self, text: str) -> int:
    """Estimate token count using tiktoken (cached)."""
    if not text:
        return 0
    
    # Check cache first
    cache_key = hash(text)
    if cache_key in self._token_cache:
        return self._token_cache[cache_key]
    
    # Calculate tokens
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = len(encoding.encode(text))
        self._token_cache[cache_key] = tokens
        return tokens
    except Exception:
        # Fallback: rough estimate
        return len(text) // 4

# backend/api.py
@app.get("/preview")
async def get_preview():
    """Get preview with token counts."""
    preview_text = core.generate_preview()
    
    # Calculate token counts
    prompt_tokens = core.estimate_tokens(core.prompt)
    attachment_tokens = sum(
        core.estimate_tokens(att.content)
        for att in core.attachments
        if not att.binary
    )
    response_tokens = sum(
        core.estimate_tokens(resp.content)
        for resp in core.responses
    )
    total_tokens = prompt_tokens + attachment_tokens + response_tokens
    
    return PreviewResponse(
        preview=preview_text,
        token_counts={
            "prompt": prompt_tokens,
            "attachments": attachment_tokens,
            "responses": response_tokens,
            "total": total_tokens,
        }
    )
```

**Benefits:**
- Token counting for LLM cost estimation
- Caching for performance
- Async API endpoint
- Structured response with metadata

## Conclusion

The new architecture provides:
- ✅ **Better Separation**: Clear boundaries between layers
- ✅ **Improved Performance**: Async operations, caching
- ✅ **Enhanced Features**: Search, profiles, batch processing
- ✅ **Better Testing**: Testable layers
- ✅ **Modern UI**: React-based responsive interface
- ✅ **Desktop Integration**: Electron for native feel
- ✅ **Data Safety**: Autosave prevents data loss
- ✅ **Extensibility**: Easy to add new features

The original Tkinter version was simpler but had limitations in scalability, testability, and feature extensibility. The new architecture addresses these while maintaining the core user experience.

### Migration Path

For users migrating from the original:
1. **Sessions**: Old format can be imported (with conversion)
2. **Favorites**: Can be migrated to config.json
3. **Workflow**: Same core workflow (load → attach → collect)
4. **New Features**: Search, profiles, batch processing are additive

The new architecture is a complete rewrite, but maintains feature parity with the original while adding significant new capabilities.

