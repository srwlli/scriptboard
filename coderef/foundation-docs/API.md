# API Documentation

## Overview

- **Framework:** FastAPI
- **Authentication:** Unknown
- **Error Format:** RFC 7807
- **Total Endpoints:** 67

## Endpoints

| Method | Path | File |
|--------|------|------|
| `GET` | `/` | `backend\api.py` |
| `GET` | `/health` | `backend\api.py` |
| `GET` | `/favicon.ico` | `backend\api.py` |
| `GET` | `/session` | `backend\api.py` |
| `POST` | `/prompt` | `backend\api.py` |
| `DELETE` | `/prompt` | `backend\api.py` |
| `GET` | `/prompts` | `backend\api.py` |
| `POST` | `/prompts` | `backend\api.py` |
| `POST` | `/prompt/preloaded` | `backend\api.py` |
| `POST` | `/attachments/text` | `backend\api.py` |
| `GET` | `/attachments` | `backend\api.py` |
| `POST` | `/attachments/folder` | `backend\api.py` |
| `DELETE` | `/attachments` | `backend\api.py` |
| `POST` | `/responses` | `backend\api.py` |
| `GET` | `/responses/summary` | `backend\api.py` |
| `GET` | `/responses` | `backend\api.py` |
| `DELETE` | `/responses` | `backend\api.py` |
| `GET` | `/preview` | `backend\api.py` |
| `GET` | `/preview/full` | `backend\api.py` |
| `GET` | `/export/markdown` | `backend\api.py` |
| `GET` | `/export/json` | `backend\api.py` |
| `GET` | `/export/llm/prompt` | `backend\api.py` |
| `GET` | `/export/llm/attachments` | `backend\api.py` |
| `GET` | `/export/llm/responses` | `backend\api.py` |
| `GET` | `/export/llm` | `backend\api.py` |
| `GET` | `/search` | `backend\api.py` |
| `GET` | `/tokens` | `backend\api.py` |
| `POST` | `/sessions/save` | `backend\api.py` |
| `POST` | `/sessions/load` | `backend\api.py` |
| `GET` | `/autosave/status` | `backend\api.py` |
| `POST` | `/autosave/recover` | `backend\api.py` |
| `GET` | `/profiles` | `backend\api.py` |
| `POST` | `/profiles/load` | `backend\api.py` |
| `POST` | `/batch/enqueue` | `backend\api.py` |
| `GET` | `/batch/jobs` | `backend\api.py` |
| `POST` | `/batch/jobs/{job_id}/cancel` | `backend\api.py` |
| `GET` | `/llm/providers` | `backend\api.py` |
| `POST` | `/llm/call` | `backend\api.py` |
| `GET` | `/git/status` | `backend\api.py` |
| `POST` | `/git/commit` | `backend\api.py` |
| `GET` | `/git/branches` | `backend\api.py` |
| `POST` | `/git/branches` | `backend\api.py` |
| `POST` | `/git/checkout` | `backend\api.py` |
| `DELETE` | `/git/branches/{branch_name}` | `backend\api.py` |
| `POST` | `/git/pull` | `backend\api.py` |
| `POST` | `/git/push` | `backend\api.py` |
| `POST` | `/git/scan` | `backend\api.py` |
| `GET` | `/config` | `backend\api.py` |
| `POST` | `/favorites` | `backend\api.py` |
| `DELETE` | `/favorites/{index}` | `backend\api.py` |
| `POST` | `/macros/record/start` | `backend\api.py` |
| `POST` | `/macros/record/stop` | `backend\api.py` |
| `GET` | `/macros/record/stream` | `backend\api.py` |
| `POST` | `/macros/save` | `backend\api.py` |
| `GET` | `/system/stats` | `backend\api.py` |
| `GET` | `/system/processes` | `backend\api.py` |
| `GET` | `/system/processes/app` | `backend\api.py` |
| `GET` | `/system/processes/detailed` | `backend\api.py` |
| `GET` | `/system/processes/{pid}/details` | `backend\api.py` |
| `POST` | `/system/processes/kill` | `backend\api.py` |
| `GET` | `/system/protected-processes` | `backend\api.py` |
| `GET` | `/system/network/connections` | `backend\api.py` |
| `GET` | `/system/network/listening` | `backend\api.py` |
| `GET` | `/system/network/pids-with-connections` | `backend\api.py` |
| `GET` | `/system/disk/usage` | `backend\api.py` |
| `GET` | `/system/disk/largest` | `backend\api.py` |
| `GET` | `/system/startup-apps` | `backend\api.py` |

### Endpoint Details

#### `GET` /

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /health

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /favicon.ico

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /session

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /prompt

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `DELETE` /prompt

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /prompts

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /prompts

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /prompt/preloaded

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /attachments/text

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /attachments

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /attachments/folder

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `DELETE` /attachments

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /responses

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /responses/summary

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /responses

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `DELETE` /responses

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /preview

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /preview/full

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /export/markdown

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /export/json

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /export/llm/prompt

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /export/llm/attachments

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /export/llm/responses

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /export/llm

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /search

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /tokens

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /sessions/save

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /sessions/load

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /autosave/status

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /autosave/recover

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /profiles

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /profiles/load

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /batch/enqueue

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /batch/jobs

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /batch/jobs/{job_id}/cancel

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /llm/providers

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /llm/call

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /git/status

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /git/commit

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /git/branches

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /git/branches

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /git/checkout

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `DELETE` /git/branches/{branch_name}

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /git/pull

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /git/push

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /git/scan

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `GET` /config

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `POST` /favorites

- **File:** `backend\api.py`
- **Framework:** FastAPI

#### `DELETE` /favorites/{index}

- **File:** `backend\api.py`
- **Framework:** FastAPI

## Authentication

*Authentication method not detected.*

## Error Handling

**Format:** RFC 7807

Example:

```json
{"type": "about:blank", "status": 400, "title": "Bad Request", "detail": "..."}
```

*Generated: 2025-12-15T15:57:09.928906*