# backend/schemas.py
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


# ---------------------------------------------------------------------------
# Core enums
# ---------------------------------------------------------------------------

class SearchItemType(str, Enum):
    PROMPT = "prompt"
    ATTACHMENT = "attachment"
    RESPONSE = "response"
    FAVORITE = "favorite"


class BatchJobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    GIT_ERROR = "GIT_ERROR"
    CONFIG_ERROR = "CONFIG_ERROR"
    IO_ERROR = "IO_ERROR"
    SECURITY_ERROR = "SECURITY_ERROR"
    LLM_ERROR = "LLM_ERROR"
    UNSUPPORTED = "UNSUPPORTED"


# ---------------------------------------------------------------------------
# Error envelope
# ---------------------------------------------------------------------------

class ErrorInfo(BaseModel):
    code: ErrorCode = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Optional structured details for debugging/UI"
    )


class ErrorResponse(BaseModel):
    error: ErrorInfo


# ---------------------------------------------------------------------------
# Generic payloads
# ---------------------------------------------------------------------------

class TextPayload(BaseModel):
    text: str = Field(..., description="Arbitrary text content")


class PromptPreloadedPayload(BaseModel):
    key: str = Field(..., description="Key referring to PRELOADED_PROMPTS entry")


class AddPromptPayload(BaseModel):
    label: str = Field(..., description="Display label for the prompt", max_length=100)
    text: str = Field(..., description="Prompt text content", max_length=10000)


class AttachmentTextPayload(BaseModel):
    text: str = Field(..., description="Attachment content from clipboard or input")
    suggested_name: Optional[str] = Field(
        default=None,
        description="Optional suggested filename (without path)"
    )


class SaveSessionPayload(BaseModel):
    path: Optional[str] = Field(
        default=None,
        description="Optional explicit path to save session JSON; if omitted, backend chooses"
    )


class LoadSessionPayload(BaseModel):
    path: str = Field(..., description="Path to a previously saved session JSON")


class ProfilePayload(BaseModel):
    name: str = Field(..., description="Profile name defined in config")


class KeymapPayload(BaseModel):
    bindings: Dict[str, str] = Field(
        ...,
        description="Map from action identifiers to key combos, e.g. {'paste_response': 'Ctrl+V'}",
    )


class BatchPayload(BaseModel):
    prompt: str = Field(..., description="Prompt to enqueue for batch processing")
    models: List[str] = Field(
        ...,
        description="List of model identifiers to use for batch jobs",
        min_length=1,
    )


class FolderPathPayload(BaseModel):
    path: str = Field(
        ...,
        description="Absolute folder path selected via Electron IPC"
    )


class GitCommitPayload(BaseModel):
    message: str = Field(
        ...,
        description="Commit message to use when committing session files"
    )


class SearchQueryParams(BaseModel):
    q: str = Field(..., description="Search query string")
    limit: int = Field(20, ge=1, le=200)
    offset: int = Field(0, ge=0)


# ---------------------------------------------------------------------------
# Direct API / LLM payloads (Phase-2)
# ---------------------------------------------------------------------------

class LlmApiMode(str, Enum):
    BROWSER = "browser"
    DIRECT = "direct"


class LlmRunPayload(BaseModel):
    model: str = Field(..., description="Model identifier, e.g. 'openai:gpt-4.1'")
    prompt: str = Field(..., description="Prompt text to send to the model")
    api_mode: LlmApiMode = Field(
        default=LlmApiMode.DIRECT,
        description="Whether to call provider APIs directly or use browser workflow",
    )
    attachment_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional list of attachment IDs to include as context",
    )

    @field_validator("attachment_ids")
    @classmethod
    def empty_to_none(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        return v or None


class LlmRunResponse(BaseModel):
    job_id: Optional[str] = Field(
        default=None,
        description="Optional batch job ID if run is associated with a queued job",
    )
    response_id: Optional[str] = Field(
        default=None,
        description="ID of stored Response object (if persisted)",
    )
    content: str = Field(..., description="Raw text returned by the model")


# ---------------------------------------------------------------------------
# Session summary & basic data shapes
# ---------------------------------------------------------------------------

class AttachmentSummary(BaseModel):
    id: str
    filename: str
    lines: int
    binary: bool = Field(
        default=False,
        description="True if this is a non-text attachment represented only by metadata",
    )


class ResponseSummaryItem(BaseModel):
    id: str
    source: str
    char_count: int


class ResponseSummary(BaseModel):
    count: int
    char_count: int
    responses: List[ResponseSummaryItem]


class SessionSummary(BaseModel):
    has_prompt: bool
    prompt_source: Optional[str] = None

    attachment_count: int
    response_count: int
    total_chars: int

    current_profile: Optional[str] = None

    # Optional token info (may be populated from /tokens or cached)
    total_tokens: Optional[int] = None


class PreviewResponse(BaseModel):
    preview: str = Field(..., description="Multi-section textual preview")


# ---------------------------------------------------------------------------
# Tokens & search
# ---------------------------------------------------------------------------

class TokensResponse(BaseModel):
    tokenizer: str = Field(..., description="Name of tokenizer used")
    prompt_tokens: int
    attachment_tokens: int
    response_tokens: int
    total_tokens: int


class SearchResultItem(BaseModel):
    id: Optional[str] = Field(
        default=None,
        description="ID of the matched entity (if applicable, e.g., attachment/response)",
    )
    type: SearchItemType
    name: str = Field(
        ...,
        description="Display name (e.g. filename, response label, or 'Prompt')",
    )
    snippet: str = Field(
        ...,
        description="Short excerpt around the match, sanitized for display",
    )


class SearchResponse(BaseModel):
    query: str
    total: int
    limit: int
    offset: int
    results: List[SearchResultItem]


# ---------------------------------------------------------------------------
# Autosave & logs
# ---------------------------------------------------------------------------

class AutosaveStatusResponse(BaseModel):
    exists: bool
    path: Optional[str] = None
    size_bytes: Optional[int] = None
    modified_iso: Optional[str] = Field(
        default=None,
        description="Last modification timestamp in ISO 8601 format",
    )


class LogsResponse(BaseModel):
    tail: int = Field(..., description="Number of log lines returned")
    lines: List[str]


# ---------------------------------------------------------------------------
# Batch & Git
# ---------------------------------------------------------------------------

class BatchJob(BaseModel):
    id: str
    prompt: str
    model: str
    status: BatchJobStatus
    error: Optional[str] = Field(
        default=None,
        description="Error string if status == ERROR",
    )


class BatchListResponse(BaseModel):
    jobs: List[BatchJob]


class GitStatusResponse(BaseModel):
    repo_root: Optional[str] = None
    branch: Optional[str] = None
    clean: bool
    ahead: int = 0
    behind: int = 0
    has_untracked: bool = False


class GitCommitResponse(BaseModel):
    committed: bool
    commit_hash: Optional[str] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Config / profiles / keymap
# ---------------------------------------------------------------------------

class FavoriteEntry(BaseModel):
    label: str
    path: str


class LlmUrlEntry(BaseModel):
    label: str
    url: HttpUrl


class ViewSettings(BaseModel):
    show_favorites: bool = True
    show_prompt: bool = True
    show_attachments: bool = True
    show_responses: bool = True
    show_manager: bool = True
    show_preview: bool = True


class ProfileInfo(BaseModel):
    name: str
    favorites: Optional[List[FavoriteEntry]] = None
    view_settings: Optional[ViewSettings] = None


class ProfilesListResponse(BaseModel):
    profiles: List[ProfileInfo]
    current_profile: Optional[str] = None


class KeymapResponse(BaseModel):
    bindings: Dict[str, str]


class ConfigResponse(BaseModel):
    favorites: List[FavoriteEntry]
    llm_urls: List[LlmUrlEntry]
    theme: Optional[str] = Field(
        default=None,
        description="Preferred theme, e.g. 'light' or 'dark'",
    )
    view_defaults: Optional[ViewSettings] = None
    # No secrets here (keys live in env / keychain)


# ---------------------------------------------------------------------------
# Preloaded Prompts
# ---------------------------------------------------------------------------

class PreloadedPromptItem(BaseModel):
    key: str = Field(..., description="Unique key for the prompt (e.g., '1', '2')")
    label: str = Field(..., description="Display label for the prompt (e.g., 'Code Review')")
    preview: str = Field(..., description="First 100 characters of the prompt text for preview")


class PreloadedPromptsResponse(BaseModel):
    prompts: List[PreloadedPromptItem] = Field(..., description="List of available preloaded prompts")
