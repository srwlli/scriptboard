# API Reference

## 📡 Endpoints

### `GET /health`
**Purpose**: Health check
**Auth**: None

#### Response (200 OK)
```json
{ "status": "ok" }
```

### `GET /session`
**Purpose**: Session summary
**Auth**: None

#### Response (200 OK)
```json
{
  "has_prompt": true,
  "prompt_source": "manual",
  "attachment_count": 0,
  "response_count": 0,
  "total_chars": 42,
  "current_profile": null,
  "total_tokens": null
}
```

### `POST /prompt`
**Purpose**: Set current prompt
**Auth**: None

#### Request
```json
{ "text": "..." }
```

#### Response (200 OK)
```json
{ "status": "ok" }
```

### `DELETE /prompt`
**Purpose**: Clear prompt
**Auth**: None

#### Response (200 OK)
```json
{ "status": "ok" }
```

### `GET /prompts`
**Purpose**: List preloaded prompts from config
**Auth**: None

#### Response (200 OK)
```json
{ "prompts": [{ "key": "0001", "label": "...", "preview": "..." }] }
```

### `POST /prompts`
**Purpose**: Add preloaded prompt (auto 4-digit key)
**Auth**: None

#### Request
```json
{ "label": "...", "text": "..." }
```

#### Response (200 OK)
```json
{ "status": "ok", "key": "0002" }
```

### `POST /prompt/preloaded`
**Purpose**: Use a preloaded prompt by key
**Auth**: None

#### Request
```json
{ "key": "0001" }
```

#### Response (200 OK)
```json
{ "status": "ok" }
```

### `POST /attachments/text`
**Purpose**: Add text attachment
**Auth**: None

#### Request
```json
{ "text": "...", "suggested_name": "file.txt" }
```

#### Response (200 OK)
```json
{ "id": "...", "filename": "file.txt", "lines": 1, "binary": false }
```

### `GET /attachments`
**Purpose**: List attachments
**Auth**: None

#### Response (200 OK)
```json
[{ "id": "...", "filename": "file.txt", "lines": 1, "binary": false }]
```

### `DELETE /attachments`
**Purpose**: Clear all attachments
**Auth**: None

#### Response (200 OK)
```json
{ "status": "ok" }
```

### `POST /attachments/folder`
**Purpose**: Import all text files from a folder
**Auth**: None

#### Request
```json
{ "path": "C:/some/folder" }
```

#### Response (200 OK)
```json
{ "status": "ok", "imported": 3, "skipped": 1, "files": ["a.txt", "b.tsx"] }
```

### `POST /responses`
**Purpose**: Add an LLM response
**Auth**: None

#### Request
```json
{ "text": "..." }
```

#### Response (200 OK)
```json
{ "id": "...", "source": "unknown", "char_count": 123 }
```

### `GET /responses/summary`
**Purpose**: Summary of responses
**Auth**: None

#### Response (200 OK)
```json
{ "count": 1, "char_count": 123, "responses": [{ "id": "...", "source": "...", "char_count": 123 }] }
```

### `GET /responses`
**Purpose**: List responses with content
**Auth**: None

#### Response (200 OK)
```json
{ "responses": [{ "id": "...", "source": "...", "content": "...", "char_count": 123 }] }
```

### `GET /preview`
**Purpose**: Truncated preview
**Auth**: None

### `GET /preview/full`
**Purpose**: Full combined preview
**Auth**: None

### `GET /export/json`
**Purpose**: Export session as JSON
**Auth**: None

### `GET /export/markdown`
**Purpose**: Export session as Markdown
**Auth**: None

### `GET /export/llm`
**Purpose**: LLM-friendly text export (combined)
**Auth**: None

### `GET /export/llm/prompt`
**Purpose**: LLM-friendly prompt only
**Auth**: None

### `GET /export/llm/attachments`
**Purpose**: LLM-friendly attachments only
**Auth**: None

### `GET /export/llm/responses`
**Purpose**: LLM-friendly responses only
**Auth**: None

### `GET /search`
**Purpose**: Search across prompt, attachments, responses
**Auth**: None

#### Query Params
```json
{ "q": "string", "limit": 20, "offset": 0 }
```

### `GET /tokens`
**Purpose**: Token counts
**Auth**: None

### `POST /sessions/save`
**Purpose**: Save current session (optional `filename` query)
**Auth**: None

### `POST /sessions/load`
**Purpose**: Load a session by path
**Auth**: None

#### Request
```json
{ "path": "C:/Users/.../.scriptboard/sessions/20250101_120000.json" }
```

### `GET /autosave/status`
**Purpose**: Autosave file status
**Auth**: None

### `POST /autosave/recover`
**Purpose**: Recover from autosave
**Auth**: None

### `GET /profiles`
**Purpose**: List available profiles
**Auth**: None

### `POST /profiles/load`
**Purpose**: Load a profile by name
**Auth**: None

### `POST /batch/enqueue`
**Purpose**: Enqueue batch jobs (Phase-2)
**Auth**: None

### `GET /batch/jobs`
**Purpose**: List batch jobs (Phase-2)
**Auth**: None

### `POST /batch/jobs/{id}/cancel`
**Purpose**: Cancel a batch job (Phase-2)
**Auth**: None

### `GET /git/status`
**Purpose**: Git repository status (Phase-2)
**Auth**: None

### `POST /git/commit`
**Purpose**: Commit session files to git (Phase-2)
**Auth**: None

### `GET /llm/providers`
**Purpose**: List LLM providers (Phase-2)
**Auth**: None

### `POST /llm/call`
**Purpose**: Call LLM API directly (Phase-2, not implemented)
**Auth**: None

## 🔐 Authentication
- **Type**: None (development). Configure CORS origins for production.

## 🛑 Error Codes
- **400**: Bad Request
- **401**: Unauthorized (not used)
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Server Error

Pydantic error envelope shape:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "...",
    "details": {}
  }
}
```

---
(Generated by Foundation Docs Agent via POWER Protocol)
