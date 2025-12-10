# Scriptboard Architecture

## Overview

Scriptboard follows a strict layered architecture with clear separation of concerns:

1. **Core Layer** (`backend/core.py`): Pure business logic, no I/O
2. **API Layer** (`backend/api.py`): HTTP endpoints, validation, file I/O
3. **Frontend Layer** (`frontend/`): React UI, user interactions
4. **Shell Layer** (`shell/`): Electron desktop integration

## State Ownership

**ScriptboardCore owns all application state.**

- Prompt, attachments, responses, favorites, LLM URLs, profiles
- Core is stateless in terms of persistence - it doesn't know about files
- API layer handles all file I/O (sessions, config, autosave)
- Frontend is stateless - it queries API for current state

## Data Flow

```
User Action (Frontend)
    ↓
API Endpoint (FastAPI)
    ↓
ScriptboardCore (Business Logic)
    ↓
API Response (FastAPI)
    ↓
UI Update (Frontend)
```

## Layer Responsibilities

### Core Layer (`backend/core.py`)

**Responsibilities:**
- Business logic operations (set_prompt, add_attachment, etc.)
- State management (prompt, attachments, responses)
- Data transformations (preview generation, token counting, search)
- Session serialization/deserialization

**Does NOT:**
- Read/write files
- Make HTTP requests
- Access file system
- Handle errors (returns values, doesn't raise)

### API Layer (`backend/api.py`)

**Responsibilities:**
- HTTP endpoint definitions
- Request/response validation (Pydantic)
- File I/O (sessions, config, autosave)
- Error handling and structured error responses
- Autosave debouncing
- Path validation and security

**Does NOT:**
- Contain business logic (delegates to Core)
- Manage UI state
- Handle desktop integration

### Frontend Layer (`frontend/`)

**Responsibilities:**
- User interface rendering
- User interaction handling
- API communication
- Theme management
- Keyboard shortcuts
- Local state for UI (loading, form inputs)

**Does NOT:**
- Store application state (queries API)
- Perform business logic
- Access file system directly

### Shell Layer (`shell/`)

**Responsibilities:**
- Desktop window management
- Backend process spawning
- System integration (file dialogs, IPC)
- Backend health monitoring
- Crash recovery

**Does NOT:**
- Contain business logic
- Manage application state
- Handle HTTP requests

## Error Handling

All API errors follow a structured envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Error codes are defined in `backend/schemas.py` as `ErrorCode` enum.

## Session Management

- Sessions saved as JSON in `~/.scriptboard/sessions/`
- Autosave written to `~/.scriptboard/autosave.json` with 1s debounce
- Autosave rotates to `autosave.old.json` if >2MB
- Session files limited to 10MB

## Configuration

- Stored in `~/.scriptboard/config.json`
- Loaded on backend startup
- Validated with fallback to defaults
- Profiles modify UI defaults without affecting session content

## Security

- Backend binds to `127.0.0.1` only (localhost)
- File paths validated to prevent directory traversal
- No stack traces exposed to frontend
- Electron IPC uses contextBridge for safe communication

## Performance Considerations

- Token counting cached per content hash
- Search results paginated
- Autosave debounced to prevent write conflicts
- Large files (>2MB) rejected for attachments
- Binary files stored as metadata only

