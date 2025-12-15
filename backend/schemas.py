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


# ---------------------------------------------------------------------------
# Macro / Key Logger (Key-Logger feature)
# ---------------------------------------------------------------------------

class MacroEventType(str, Enum):
    """Types of events in a macro."""
    KEY_DOWN = "KeyDown"
    KEY_UP = "KeyUp"
    CLIPBOARD_SET = "ClipboardSet"
    DELAY = "Delay"
    WINDOW_FOCUS = "WindowFocus"


class MacroEvent(BaseModel):
    """Represents a single event in a macro."""
    type: MacroEventType = Field(..., description="Type of event")
    ts_delta_ms: int = Field(0, description="Milliseconds since previous event")
    key: Optional[str] = Field(None, description="Key name for KeyDown/KeyUp events")
    clipboard_text: Optional[str] = Field(None, description="Clipboard content for ClipboardSet events")
    delay_ms: Optional[int] = Field(None, description="Explicit delay in milliseconds")
    window_title: Optional[str] = Field(None, description="Window title for WindowFocus events")


class Macro(BaseModel):
    """Represents a saved macro."""
    id: str = Field(..., description="Unique macro identifier")
    name: str = Field(..., description="Macro name")
    created_at: str = Field(..., description="ISO 8601 timestamp of creation")
    events: List[MacroEvent] = Field(..., description="List of events in the macro")


class MacroSavePayload(BaseModel):
    """Payload for saving a macro."""
    name: str = Field(..., description="Macro name", min_length=1, max_length=100)
    events: List[MacroEvent] = Field(..., description="List of events to save", min_length=1)


class MacroRecordResponse(BaseModel):
    """Response from starting/stopping recording."""
    status: str = Field(..., description="Status: 'recording' or 'stopped'")
    events: Optional[List[MacroEvent]] = Field(
        None,
        description="Captured events (only present when stopping)"
    )


# ---------------------------------------------------------------------------
# System Monitoring (Process Monitor feature)
# ---------------------------------------------------------------------------

class SystemStats(BaseModel):
    """System resource usage statistics."""
    cpu_percent: float = Field(..., description="CPU usage percentage (0-100)")
    memory_percent: float = Field(..., description="RAM usage percentage (0-100)")
    memory_used_gb: float = Field(..., description="RAM used in GB")
    memory_total_gb: float = Field(..., description="Total RAM in GB")
    disk_percent: float = Field(..., description="Disk usage percentage (0-100)")
    disk_used_gb: float = Field(..., description="Disk used in GB")
    disk_total_gb: float = Field(..., description="Total disk in GB")


class ProcessCategory(str, Enum):
    """Process category for grouping."""
    BROWSER = "browser"
    DEV_TOOLS = "dev"
    SYSTEM = "system"
    APP = "app"
    MEDIA = "media"
    COMMUNICATION = "communication"
    SECURITY = "security"
    OTHER = "other"


class ProcessInfo(BaseModel):
    """Information about a running process."""
    pid: int = Field(..., description="Process ID")
    name: str = Field(..., description="Process name")
    cpu_percent: float = Field(..., description="CPU usage percentage")
    memory_percent: float = Field(..., description="Memory usage percentage")
    memory_mb: float = Field(..., description="Memory usage in MB")
    status: str = Field(..., description="Process status (running, sleeping, etc.)")
    is_protected: bool = Field(default=False, description="Whether this is a protected process")


class DetailedProcessInfo(BaseModel):
    """Extended process information with category, description, and history."""
    # Basic info
    pid: int = Field(..., description="Process ID")
    name: str = Field(..., description="Process name")
    cpu_percent: float = Field(..., description="CPU usage percentage")
    memory_percent: float = Field(..., description="Memory usage percentage")
    memory_mb: float = Field(..., description="Memory usage in MB")
    status: str = Field(..., description="Process status (running, sleeping, etc.)")
    is_protected: bool = Field(default=False, description="Whether this is a protected process")

    # Category and description
    category: ProcessCategory = Field(default=ProcessCategory.OTHER, description="Process category")
    description: str = Field(default="", description="Human-readable description")
    icon: str = Field(default="❓", description="Category icon (emoji)")

    # Extended details
    path: Optional[str] = Field(default=None, description="Full executable path")
    cmdline: Optional[str] = Field(default=None, description="Command line arguments")
    parent_pid: Optional[int] = Field(default=None, description="Parent process ID")
    children_count: int = Field(default=0, description="Number of child processes")
    threads: int = Field(default=0, description="Number of threads")
    handles: int = Field(default=0, description="Number of handles (Windows)")
    start_time: Optional[str] = Field(default=None, description="Process start time (ISO 8601)")
    uptime_seconds: int = Field(default=0, description="Process uptime in seconds")

    # History (last 60 samples)
    cpu_history: List[float] = Field(default_factory=list, description="CPU usage history")
    memory_history: List[float] = Field(default_factory=list, description="Memory usage history (MB)")

    # Flags
    is_new: bool = Field(default=False, description="Started within last 5 minutes")

    # Safe-to-kill scoring
    safe_to_kill_score: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Safety score 0-100 (0=protected, 100=safe to kill)"
    )
    kill_risk_reason: str = Field(
        default="",
        description="Explanation of why process has this safety score"
    )


class DetailedProcessListResponse(BaseModel):
    """Response containing list of detailed processes."""
    processes: List[DetailedProcessInfo]
    total_count: int
    page: int = Field(default=1)
    page_size: int = Field(default=50)
    categories: Dict[str, int] = Field(default_factory=dict, description="Process count per category")


class ProcessListResponse(BaseModel):
    """Response containing list of processes."""
    processes: List[ProcessInfo]
    total_count: int
    page: int = Field(default=1)
    page_size: int = Field(default=50)


class KillProcessPayload(BaseModel):
    """Payload for killing a process."""
    pid: int = Field(..., description="Process ID to kill")
    force: bool = Field(default=False, description="Use SIGKILL instead of SIGTERM")


class KillProcessResponse(BaseModel):
    """Response from kill process attempt."""
    success: bool
    pid: int
    message: str