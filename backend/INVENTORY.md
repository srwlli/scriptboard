# Backend Inventory

**Location:** `/backend`
**Files:** 6 Python files
**Framework:** FastAPI

---

## Source Files

| File | Purpose |
|------|---------|
| `api.py` | FastAPI application with REST endpoints |
| `core.py` | Core business logic and clipboard operations |
| `key_logger.py` | Keyboard and mouse event capture (pynput) |
| `schemas.py` | Pydantic models for request/response validation |
| `settings.py` | Application configuration and settings |

---

## API Endpoints (`api.py`)

### Clipboard Operations
- `POST /copy` - Copy text to clipboard
- `POST /paste` - Paste from clipboard
- `GET /clipboard` - Get clipboard contents

### Prompts
- `GET /prompts` - List preloaded prompts
- `POST /prompts` - Create prompt
- `PUT /prompts/{id}` - Update prompt
- `DELETE /prompts/{id}` - Delete prompt

### Attachments
- `GET /attachments` - List attachments
- `POST /attachments` - Add attachment
- `DELETE /attachments/{id}` - Remove attachment

### Responses
- `GET /responses` - List LLM responses
- `POST /responses` - Save response
- `DELETE /responses/{id}` - Delete response

### Sessions
- `GET /sessions` - List sessions
- `POST /sessions` - Create session
- `GET /sessions/{id}` - Get session
- `PUT /sessions/{id}` - Update session
- `DELETE /sessions/{id}` - Delete session

### Favorites
- `GET /favorites` - List favorite folders
- `POST /favorites` - Add favorite
- `DELETE /favorites/{path}` - Remove favorite

### Key Logger
- `POST /key-logger/start` - Start recording
- `POST /key-logger/stop` - Stop recording
- `GET /key-logger/events` - Get captured events
- `GET /key-logger/status` - Get logger status

### System
- `GET /health` - Health check endpoint
- `GET /config` - Get configuration
- `POST /feedback` - Submit user feedback

---

## Core Logic (`core.py`)

- Clipboard read/write operations
- Text processing and formatting
- File I/O operations
- Session management logic

---

## Key Logger (`key_logger.py`)

- Keyboard event capture (key press/release)
- Mouse event capture (click, scroll)
- Event buffering and retrieval
- Start/stop recording controls

---

## Schemas (`schemas.py`)

Pydantic models for:
- `Prompt` - Prompt data model
- `Attachment` - Attachment data model
- `Response` - LLM response model
- `Session` - Session data model
- `Favorite` - Favorite folder model
- `KeyEvent` - Key logger event model
- `Config` - Application config model

---

## Directory Structure

```
backend/
├── api.py              # FastAPI endpoints
├── core.py             # Business logic
├── key_logger.py       # Event capture
├── schemas.py          # Pydantic models
├── settings.py         # Configuration
└── venv/               # Virtual environment
```

---

## Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `pynput` - Keyboard/mouse capture
- `pyperclip` - Clipboard operations
