"""
FastAPI application for Scriptboard backend.

This module provides the HTTP API layer that sits on top of ScriptboardCore.
All file I/O, validation, and error handling happens here - Core is pure business logic.
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, StreamingResponse
from fastapi.exceptions import RequestValidationError

from core import ScriptboardCore
from fileman import fileman_router
from orchestrator import router as orchestrator_router
from schemas import (
    AddPromptPayload,
    AttachmentTextPayload,
    ErrorCode,
    ErrorInfo,
    ErrorResponse,
    FavoriteEntry,
    MacroEvent,
    MacroRecordResponse,
    MacroSavePayload,
    PromptPreloadedPayload,
    TextPayload,
)

# Global ScriptboardCore instance
core = ScriptboardCore()

# Autosave debounce state
_autosave_task: Optional[asyncio.Task] = None

# Global KeyLogger instance
try:
    from key_logger import KeyLogger
    from key_logger import keyboard as _pynput_keyboard, pyperclip as _pyperclip
    key_logger = KeyLogger()
    print(f"[KeyLogger] Initialized successfully")
    print(f"[KeyLogger] pynput.keyboard available: {_pynput_keyboard is not None}")
    print(f"[KeyLogger] pyperclip available: {_pyperclip is not None}")
except ImportError as e:
    key_logger = None
    print(f"[KeyLogger] Failed to import: {e}")

# FastAPI app
app = FastAPI(title="Scriptboard API", version="0.1.0")

# CORS middleware - allow frontend to access API
# Must be added before other middleware/exception handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development (change to specific origins in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include FileManager router
app.include_router(fileman_router)

# Include Orchestrator router
app.include_router(orchestrator_router)


def get_config_path() -> Path:
    """Get path to user config file."""
    home = Path.home()
    config_dir = home / ".scriptboard"
    config_dir.mkdir(exist_ok=True)
    return config_dir / "config.json"


def get_sessions_dir() -> Path:
    """Get path to sessions directory."""
    home = Path.home()
    sessions_dir = home / ".scriptboard" / "sessions"
    sessions_dir.mkdir(parents=True, exist_ok=True)
    return sessions_dir


def get_autosave_path() -> Path:
    """Get path to autosave file."""
    home = Path.home()
    config_dir = home / ".scriptboard"
    config_dir.mkdir(exist_ok=True)
    return config_dir / "autosave.json"


def get_macros_dir() -> Path:
    """Get path to macros directory."""
    home = Path.home()
    macros_dir = home / ".scriptboard" / "macros"
    macros_dir.mkdir(parents=True, exist_ok=True)
    return macros_dir


def save_session(session_data: dict, filename: Optional[str] = None) -> Path:
    """
    Save session to JSON file.
    
    Args:
        session_data: Session dictionary from core.to_dict()
        filename: Optional filename (default: timestamp-based)
        
    Returns:
        Path to saved session file
    """
    sessions_dir = get_sessions_dir()
    
    if filename:
        session_path = sessions_dir / filename
    else:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_path = sessions_dir / f"{timestamp}.json"
    
    # Validate session data size (10MB limit)
    import sys
    size_estimate = sys.getsizeof(json.dumps(session_data))
    if size_estimate > 10 * 1024 * 1024:  # 10MB
        raise ValueError("Session data exceeds 10MB limit")
    
    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=2, ensure_ascii=False)
    
    return session_path


def load_session(session_path: Path) -> dict:
    """
    Load session from JSON file.
    
    Args:
        session_path: Path to session file
        
    Returns:
        Session dictionary
        
    Raises:
        FileNotFoundError: If session file doesn't exist
        ValueError: If session file is invalid
    """
    if not session_path.exists():
        raise FileNotFoundError(f"Session file not found: {session_path}")
    
    try:
        with open(session_path, "r", encoding="utf-8") as f:
            session_data = json.load(f)
        return session_data
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in session file: {e}")


def write_autosave(session_data: dict) -> None:
    """
    Write autosave file with rotation if >2MB.
    
    Args:
        session_data: Session dictionary from core.to_dict()
    """
    autosave_path = get_autosave_path()
    old_autosave_path = autosave_path.parent / "autosave.old.json"
    
    # Check size before writing
    import sys
    size_estimate = sys.getsizeof(json.dumps(session_data))
    
    # Rotate if current autosave exists and new data would exceed 2MB
    if autosave_path.exists() and size_estimate > 2 * 1024 * 1024:  # 2MB
        if old_autosave_path.exists():
            old_autosave_path.unlink()
        autosave_path.rename(old_autosave_path)
    
    # Write autosave
    with open(autosave_path, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=2, ensure_ascii=False)


def read_autosave() -> Optional[dict]:
    """
    Read autosave file if it exists.
    
    Returns:
        Session dictionary or None if autosave doesn't exist
    """
    autosave_path = get_autosave_path()
    
    if not autosave_path.exists():
        return None
    
    try:
        with open(autosave_path, "r", encoding="utf-8") as f:
            session_data = json.load(f)
        return session_data
    except (json.JSONDecodeError, IOError):
        # Try old autosave if current is corrupted
        old_autosave_path = autosave_path.parent / "autosave.old.json"
        if old_autosave_path.exists():
            try:
                with open(old_autosave_path, "r", encoding="utf-8") as f:
                    session_data = json.load(f)
                return session_data
            except (json.JSONDecodeError, IOError):
                return None
        return None


def load_profile(profile_name: str) -> dict:
    """
    Load a workspace profile from config.
    
    Args:
        profile_name: Name of the profile to load
        
    Returns:
        Profile dictionary with favorites and view_settings
        
    Raises:
        ValueError: If profile not found
    """
    config = load_config()
    profiles = config.get("workspace_profiles", [])
    
    for profile in profiles:
        if profile.get("name") == profile_name:
            return profile
    
    raise ValueError(f"Profile '{profile_name}' not found")


def apply_profile_to_core(profile_name: str) -> None:
    """
    Apply a profile to the core instance.
    Updates favorites and view settings without overwriting session text.
    
    Args:
        profile_name: Name of the profile to apply
    """
    profile = load_profile(profile_name)
    
    # Update favorites if profile has them
    if "favorites" in profile:
        favorites = [
            (item.get("label", ""), item.get("path", ""))
            for item in profile["favorites"]
            if isinstance(item, dict)
        ]
        if favorites:
            core.favorites = favorites
    
    # Update current profile name
    core.current_profile = profile_name
    
    # Note: View settings are handled by frontend, not core


def generate_next_prompt_key(prompts: dict) -> str:
    """
    Generate the next available 4-digit numeric key for a prompt.
    
    Args:
        prompts: Dictionary of existing prompts with keys
        
    Returns:
        Next available 4-digit key (e.g., "0001", "0002", etc.)
    """
    # Find all numeric keys (4-digit format: 0001-9999)
    numeric_keys = []
    for key in prompts.keys():
        # Check if key is numeric (could be "1", "2", "0001", "0002", etc.)
        if key.isdigit():
            numeric_keys.append(int(key))
    
    # If no numeric keys exist, start at 1
    if not numeric_keys:
        return "0001"
    
    # Find the maximum and increment
    max_key = max(numeric_keys)
    next_key = max_key + 1
    
    # Format as 4-digit zero-padded string
    return f"{next_key:04d}"


def migrate_prompt_keys_to_4digit(prompts: dict) -> dict:
    """
    Migrate existing prompt keys to 4-digit format.
    Converts "1" -> "0001", "2" -> "0002", etc.
    
    Args:
        prompts: Dictionary of prompts with potentially non-4-digit keys
        
    Returns:
        New dictionary with all numeric keys converted to 4-digit format
    """
    migrated = {}
    for key, value in prompts.items():
        # If key is numeric, convert to 4-digit format
        if key.isdigit():
            new_key = f"{int(key):04d}"
            migrated[new_key] = value
        else:
            # Non-numeric keys are kept as-is (shouldn't happen, but safe)
            migrated[key] = value
    return migrated


def sync_prompts_from_settings(config_prompts: dict) -> tuple[dict, bool]:
    """
    Sync prompts from settings.py into config.json.

    - Adds any NEW prompts from settings.py that don't exist in config
    - Preserves existing prompts (doesn't overwrite)
    - Uses label matching to detect duplicates

    Returns:
        tuple: (updated_prompts_dict, was_modified)
    """
    from settings import PRELOADED_PROMPTS

    # Get existing labels to avoid duplicates
    existing_labels = {p["label"] for p in config_prompts.values()}

    modified = False
    for key, (label, text) in PRELOADED_PROMPTS.items():
        if label not in existing_labels:
            # New prompt - add it
            new_key = generate_next_prompt_key(config_prompts)
            config_prompts[new_key] = {"label": label, "text": text}
            modified = True

    return config_prompts, modified


def load_config() -> dict:
    """
    Load configuration from ~/.scriptboard/config.json with validation and fallback to defaults.
    
    Returns:
        Configuration dictionary
    """
    config_path = get_config_path()
    
    # If config doesn't exist, return defaults with 4-digit keys
    if not config_path.exists():
        from settings import DEFAULT_FAVORITES, DEFAULT_LLM_URLS, PRELOADED_PROMPTS
        # Convert PRELOADED_PROMPTS to JSON format with 4-digit keys
        prompts = {}
        for key, (label, text) in PRELOADED_PROMPTS.items():
            # Convert to 4-digit format
            new_key = f"{int(key):04d}" if key.isdigit() else key
            prompts[new_key] = {"label": label, "text": text}
        return {
            "favorites": [{"label": label, "path": path} for label, path in DEFAULT_FAVORITES],
            "llm_urls": [{"label": label, "url": url} for label, url in DEFAULT_LLM_URLS],
            "workspace_profiles": [],
            "view_defaults": {
                "show_favorites": True,
                "show_prompt": True,
                "show_attachments": True,
                "show_responses": True,
                "show_manager": True,
                "show_preview": True,
            },
            "keymap": {},
            "theme": None,
            "prompts": prompts,
        }
    
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        
        # Validate and apply defaults for missing fields
        if "favorites" not in config:
            from settings import DEFAULT_FAVORITES
            config["favorites"] = [{"label": label, "path": path} for label, path in DEFAULT_FAVORITES]
        
        if "llm_urls" not in config:
            from settings import DEFAULT_LLM_URLS
            config["llm_urls"] = [{"label": label, "url": url} for label, url in DEFAULT_LLM_URLS]
        
        if "workspace_profiles" not in config:
            config["workspace_profiles"] = []
        
        if "view_defaults" not in config:
            config["view_defaults"] = {
                "show_favorites": True,
                "show_prompt": True,
                "show_attachments": True,
                "show_responses": True,
                "show_manager": True,
                "show_preview": True,
            }
        
        if "keymap" not in config:
            config["keymap"] = {}
        
        if "theme" not in config:
            config["theme"] = None
        
        # Initialize prompts: migrate defaults from settings.py to config.json if not present
        if "prompts" not in config:
            from settings import PRELOADED_PROMPTS
            # Convert Python dict format to JSON format with 4-digit keys
            prompts = {}
            for key, (label, text) in PRELOADED_PROMPTS.items():
                # Convert to 4-digit format
                new_key = f"{int(key):04d}" if key.isdigit() else key
                prompts[new_key] = {
                    "label": label,
                    "text": text
                }
            config["prompts"] = prompts
            # Save migrated prompts to config file
            try:
                config_path = get_config_path()
                with open(config_path, "w", encoding="utf-8") as f:
                    json.dump(config, f, indent=2, ensure_ascii=False)
            except (IOError, OSError):
                pass  # If save fails, continue with in-memory config
        else:
            # Migrate existing keys to 4-digit format if needed
            prompts = config["prompts"]
            needs_migration = False
            for key in prompts.keys():
                # Check if key is numeric but not 4-digit format
                if key.isdigit() and len(key) < 4:
                    needs_migration = True
                    break
            
            if needs_migration:
                # Migrate all keys to 4-digit format
                config["prompts"] = migrate_prompt_keys_to_4digit(prompts)
            
            # Sync any new prompts from settings.py
            config["prompts"], sync_modified = sync_prompts_from_settings(config["prompts"])
            
            # Save if migration or sync occurred
            if needs_migration or sync_modified:
                try:
                    config_path = get_config_path()
                    import tempfile
                    import shutil
                    temp_path = config_path.with_suffix(".tmp")
                    with open(temp_path, "w", encoding="utf-8") as f:
                        json.dump(config, f, indent=2, ensure_ascii=False)
                    shutil.move(str(temp_path), str(config_path))
                except (IOError, OSError):
                    pass  # If save fails, continue with in-memory config
        
        return config
    
    except (json.JSONDecodeError, IOError) as e:
        # Invalid config - return defaults with 4-digit keys
        from settings import DEFAULT_FAVORITES, DEFAULT_LLM_URLS, PRELOADED_PROMPTS
        # Convert PRELOADED_PROMPTS to JSON format with 4-digit keys
        prompts = {}
        for key, (label, text) in PRELOADED_PROMPTS.items():
            # Convert to 4-digit format
            new_key = f"{int(key):04d}" if key.isdigit() else key
            prompts[new_key] = {"label": label, "text": text}
        return {
            "favorites": [{"label": label, "path": path} for label, path in DEFAULT_FAVORITES],
            "llm_urls": [{"label": label, "url": url} for label, url in DEFAULT_LLM_URLS],
            "workspace_profiles": [],
            "view_defaults": {
                "show_favorites": True,
                "show_prompt": True,
                "show_attachments": True,
                "show_responses": True,
                "show_manager": True,
                "show_preview": True,
            },
            "keymap": {},
            "theme": None,
            "prompts": prompts,
        }


# --------------------------------------------------------------------------- #
# Error Handlers
# --------------------------------------------------------------------------- #

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Convert HTTPException to standard error envelope."""
    # Skip handling for OPTIONS requests (CORS preflight) - let CORS middleware handle it
    if request.method == "OPTIONS":
        return JSONResponse(status_code=200, content={})
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=ErrorInfo(
                code=ErrorCode.INTERNAL_ERROR,  # Default, can be overridden
                message=exc.detail,
                details={"status_code": exc.status_code},
            )
        ).dict()
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Convert validation errors to standard error envelope."""
    # Skip handling for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return JSONResponse(status_code=200, content={})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error=ErrorInfo(
                code=ErrorCode.VALIDATION_ERROR,
                message="Request validation failed",
                details={"errors": exc.errors()},
            )
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler with standard error envelope."""
    # Skip handling for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return JSONResponse(status_code=200, content={})
    # Log the exception (in production, use proper logging)
    import traceback
    traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error=ErrorInfo(
                code=ErrorCode.INTERNAL_ERROR,
                message="An internal error occurred",
                details={},  # Never expose stack traces to frontend
            )
        ).dict()
    )


async def _debounced_autosave():
    """Debounced autosave function (1s delay)."""
    await asyncio.sleep(1.0)  # 1 second debounce
    
    try:
        session_data = core.to_dict()
        # Run write_autosave in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, write_autosave, session_data)
    except Exception:
        # Silently fail autosave - don't break user workflow
        pass


def trigger_autosave():
    """Trigger autosave with 1s debounce."""
    global _autosave_task
    
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No event loop running, skip autosave
        return
    
    # Cancel previous autosave task if it exists
    if _autosave_task and not _autosave_task.done():
        _autosave_task.cancel()
    
    # Create new autosave task
    _autosave_task = loop.create_task(_debounced_autosave())


# Initialize core with config on startup
@app.on_event("startup")
async def startup_event():
    """Load configuration and initialize core on startup."""
    config = load_config()
    favorites = [(item["label"], item["path"]) for item in config.get("favorites", [])]
    llm_urls = [(item["label"], item["url"]) for item in config.get("llm_urls", [])]
    
    # Reinitialize core with loaded config
    global core
    core = ScriptboardCore(favorites=favorites, llm_urls=llm_urls)


# --------------------------------------------------------------------------- #
# Root and Health Endpoints
# --------------------------------------------------------------------------- #

@app.get("/")
async def root():
    """Root endpoint - redirects to API documentation."""
    return RedirectResponse(url="/docs")


@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    """Handle all OPTIONS requests for CORS preflight."""
    # Return empty 200 response with CORS headers
    # The CORS middleware will add the actual headers
    return JSONResponse(status_code=200, content={})


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/favicon.ico")
async def favicon():
    """Favicon endpoint to silence browser requests."""
    from fastapi.responses import Response
    return Response(status_code=204)  # No Content


@app.get("/session")
async def get_session():
    """Get current session summary."""
    from schemas import SessionSummary
    
    summary = core.get_session_summary()
    return SessionSummary(**summary)


# --------------------------------------------------------------------------- #
# Prompt Endpoints
# --------------------------------------------------------------------------- #

@app.post("/prompt")
async def set_prompt(payload: TextPayload):
    """Set the current prompt from text."""
    core.set_prompt(payload.text, source="manual")
    trigger_autosave()
    return {"status": "ok"}


@app.delete("/prompt")
async def clear_prompt():
    """Clear the current prompt."""
    core.clear_prompt()
    trigger_autosave()
    return {"status": "ok"}


@app.get("/prompts")
async def get_preloaded_prompts():
    """Get list of all available preloaded prompts from config.json."""
    from schemas import PreloadedPromptItem, PreloadedPromptsResponse
    
    config = load_config()
    prompts_dict = config.get("prompts", {})
    
    # Convert to list
    prompts = []
    for key, prompt_data in prompts_dict.items():
        label = prompt_data["label"]
        text = prompt_data["text"]
        # Get first 100 characters as preview
        preview = text[:100] + "..." if len(text) > 100 else text
        prompts.append(PreloadedPromptItem(
            key=key,
            label=label,
            preview=preview
        ))
    
    return PreloadedPromptsResponse(prompts=prompts)


@app.post("/prompts")
async def add_preloaded_prompt(payload: AddPromptPayload):
    """Add a new preloaded prompt to config.json with auto-generated 4-digit key."""
    config = load_config()
    prompts = config.get("prompts", {})
    
    # Auto-generate next 4-digit key
    new_key = generate_next_prompt_key(prompts)
    
    # Add to prompts
    prompts[new_key] = {
        "label": payload.label,
        "text": payload.text
    }
    config["prompts"] = prompts
    
    # Save config
    config_path = get_config_path()
    try:
        # Atomic write: write to temp file, then rename
        import tempfile
        import shutil
        temp_path = config_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        shutil.move(str(temp_path), str(config_path))
    except (IOError, OSError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save prompt: {str(e)}"
        )
    
    return {"status": "ok", "key": new_key}


@app.post("/prompt/preloaded")
async def use_preloaded_prompt(payload: PromptPreloadedPayload):
    """Load a preloaded prompt by key from config.json.

    Supports dynamic placeholders:
    - {{DATE}} - Replaced with current date (e.g., December 11, 2025)
    """
    from datetime import datetime

    config = load_config()
    prompts = config.get("prompts", {})

    if payload.key in prompts:
        prompt_data = prompts[payload.key]
        prompt_text = prompt_data["text"]

        # Replace dynamic placeholders
        today = datetime.now().strftime("%B %d, %Y")  # e.g., "December 11, 2025"
        prompt_text = prompt_text.replace("{{DATE}}", today)

        core.set_prompt(prompt_text, source=f"preloaded:{payload.key}")
        trigger_autosave()
        return {"status": "ok"}

    raise HTTPException(
        status_code=404,
        detail=f"Preloaded prompt '{payload.key}' not found"
    )


# --------------------------------------------------------------------------- #
# Attachment Endpoints
# --------------------------------------------------------------------------- #

@app.post("/attachments/text")
async def add_attachment_text(payload: AttachmentTextPayload):
    """Add an attachment from text content."""
    attachment = core.add_attachment_from_text(
        payload.text,
        suggested_name=payload.suggested_name
    )
    trigger_autosave()
    from schemas import AttachmentSummary
    return AttachmentSummary(
        id=attachment.id,
        filename=attachment.filename,
        lines=attachment.lines,
        binary=attachment.binary,
    )


@app.get("/attachments")
async def list_attachments():
    """Get list of all attachments."""
    from schemas import AttachmentSummary
    attachments = core.list_attachments()
    return [AttachmentSummary(
        id=att.id,
        filename=att.filename,
        lines=att.lines,
        binary=att.binary,
    ) for att in attachments]


@app.post("/attachments/folder")
async def import_folder(payload: dict):
    """Import all text files from a folder recursively."""
    folder_path = payload.get("path")
    
    if not folder_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder path is required",
        )
    
    # Validate path
    try:
        folder = Path(folder_path)
        if not folder.exists() or not folder.is_dir():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid folder path",
            )
    except (OSError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid path: {str(e)}",
        )
    
    # Recursively find all text files
    text_extensions = {".txt", ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".md", ".yml", ".yaml", ".xml", ".html", ".css", ".scss", ".sql", ".sh", ".bat", ".ps1"}
    imported = []
    skipped = []
    
    for file_path in folder.rglob("*"):
        if file_path.is_file():
            # Check if it's a text file
            if file_path.suffix.lower() in text_extensions or file_path.suffix == "":
                try:
                    # Try to read as text
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                    # Check if it's actually text (basic heuristic: no null bytes)
                    if "\x00" not in content:
                        # Add as attachment
                        rel_path = file_path.relative_to(folder)
                        core.add_attachment_from_text(
                            content,
                            suggested_name=str(rel_path)
                        )
                        imported.append(str(rel_path))
                    else:
                        skipped.append(str(file_path.relative_to(folder)))
                except Exception as e:
                    skipped.append(str(file_path.relative_to(folder)))
            else:
                # Binary file - add as metadata only
                rel_path = file_path.relative_to(folder)
                core.add_attachment_from_path(str(file_path), content="", binary=True)
                imported.append(f"{rel_path} (binary)")
    
    trigger_autosave()
    
    return {
        "status": "ok",
        "imported": len(imported),
        "skipped": len(skipped),
        "files": imported[:50],  # Limit to first 50 for response size
    }


@app.delete("/attachments")
async def clear_attachments():
    """Clear all attachments."""
    core.clear_attachments()
    trigger_autosave()
    return {"status": "ok"}


# --------------------------------------------------------------------------- #
# Response Endpoints
# --------------------------------------------------------------------------- #

@app.post("/responses")
async def add_response(payload: TextPayload):
    """Add a new LLM response."""
    response = core.add_response(payload.text, source="manual")
    trigger_autosave()
    from schemas import ResponseSummaryItem
    return ResponseSummaryItem(
        id=response.id,
        source=response.source,
        char_count=response.char_count,
    )


@app.get("/responses/summary")
async def get_responses_summary():
    """Get summary of all responses."""
    from schemas import ResponseSummary
    summary = core.responses_summary()
    return ResponseSummary(**summary)


@app.get("/responses")
async def get_responses():
    """Get all responses with full content."""
    from schemas import ResponseSummaryItem
    responses = [
        ResponseSummaryItem(
            id=resp.id,
            source=resp.source,
            char_count=resp.char_count,
        )
        for resp in core.responses
    ]
    # Return full response data including content
    return {
        "responses": [
            {
                "id": resp.id,
                "source": resp.source,
                "content": resp.content,
                "char_count": resp.char_count,
            }
            for resp in core.responses
        ]
    }


@app.delete("/responses")
async def clear_responses():
    """Clear all responses."""
    core.clear_responses()
    trigger_autosave()
    return {"status": "ok"}


# --------------------------------------------------------------------------- #
# Preview and Export Endpoints
# --------------------------------------------------------------------------- #

@app.get("/preview")
async def get_preview():
    """Get truncated preview of session content."""
    from schemas import PreviewResponse
    preview_text = core.build_preview()
    return PreviewResponse(preview=preview_text)


@app.get("/preview/full")
async def get_preview_full():
    """Get full combined preview without truncation."""
    from schemas import PreviewResponse
    preview_text = core.build_combined_preview()
    return PreviewResponse(preview=preview_text)


@app.get("/export/markdown")
async def export_markdown():
    """Export session as Markdown."""
    preview = core.build_combined_preview()
    
    # Convert preview to markdown format
    markdown = preview.replace("=== PROMPT ===", "# Prompt\n\n")
    markdown = markdown.replace("=== ATTACHMENTS ===", "\n\n# Attachments\n\n")
    markdown = markdown.replace("=== RESPONSES ===", "\n\n# Responses\n\n")
    
    return {
        "markdown": markdown,
        "filename": f"scriptboard_{int(time.time())}.md",
    }


@app.get("/export/json")
async def export_json():
    """Export entire session as JSON."""
    session_dict = core.to_dict()
    return session_dict


# More specific routes must come before less specific ones in FastAPI
@app.get("/export/llm/prompt")
async def export_llm_friendly_prompt():
    """Export prompt only in LLM-friendly text format."""
    text = core.build_llm_friendly_prompt()
    return {"text": text}


@app.get("/export/llm/attachments")
async def export_llm_friendly_attachments():
    """Export attachments only in LLM-friendly text format."""
    text = core.build_llm_friendly_attachments()
    return {"text": text}


@app.get("/export/llm/responses")
async def export_llm_friendly_responses():
    """Export responses only in LLM-friendly text format."""
    text = core.build_llm_friendly_responses()
    return {"text": text}


@app.get("/export/llm")
async def export_llm_friendly():
    """Export session in LLM-friendly text format for pasting into chat interfaces."""
    text = core.build_llm_friendly_export()
    return {"text": text}


# --------------------------------------------------------------------------- #
# Search Endpoint
# --------------------------------------------------------------------------- #

@app.get("/search")
async def search(q: str, limit: int = 20, offset: int = 0):
    """Search across prompt, attachments, and responses."""
    from schemas import SearchResponse
    results = core.search(q, limit=limit, offset=offset)
    return SearchResponse(**results)


# --------------------------------------------------------------------------- #
# Tokens Endpoint
# --------------------------------------------------------------------------- #

@app.get("/tokens")
async def get_tokens():
    """Get token counts for prompt, attachments, and responses."""
    from schemas import TokenCounts
    counts = core.get_token_counts()
    return TokenCounts(**counts)


# --------------------------------------------------------------------------- #
# Session and Autosave Endpoints
# --------------------------------------------------------------------------- #

@app.post("/sessions/save")
async def save_session_endpoint(filename: Optional[str] = None):
    """Save current session to file."""
    session_data = core.to_dict()
    try:
        session_path = save_session(session_data, filename=filename)
        return {
            "status": "ok",
            "path": str(session_path),
            "filename": session_path.name,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/sessions/load")
async def load_session_endpoint(payload: dict):
    """
    Load session from file.
    
    Expected payload: {"path": "path/to/session.json"}
    """
    session_path_str = payload.get("path")
    if not session_path_str:
        raise HTTPException(status_code=400, detail="Missing 'path' in payload")
    
    session_path = Path(session_path_str)
    
    # Security: Validate path is within sessions directory
    sessions_dir = get_sessions_dir()
    try:
        session_path = session_path.resolve()
        sessions_dir = sessions_dir.resolve()
        if not str(session_path).startswith(str(sessions_dir)):
            raise HTTPException(status_code=403, detail="Session path outside allowed directory")
    except (OSError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid session path")
    
    try:
        session_data = load_session(session_path)
        core.load_from_dict(session_data)
        return {"status": "ok"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session file not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/autosave/status")
async def get_autosave_status():
    """Get autosave file status."""
    autosave_path = get_autosave_path()
    old_autosave_path = autosave_path.parent / "autosave.old.json"
    
    has_autosave = autosave_path.exists()
    has_old_autosave = old_autosave_path.exists()
    
    size = 0
    if has_autosave:
        size = autosave_path.stat().st_size
    
    return {
        "has_autosave": has_autosave,
        "has_old_autosave": has_old_autosave,
        "size": size,
        "path": str(autosave_path) if has_autosave else None,
    }


@app.post("/autosave/recover")
async def recover_autosave():
    """Recover session from autosave file."""
    session_data = read_autosave()
    
    if session_data is None:
        raise HTTPException(status_code=404, detail="No autosave file found")
    
    try:
        core.load_from_dict(session_data)
        return {"status": "ok", "recovered": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recover autosave: {str(e)}")


# --------------------------------------------------------------------------- #
# Profiles and Config Endpoints
# --------------------------------------------------------------------------- #

@app.get("/profiles")
async def list_profiles():
    """Get list of available workspace profiles."""
    config = load_config()
    profiles = config.get("workspace_profiles", [])
    
    # Return just names and basic info (not full profile data)
    return {
        "profiles": [
            {
                "name": profile.get("name"),
                "has_favorites": bool(profile.get("favorites")),
                "has_view_settings": bool(profile.get("view_settings")),
            }
            for profile in profiles
        ]
    }


@app.post("/profiles/load")
async def load_profile_endpoint(payload: dict):
    """
    Load a workspace profile.
    
    Expected payload: {"name": "profile_name"}
    """
    profile_name = payload.get("name")
    if not profile_name:
        raise HTTPException(status_code=400, detail="Missing 'name' in payload")
    
    try:
        apply_profile_to_core(profile_name)
        return {"status": "ok", "profile": profile_name}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --------------------------------------------------------------------------- #
# Batch Processing Queue Endpoints (Phase-2)
# --------------------------------------------------------------------------- #

@app.post("/batch/enqueue")
async def enqueue_batch(payload: dict):
    """Enqueue batch processing jobs for a prompt across multiple models."""
    prompt = payload.get("prompt", "")
    models = payload.get("models", [])
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt is required",
        )
    
    if not models:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one model is required",
        )
    
    jobs = core.enqueue_batch(prompt, models)
    trigger_autosave()
    
    from schemas import BatchJobStatus
    return {
        "jobs": [
            {
                "id": job.id,
                "prompt": job.prompt,
                "model": job.model,
                "status": job.status.value,
                "error": job.error,
            }
            for job in jobs
        ]
    }


@app.get("/batch/jobs")
async def get_batch_jobs():
    """Get all batch processing jobs."""
    jobs = core.get_batch_jobs()
    from schemas import BatchJobStatus
    return {
        "jobs": [
            {
                "id": job.id,
                "prompt": job.prompt,
                "model": job.model,
                "status": job.status.value,
                "error": job.error,
            }
            for job in jobs
        ]
    }


@app.post("/batch/jobs/{job_id}/cancel")
async def cancel_batch_job(job_id: str):
    """Cancel a batch processing job."""
    from schemas import BatchJobStatus
    jobs = core.get_batch_jobs()
    job = next((j for j in jobs if j.id == job_id), None)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    
    if job.status in (BatchJobStatus.COMPLETED, BatchJobStatus.DONE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed job",
        )
    
    job.status = BatchJobStatus.CANCELLED
    job.error = "Cancelled by user"
    trigger_autosave()
    
    return {
        "id": job.id,
        "status": job.status.value,
    }


# --------------------------------------------------------------------------- #
# Direct LLM API Mode Endpoints (Phase-2)
# --------------------------------------------------------------------------- #

@app.get("/llm/providers")
async def get_llm_providers():
    """Get list of available LLM providers."""
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"],
            },
            {
                "id": "anthropic",
                "name": "Anthropic",
                "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
            },
        ],
        "note": "API keys must be configured in OS keychain. Use keyring library to store/retrieve keys.",
    }


@app.post("/llm/call")
async def call_llm_api(payload: dict):
    """Call LLM API directly with API key from keychain."""
    provider = payload.get("provider")
    model = payload.get("model")
    prompt = payload.get("prompt")
    
    if not all([provider, model, prompt]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider, model, and prompt are required",
        )
    
    # TODO: Implement actual LLM API calls
    # This requires:
    # 1. keyring library for OS keychain access
    # 2. openai and anthropic Python clients
    # 3. Error handling for API failures
    
    # Placeholder response
    return {
        "status": "not_implemented",
        "message": "Direct LLM API mode requires keychain integration. See PHASE2-003 in plan.",
        "provider": provider,
        "model": model,
    }


# --------------------------------------------------------------------------- #
# Git Integration Endpoints (Phase-2)
# --------------------------------------------------------------------------- #

def _find_git_repo(base_path: Optional[str] = None) -> Optional[Path]:
    """Find git repo from given path or cwd. Returns repo root path or None."""
    if base_path:
        search_path = Path(base_path).expanduser().resolve()
    else:
        search_path = Path.cwd()

    # Check provided path and its parent
    for path in [search_path, search_path.parent]:
        git_path = path / ".git"
        if git_path.exists():
            return path
    return None


@app.get("/git/status")
async def get_git_status(path: Optional[str] = Query(None, description="Path to git repository")):
    """Check Git repository status."""
    try:
        from git import Repo, InvalidGitRepositoryError

        repo_path = _find_git_repo(path)

        if not repo_path:
            return {
                "is_git_repo": False,
                "message": "Not a git repository",
            }

        repo = Repo(repo_path)

        # Check if there are uncommitted changes
        is_dirty = repo.is_dirty()
        untracked_files = repo.untracked_files

        return {
            "is_git_repo": True,
            "is_dirty": is_dirty,
            "untracked_files": untracked_files[:10],  # Limit to first 10
            "branch": repo.active_branch.name if repo.head.is_valid() else None,
            "repo_path": str(repo_path),
        }
    except ImportError:
        return {
            "is_git_repo": False,
            "message": "GitPython not available",
        }
    except Exception as e:
        # Return error info instead of raising exception
        return {
            "is_git_repo": False,
            "message": f"Git status check failed: {str(e)}",
        }


@app.post("/git/commit")
async def commit_session(payload: dict):
    """Commit to git repository. Supports custom repo path and staging options."""
    try:
        from git import Repo, InvalidGitRepositoryError, GitCommandError

        message = payload.get("message", "Update")
        repo_base_path = payload.get("path")  # Optional: custom repo path
        files_to_add = payload.get("files")  # Optional: specific files to stage
        add_all = payload.get("add_all", False)  # Stage all changes

        repo_path = _find_git_repo(repo_base_path)

        if not repo_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not a git repository",
            )

        repo = Repo(repo_path)

        # Stage files
        if add_all:
            repo.git.add(A=True)
        elif files_to_add:
            for f in files_to_add:
                file_path = Path(f)
                if file_path.exists():
                    repo.index.add([str(file_path)])
        else:
            # Default: add all tracked modified files
            repo.git.add(u=True)

        # Commit
        commit = repo.index.commit(message)

        return {
            "status": "ok",
            "commit_hash": commit.hexsha[:7],
            "message": commit.message,
        }
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitPython not available",
        )
    except GitCommandError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Git command failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Git commit failed: {str(e)}",
        )


@app.get("/git/branches")
async def get_git_branches(path: Optional[str] = Query(None, description="Path to git repository")):
    """List all branches (local and remote) for a git repository."""
    try:
        from git import Repo

        repo_path = _find_git_repo(path)
        if not repo_path:
            raise HTTPException(status_code=400, detail="Not a git repository")

        repo = Repo(repo_path)
        current_branch = repo.active_branch.name if repo.head.is_valid() else None

        branches = []

        # Local branches
        for branch in repo.branches:
            tracking = None
            if branch.tracking_branch():
                tracking = branch.tracking_branch().name
            branches.append({
                "name": branch.name,
                "is_current": branch.name == current_branch,
                "is_remote": False,
                "tracking": tracking,
            })

        # Remote branches
        for ref in repo.remotes.origin.refs if repo.remotes else []:
            if ref.name != "origin/HEAD":
                branches.append({
                    "name": ref.name,
                    "is_current": False,
                    "is_remote": True,
                    "tracking": None,
                })

        return {"branches": branches, "current": current_branch}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list branches: {str(e)}")


@app.post("/git/branches")
async def create_git_branch(payload: dict):
    """Create a new branch from current HEAD."""
    try:
        from git import Repo

        branch_name = payload.get("name")
        repo_base_path = payload.get("path")
        checkout = payload.get("checkout", False)  # Switch to new branch after creation

        if not branch_name:
            raise HTTPException(status_code=400, detail="Branch name is required")

        repo_path = _find_git_repo(repo_base_path)
        if not repo_path:
            raise HTTPException(status_code=400, detail="Not a git repository")

        repo = Repo(repo_path)

        # Create branch
        new_branch = repo.create_head(branch_name)

        # Optionally checkout
        if checkout:
            new_branch.checkout()

        return {
            "status": "ok",
            "branch": branch_name,
            "checked_out": checkout,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create branch: {str(e)}")


@app.post("/git/checkout")
async def git_checkout(payload: dict):
    """Switch to a different branch."""
    try:
        from git import Repo

        branch_name = payload.get("branch")
        repo_base_path = payload.get("path")

        if not branch_name:
            raise HTTPException(status_code=400, detail="Branch name is required")

        repo_path = _find_git_repo(repo_base_path)
        if not repo_path:
            raise HTTPException(status_code=400, detail="Not a git repository")

        repo = Repo(repo_path)

        # Check if working tree is clean (warn but allow)
        is_dirty = repo.is_dirty()

        # Handle remote branch checkout (create local tracking branch)
        if branch_name.startswith("origin/"):
            local_name = branch_name.replace("origin/", "")
            if local_name not in [b.name for b in repo.branches]:
                repo.create_head(local_name, branch_name)
            branch_name = local_name

        repo.git.checkout(branch_name)

        return {
            "status": "ok",
            "branch": branch_name,
            "had_uncommitted_changes": is_dirty,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")


@app.delete("/git/branches/{branch_name}")
async def delete_git_branch(
    branch_name: str,
    path: Optional[str] = Query(None, description="Path to git repository"),
    force: bool = Query(False, description="Force delete even if not merged"),
):
    """Delete a local branch."""
    try:
        from git import Repo

        repo_path = _find_git_repo(path)
        if not repo_path:
            raise HTTPException(status_code=400, detail="Not a git repository")

        repo = Repo(repo_path)

        # Safety check: can't delete current branch
        current = repo.active_branch.name if repo.head.is_valid() else None
        if branch_name == current:
            raise HTTPException(status_code=400, detail="Cannot delete the current branch")

        # Delete branch
        if force:
            repo.git.branch("-D", branch_name)
        else:
            repo.git.branch("-d", branch_name)

        return {"status": "ok", "deleted": branch_name}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete branch: {str(e)}")


@app.post("/git/pull")
async def git_pull(payload: dict):
    """Pull from remote origin."""
    try:
        from git import Repo

        repo_base_path = payload.get("path")
        remote_name = payload.get("remote", "origin")

        repo_path = _find_git_repo(repo_base_path)
        if not repo_path:
            raise HTTPException(status_code=400, detail="Not a git repository")

        repo = Repo(repo_path)

        # Pull
        result = repo.git.pull(remote_name)

        return {
            "status": "ok",
            "message": result or "Already up to date",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pull failed: {str(e)}")


@app.post("/git/push")
async def git_push(payload: dict):
    """Push to remote origin."""
    try:
        from git import Repo

        repo_base_path = payload.get("path")
        remote_name = payload.get("remote", "origin")
        set_upstream = payload.get("set_upstream", False)

        repo_path = _find_git_repo(repo_base_path)
        if not repo_path:
            raise HTTPException(status_code=400, detail="Not a git repository")

        repo = Repo(repo_path)
        current_branch = repo.active_branch.name

        # Push
        if set_upstream:
            result = repo.git.push("--set-upstream", remote_name, current_branch)
        else:
            result = repo.git.push(remote_name, current_branch)

        return {
            "status": "ok",
            "message": result or "Push successful",
            "branch": current_branch,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Push failed: {str(e)}")


@app.post("/git/scan")
async def scan_for_git_repos(payload: dict):
    """
    Scan a directory tree for git repositories.

    Request body:
        root: Base directory to scan
        max_depth: Maximum recursion depth (default 3, max 5)

    Returns list of discovered repos with path and name.
    """
    root = payload.get("root", "")
    max_depth = min(payload.get("max_depth", 3), 5)  # Cap at 5 for safety

    if not root:
        raise HTTPException(status_code=400, detail="Root path is required")

    root_path = Path(root).expanduser().resolve()
    if not root_path.exists():
        raise HTTPException(status_code=400, detail="Root path does not exist")
    if not root_path.is_dir():
        raise HTTPException(status_code=400, detail="Root path is not a directory")

    # Directories to skip during scan
    skip_dirs = {
        "node_modules", ".git", "__pycache__", "venv", ".venv",
        "env", ".env", "dist", "build", ".next", "target",
        "vendor", "packages", ".cargo", ".rustup"
    }

    repos = []

    def scan_directory(path: Path, depth: int):
        """Recursively scan for .git directories."""
        if depth > max_depth:
            return

        try:
            for entry in path.iterdir():
                if not entry.is_dir():
                    continue

                # Skip common non-project directories
                if entry.name in skip_dirs:
                    continue

                # Check if this directory is a git repo
                git_dir = entry / ".git"
                if git_dir.exists() and git_dir.is_dir():
                    repos.append({
                        "path": str(entry),
                        "name": entry.name
                    })
                    # Don't recurse into git repos (nested repos are rare)
                    continue

                # Recurse into subdirectory
                scan_directory(entry, depth + 1)

        except PermissionError:
            # Skip directories we can't access
            pass
        except Exception:
            # Skip any other errors and continue scanning
            pass

    # Start scanning
    scan_directory(root_path, 0)

    # Also check if root itself is a git repo
    if (root_path / ".git").exists():
        repos.insert(0, {
            "path": str(root_path),
            "name": root_path.name
        })

    # Sort by name
    repos.sort(key=lambda r: r["name"].lower())

    return {
        "repos": repos,
        "scanned_path": str(root_path),
        "count": len(repos)
    }


# --------------------------------------------------------------------------- #
# Config Endpoints
# --------------------------------------------------------------------------- #

@app.get("/config")
async def get_config_endpoint():
    """Get current configuration (without sensitive data)."""
    config = load_config()
    
    # Return config but exclude any sensitive fields (API keys, etc.)
    # For now, just return the full config as it doesn't contain secrets
    return config


@app.post("/favorites")
async def add_favorite(payload: FavoriteEntry):
    """Add a new favorite folder to config.json."""
    
    config = load_config()
    favorites = config.get("favorites", [])
    
    # Check for duplicates (same path)
    for fav in favorites:
        if fav.get("path") == payload.path:
            raise HTTPException(
                status_code=409,
                detail=f"Favorite with path '{payload.path}' already exists"
            )
    
    # Add new favorite
    favorites.append({
        "label": payload.label,
        "path": payload.path
    })
    config["favorites"] = favorites
    
    # Save config (atomic write)
    config_path = get_config_path()
    try:
        import tempfile
        import shutil
        temp_path = config_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        shutil.move(str(temp_path), str(config_path))
    except (IOError, OSError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save favorite: {str(e)}"
        )
    
    return {"status": "ok"}


@app.delete("/favorites/{index}")
async def remove_favorite(index: int):
    """Remove a favorite folder by index from config.json."""
    config = load_config()
    favorites = config.get("favorites", [])
    
    if index < 0 or index >= len(favorites):
        raise HTTPException(
            status_code=404,
            detail=f"Favorite at index {index} not found"
        )
    
    # Remove favorite at index
    favorites.pop(index)
    config["favorites"] = favorites
    
    # Save config (atomic write)
    config_path = get_config_path()
    try:
        import tempfile
        import shutil
        temp_path = config_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        shutil.move(str(temp_path), str(config_path))
    except (IOError, OSError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save config: {str(e)}"
        )
    
    return {"status": "ok"}





# --------------------------------------------------------------------------- #
# Macro / Key Logger Endpoints (Key-Logger feature)
# --------------------------------------------------------------------------- #

@app.post("/macros/record/start", response_model=MacroRecordResponse)
async def start_macro_recording():
    """Start recording keyboard and clipboard events."""
    if key_logger is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Key logger not available (pynput/pyperclip not installed)"
        )

    try:
        # Debug: Check if already recording
        if key_logger.is_recording():
            print("[KeyLogger] Warning: Already recording, stopping first...")
            try:
                key_logger.stop_recording()
            except Exception:
                pass

        key_logger.start_recording()
        return MacroRecordResponse(status="recording")
    except RuntimeError as e:
        # Provide more detailed error info
        error_msg = str(e)
        print(f"[KeyLogger] RuntimeError: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error_msg
        )
    except Exception as e:
        print(f"[KeyLogger] Unexpected error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start recording: {str(e)}"
        )


@app.post("/macros/record/stop", response_model=MacroRecordResponse)
async def stop_macro_recording():
    """Stop recording and return captured events."""
    if key_logger is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Key logger not available (pynput/pyperclip not installed)"
        )
    
    try:
        events = key_logger.stop_recording()
        
        # Convert MacroEvent dataclasses to Pydantic models
        pydantic_events = []
        for event in events:
            # Convert to dict first, then to Pydantic model
            event_dict = event.to_dict()
            pydantic_events.append(MacroEvent(**event_dict))
        
        return MacroRecordResponse(
            status="stopped",
            events=pydantic_events
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop recording: {str(e)}"
        )




@app.get("/macros/record/stream")
async def stream_macro_events():
    """
    SSE endpoint for streaming macro events in real-time during recording.

    Yields events as JSON every 100ms while recording is active.
    Sends 'done' event when recording stops.
    """
    if key_logger is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Key logger not available (pynput/pyperclip not installed)"
        )

    async def event_generator():
        """Async generator that yields SSE events."""
        last_event_count = 0
        started = False
        wait_count = 0
        max_wait = 30  # Wait up to 3 seconds for recording to start

        while True:
            is_rec = key_logger.is_recording()

            # Wait for recording to start (handles race condition)
            if not started and not is_rec:
                wait_count += 1
                if wait_count >= max_wait:
                    # Recording never started, send done
                    yield f"data: {json.dumps({'type': 'done', 'reason': 'timeout'})}\n\n"
                    break
                await asyncio.sleep(0.1)
                continue

            # Recording has started at least once
            if is_rec:
                started = True

            # Check if recording stopped (after it started)
            if started and not is_rec:
                # Send done event and close stream
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                break

            # Get current events
            events = key_logger.get_events()
            current_count = len(events)

            # If there are new events, send them
            if current_count > last_event_count:
                new_events = events[last_event_count:]
                for event in new_events:
                    event_data = event.to_dict()
                    yield f"data: {json.dumps(event_data)}\n\n"
                last_event_count = current_count

            # Wait 100ms before checking again
            await asyncio.sleep(0.1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )

@app.post("/macros/save")
async def save_macro(payload: MacroSavePayload):
    """Save a macro with name validation and atomic JSON write."""
    # Validate name (alphanumeric, spaces, hyphens, underscores only)
    import re
    if not re.match(r'^[a-zA-Z0-9\s_-]+$', payload.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Macro name can only contain alphanumeric characters, spaces, hyphens, and underscores"
        )
    
    # Validate events
    if not payload.events or len(payload.events) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Macro must contain at least one event"
        )
    
    # Generate macro ID and timestamp
    import uuid
    from datetime import datetime
    macro_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    # Create macro object
    macro_data = {
        "id": macro_id,
        "name": payload.name,
        "created_at": created_at,
        "events": [event.dict() for event in payload.events]
    }
    
    # Sanitize filename (replace invalid chars with underscores)
    safe_name = re.sub(r'[^\w\s-]', '_', payload.name)
    safe_name = re.sub(r'[-\s]+', '_', safe_name)
    filename = f"{safe_name}_{macro_id[:8]}.json"
    
    # Get macros directory
    macros_dir = get_macros_dir()
    macro_path = macros_dir / filename
    
    # Atomic write: write to temp file first, then move
    try:
        import tempfile
        import shutil
        temp_path = macro_path.with_suffix(".tmp")
        
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(macro_data, f, indent=2, ensure_ascii=False)
        
        # Atomic move
        shutil.move(str(temp_path), str(macro_path))
    except (IOError, OSError) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save macro: {str(e)}"
        )
    
    return {
        "id": macro_id,
        "name": payload.name,
        "path": str(macro_path),
        "created_at": created_at
    }


# --------------------------------------------------------------------------- #
# System Process Monitor Endpoints
# --------------------------------------------------------------------------- #

from collections import deque
import time as time_module

# Process history tracking (circular buffer for CPU/memory samples)
# Key: PID, Value: {"cpu": deque, "memory": deque, "last_update": timestamp}
PROCESS_HISTORY: dict = {}
HISTORY_MAX_SAMPLES = 60  # Keep last 60 samples
HISTORY_CLEANUP_INTERVAL = 300  # Clean up dead processes every 5 minutes
_last_history_cleanup = time_module.time()


def update_process_history(pid: int, cpu_percent: float, memory_mb: float):
    """Update history for a process."""
    global _last_history_cleanup

    if pid not in PROCESS_HISTORY:
        PROCESS_HISTORY[pid] = {
            "cpu": deque(maxlen=HISTORY_MAX_SAMPLES),
            "memory": deque(maxlen=HISTORY_MAX_SAMPLES),
            "last_update": time_module.time(),
        }

    PROCESS_HISTORY[pid]["cpu"].append(cpu_percent)
    PROCESS_HISTORY[pid]["memory"].append(memory_mb)
    PROCESS_HISTORY[pid]["last_update"] = time_module.time()

    # Periodic cleanup of dead processes
    if time_module.time() - _last_history_cleanup > HISTORY_CLEANUP_INTERVAL:
        cleanup_dead_process_history()
        _last_history_cleanup = time_module.time()


def get_process_history(pid: int) -> tuple[list[float], list[float]]:
    """Get CPU and memory history for a process."""
    if pid in PROCESS_HISTORY:
        return (
            list(PROCESS_HISTORY[pid]["cpu"]),
            list(PROCESS_HISTORY[pid]["memory"]),
        )
    return [], []


def cleanup_dead_process_history():
    """Remove history entries for processes that haven't updated recently."""
    cutoff = time_module.time() - HISTORY_CLEANUP_INTERVAL
    dead_pids = [pid for pid, data in PROCESS_HISTORY.items() if data["last_update"] < cutoff]
    for pid in dead_pids:
        del PROCESS_HISTORY[pid]


# Protected processes that cannot be killed
PROTECTED_PROCESSES = {
    # Windows system-critical
    "System", "csrss.exe", "wininit.exe", "smss.exe", "services.exe",
    "lsass.exe", "svchost.exe", "explorer.exe", "winlogon.exe",
    # Scriptboard app processes
    "Scriptboard.exe", "scriptboard-backend.exe", "scriptboard.exe",
    # Development processes
    "node.exe", "python.exe", "pythonw.exe", "uvicorn.exe",
}


def is_protected_process(name: str) -> bool:
    """Check if a process name is in the protected list."""
    return name.lower() in {p.lower() for p in PROTECTED_PROCESSES}


@app.get("/system/stats")
async def get_system_stats():
    """Get current system resource usage (CPU, RAM, Disk)."""
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    cpu = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    from schemas import SystemStats
    return SystemStats(
        cpu_percent=cpu,
        memory_percent=memory.percent,
        memory_used_gb=round(memory.used / (1024**3), 2),
        memory_total_gb=round(memory.total / (1024**3), 2),
        disk_percent=disk.percent,
        disk_used_gb=round(disk.used / (1024**3), 2),
        disk_total_gb=round(disk.total / (1024**3), 2),
    )


@app.get("/system/processes")
async def get_processes(
    page: int = 1,
    page_size: int = 50,
    sort_by: str = "cpu_percent",
    sort_order: str = "desc",
    filter_name: Optional[str] = None,
):
    """Get list of running processes with pagination and sorting."""
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    from schemas import ProcessInfo, ProcessListResponse

    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info', 'status']):
        try:
            info = proc.info
            name = info['name'] or ''

            # Apply name filter if provided
            if filter_name and filter_name.lower() not in name.lower():
                continue

            memory_mb = 0
            if info['memory_info']:
                memory_mb = round(info['memory_info'].rss / (1024**2), 2)

            processes.append(ProcessInfo(
                pid=info['pid'],
                name=name,
                cpu_percent=info['cpu_percent'] or 0.0,
                memory_percent=info['memory_percent'] or 0.0,
                memory_mb=memory_mb,
                status=info['status'] or 'unknown',
                is_protected=is_protected_process(name),
            ))
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    # Sort processes
    reverse = sort_order == "desc"
    if sort_by in ['cpu_percent', 'memory_percent', 'memory_mb', 'pid']:
        processes.sort(key=lambda p: getattr(p, sort_by), reverse=reverse)
    elif sort_by == 'name':
        processes.sort(key=lambda p: p.name.lower(), reverse=reverse)

    # Paginate
    total = len(processes)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = processes[start:end]

    return ProcessListResponse(
        processes=paginated,
        total_count=total,
        page=page,
        page_size=page_size,
    )


@app.get("/system/processes/app")
async def get_app_processes():
    """Get Scriptboard-related processes only."""
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    from schemas import ProcessInfo, ProcessListResponse

    # Scriptboard-related process patterns
    app_patterns = [
        "scriptboard", "uvicorn", "python", "node", "next",
        "electron", "scriptboard-backend"
    ]

    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info', 'status', 'cmdline']):
        try:
            info = proc.info
            name = (info['name'] or '').lower()
            cmdline = ' '.join(info['cmdline'] or []).lower()

            # Check if process matches app patterns
            is_app_process = any(
                pattern in name or pattern in cmdline
                for pattern in app_patterns
            )

            if not is_app_process:
                continue

            memory_mb = 0
            if info['memory_info']:
                memory_mb = round(info['memory_info'].rss / (1024**2), 2)

            processes.append(ProcessInfo(
                pid=info['pid'],
                name=info['name'] or '',
                cpu_percent=info['cpu_percent'] or 0.0,
                memory_percent=info['memory_percent'] or 0.0,
                memory_mb=memory_mb,
                status=info['status'] or 'unknown',
                is_protected=is_protected_process(info['name'] or ''),
            ))
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    # Sort by CPU usage
    processes.sort(key=lambda p: p.cpu_percent, reverse=True)

    return ProcessListResponse(
        processes=processes,
        total_count=len(processes),
        page=1,
        page_size=len(processes),
    )


@app.get("/system/processes/detailed")
async def get_detailed_processes(
    page: int = 1,
    page_size: int = 50,
    sort_by: str = "cpu_percent",
    sort_order: str = "desc",
    filter_name: Optional[str] = None,
    filter_category: Optional[str] = None,
    include_system: bool = True,
):
    """
    Get detailed process list with categories, descriptions, and history.

    Enhanced endpoint for System Monitor v2 with:
    - Process categorization (browser, dev, system, app, etc.)
    - Human-readable descriptions
    - Extended details (path, cmdline, threads, parent)
    - CPU/memory history (last 60 samples)
    - "New process" flag (started < 5 min ago)
    """
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    from datetime import datetime, timezone
    from schemas import DetailedProcessInfo, DetailedProcessListResponse, ProcessCategory
    from process_categories import get_process_info, get_safety_score, ProcessCategory as PCat

    # 5 minutes threshold for "new" processes
    NEW_PROCESS_THRESHOLD = 300
    current_time = time_module.time()

    processes = []
    category_counts: dict[str, int] = {}

    for proc in psutil.process_iter([
        'pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info',
        'status', 'exe', 'cmdline', 'ppid', 'num_threads', 'create_time'
    ]):
        try:
            info = proc.info
            name = info['name'] or ''

            # Apply name filter if provided
            if filter_name and filter_name.lower() not in name.lower():
                continue

            # Get category info
            proc_info = get_process_info(name)
            category_str = proc_info.category.value

            # Filter by category if specified
            if filter_category and category_str != filter_category:
                continue

            # Skip system processes if include_system is False
            if not include_system and proc_info.category == PCat.SYSTEM:
                continue

            # Memory calculation
            memory_mb = 0.0
            if info['memory_info']:
                memory_mb = round(info['memory_info'].rss / (1024**2), 2)

            # Update history
            update_process_history(info['pid'], info['cpu_percent'] or 0.0, memory_mb)

            # Get history for this process
            cpu_history, memory_history = get_process_history(info['pid'])

            # Calculate uptime and check if "new"
            start_time = None
            uptime_seconds = 0
            is_new = False
            if info['create_time']:
                try:
                    start_time = datetime.fromtimestamp(
                        info['create_time'], tz=timezone.utc
                    ).isoformat()
                    uptime_seconds = int(current_time - info['create_time'])
                    is_new = uptime_seconds < NEW_PROCESS_THRESHOLD
                except (OSError, ValueError):
                    pass

            # Get children count
            children_count = 0
            try:
                children_count = len(proc.children())
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

            # Get handles (Windows) or file descriptors (Unix)
            handles = 0
            try:
                handles = proc.num_handles() if hasattr(proc, 'num_handles') else proc.num_fds()
            except (psutil.NoSuchProcess, psutil.AccessDenied, AttributeError):
                pass

            # Build cmdline string
            cmdline_str = None
            if info['cmdline']:
                cmdline_str = ' '.join(info['cmdline'][:10])  # Limit to first 10 args
                if len(cmdline_str) > 500:
                    cmdline_str = cmdline_str[:500] + "..."

            # Map category enum
            category_enum = ProcessCategory(category_str)

            # Count categories
            category_counts[category_str] = category_counts.get(category_str, 0) + 1

            # Calculate safety score
            is_prot = is_protected_process(name)
            safety_score, safety_reason = get_safety_score(name, is_prot, proc_info.category)

            processes.append(DetailedProcessInfo(
                pid=info['pid'],
                name=name,
                cpu_percent=info['cpu_percent'] or 0.0,
                memory_percent=info['memory_percent'] or 0.0,
                memory_mb=memory_mb,
                status=info['status'] or 'unknown',
                is_protected=is_prot,
                category=category_enum,
                description=proc_info.description,
                icon=proc_info.icon,
                path=info['exe'],
                cmdline=cmdline_str,
                parent_pid=info['ppid'],
                children_count=children_count,
                threads=info['num_threads'] or 0,
                handles=handles,
                start_time=start_time,
                uptime_seconds=uptime_seconds,
                cpu_history=cpu_history,
                memory_history=memory_history,
                is_new=is_new,
                safe_to_kill_score=safety_score,
                kill_risk_reason=safety_reason,
            ))
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    # Sort processes
    reverse = sort_order == "desc"
    if sort_by in ['cpu_percent', 'memory_percent', 'memory_mb', 'pid', 'uptime_seconds', 'threads']:
        processes.sort(key=lambda p: getattr(p, sort_by), reverse=reverse)
    elif sort_by == 'name':
        processes.sort(key=lambda p: p.name.lower(), reverse=reverse)
    elif sort_by == 'start_time':
        # Sort by uptime (newest first when desc)
        processes.sort(key=lambda p: p.uptime_seconds, reverse=not reverse)
    elif sort_by == 'category':
        processes.sort(key=lambda p: p.category.value, reverse=reverse)

    # Paginate
    total = len(processes)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = processes[start:end]

    return DetailedProcessListResponse(
        processes=paginated,
        total_count=total,
        page=page,
        page_size=page_size,
        categories=category_counts,
    )


@app.get("/system/processes/{pid}/details")
async def get_process_details(pid: int):
    """Get detailed information for a single process by PID."""
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    from datetime import datetime, timezone
    from schemas import DetailedProcessInfo, ProcessCategory
    from process_categories import get_process_info, get_safety_score

    NEW_PROCESS_THRESHOLD = 300
    current_time = time_module.time()

    try:
        proc = psutil.Process(pid)
        info = proc.as_dict(attrs=[
            'pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info',
            'status', 'exe', 'cmdline', 'ppid', 'num_threads', 'create_time'
        ])
    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail=f"Process {pid} not found")
    except psutil.AccessDenied:
        raise HTTPException(status_code=403, detail=f"Access denied to process {pid}")

    name = info['name'] or ''
    proc_info = get_process_info(name)

    memory_mb = 0.0
    if info['memory_info']:
        memory_mb = round(info['memory_info'].rss / (1024**2), 2)

    # Update and get history
    update_process_history(pid, info['cpu_percent'] or 0.0, memory_mb)
    cpu_history, memory_history = get_process_history(pid)

    start_time = None
    uptime_seconds = 0
    is_new = False
    if info['create_time']:
        try:
            start_time = datetime.fromtimestamp(info['create_time'], tz=timezone.utc).isoformat()
            uptime_seconds = int(current_time - info['create_time'])
            is_new = uptime_seconds < NEW_PROCESS_THRESHOLD
        except (OSError, ValueError):
            pass

    children_count = 0
    try:
        children_count = len(proc.children())
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

    handles = 0
    try:
        handles = proc.num_handles() if hasattr(proc, 'num_handles') else proc.num_fds()
    except (psutil.NoSuchProcess, psutil.AccessDenied, AttributeError):
        pass

    cmdline_str = None
    if info['cmdline']:
        cmdline_str = ' '.join(info['cmdline'])
        if len(cmdline_str) > 1000:
            cmdline_str = cmdline_str[:1000] + "..."

    # Calculate safety score
    is_prot = is_protected_process(name)
    safety_score, safety_reason = get_safety_score(name, is_prot, proc_info.category)

    return DetailedProcessInfo(
        pid=info['pid'],
        name=name,
        cpu_percent=info['cpu_percent'] or 0.0,
        memory_percent=info['memory_percent'] or 0.0,
        memory_mb=memory_mb,
        status=info['status'] or 'unknown',
        is_protected=is_prot,
        category=ProcessCategory(proc_info.category.value),
        description=proc_info.description,
        icon=proc_info.icon,
        path=info['exe'],
        cmdline=cmdline_str,
        parent_pid=info['ppid'],
        children_count=children_count,
        threads=info['num_threads'] or 0,
        handles=handles,
        start_time=start_time,
        uptime_seconds=uptime_seconds,
        cpu_history=cpu_history,
        memory_history=memory_history,
        is_new=is_new,
        safe_to_kill_score=safety_score,
        kill_risk_reason=safety_reason,
    )


@app.post("/system/processes/kill")
async def kill_process(payload: dict):
    """Kill a process by PID with safeguards."""
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    from schemas import KillProcessResponse

    pid = payload.get("pid")
    force = payload.get("force", False)

    if not pid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PID is required"
        )

    try:
        proc = psutil.Process(pid)
        proc_name = proc.name()

        # Check if process is protected
        if is_protected_process(proc_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot kill protected process: {proc_name} (PID: {pid})"
            )

        # Attempt to kill
        if force:
            proc.kill()  # SIGKILL
        else:
            proc.terminate()  # SIGTERM

        # Wait briefly for process to terminate
        try:
            proc.wait(timeout=3)
            return KillProcessResponse(
                success=True,
                pid=pid,
                message=f"Process {proc_name} (PID: {pid}) terminated successfully"
            )
        except psutil.TimeoutExpired:
            return KillProcessResponse(
                success=True,
                pid=pid,
                message=f"Termination signal sent to {proc_name} (PID: {pid})"
            )

    except psutil.NoSuchProcess:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Process with PID {pid} not found"
        )
    except psutil.AccessDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied to kill process (PID: {pid})"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to kill process: {str(e)}"
        )


@app.get("/system/protected-processes")
async def get_protected_processes():
    """Get list of protected process names that cannot be killed."""
    return {"protected": list(PROTECTED_PROCESSES)}


# --------------------------------------------------------------------------- #
# Network/Port Monitoring Endpoints
# --------------------------------------------------------------------------- #

@app.get("/system/network/connections")
async def get_network_connections():
    """
    Get active network connections with process information.

    Returns all inet (TCP/UDP) connections with:
    - Local/remote addresses and ports
    - Connection status
    - Associated process info
    """
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    connections = []

    for conn in psutil.net_connections(kind='inet'):
        try:
            # Get process info if available
            proc_name = None
            if conn.pid:
                try:
                    proc = psutil.Process(conn.pid)
                    proc_name = proc.name()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Format local address
            local_addr = None
            local_port = None
            if conn.laddr:
                local_addr = conn.laddr.ip
                local_port = conn.laddr.port

            # Format remote address
            remote_addr = None
            remote_port = None
            if conn.raddr:
                remote_addr = conn.raddr.ip
                remote_port = conn.raddr.port

            connections.append({
                "pid": conn.pid,
                "process_name": proc_name,
                "local_addr": local_addr,
                "local_port": local_port,
                "remote_addr": remote_addr,
                "remote_port": remote_port,
                "status": conn.status,
                "type": "tcp" if conn.type == 1 else "udp",
                "family": "ipv4" if conn.family == 2 else "ipv6",
            })
        except (AttributeError, psutil.Error):
            continue

    # Sort by PID
    connections.sort(key=lambda c: (c["pid"] or 0, c["local_port"] or 0))

    return {
        "connections": connections,
        "total_count": len(connections),
    }


@app.get("/system/network/listening")
async def get_listening_ports():
    """
    Get all listening ports with associated process information.

    Returns ports in LISTEN state with:
    - Port number and protocol
    - Bound address
    - Process name and PID
    """
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    listening = []

    for conn in psutil.net_connections(kind='inet'):
        try:
            # Only include listening sockets
            if conn.status != 'LISTEN':
                continue

            # Get process info if available
            proc_name = None
            if conn.pid:
                try:
                    proc = psutil.Process(conn.pid)
                    proc_name = proc.name()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Format local address
            local_addr = None
            local_port = None
            if conn.laddr:
                local_addr = conn.laddr.ip
                local_port = conn.laddr.port

            listening.append({
                "pid": conn.pid,
                "process_name": proc_name,
                "address": local_addr,
                "port": local_port,
                "type": "tcp" if conn.type == 1 else "udp",
                "family": "ipv4" if conn.family == 2 else "ipv6",
            })
        except (AttributeError, psutil.Error):
            continue

    # Sort by port number
    listening.sort(key=lambda p: (p["port"] or 0))

    return {
        "listening": listening,
        "total_count": len(listening),
    }


@app.get("/system/network/pids-with-connections")
async def get_pids_with_network_connections():
    """
    Get list of PIDs that have active network connections.
    Used for quick filtering in process list.
    """
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    pids_with_connections = set()

    for conn in psutil.net_connections(kind='inet'):
        if conn.pid:
            pids_with_connections.add(conn.pid)

    return {
        "pids": list(pids_with_connections),
        "count": len(pids_with_connections),
    }


# --------------------------------------------------------------------------- #
# Disk Usage Analysis Endpoints
# --------------------------------------------------------------------------- #

@app.get("/system/disk/usage")
async def get_disk_usage():
    """
    Get disk usage information for all mounted drives.
    """
    try:
        import psutil
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="psutil not installed"
        )

    partitions = []
    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            partitions.append({
                "device": partition.device,
                "mountpoint": partition.mountpoint,
                "fstype": partition.fstype,
                "total_gb": round(usage.total / (1024**3), 2),
                "used_gb": round(usage.used / (1024**3), 2),
                "free_gb": round(usage.free / (1024**3), 2),
                "percent": usage.percent,
            })
        except (PermissionError, OSError):
            # Skip partitions we can't access
            continue

    return {
        "partitions": partitions,
        "count": len(partitions),
    }


@app.get("/system/disk/largest")
async def get_largest_folders(
    path: str = "C:\\Users",
    depth: int = 2,
    limit: int = 20,
):
    """
    Get largest folders under a given path.
    This is an expensive operation - use sparingly.

    Args:
        path: Root path to scan (default: C:\\Users)
        depth: How many levels deep to scan (default: 2)
        limit: Maximum number of results (default: 20)
    """
    from pathlib import Path

    def get_folder_size(folder_path: Path) -> int:
        """Calculate total size of folder."""
        total = 0
        try:
            for item in folder_path.rglob("*"):
                try:
                    if item.is_file():
                        total += item.stat().st_size
                except (PermissionError, OSError):
                    continue
        except (PermissionError, OSError):
            pass
        return total

    root = Path(path)
    if not root.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {path}")

    folders = []

    def scan_folder(folder: Path, current_depth: int):
        if current_depth > depth:
            return

        try:
            for item in folder.iterdir():
                if item.is_dir() and not item.name.startswith('.'):
                    try:
                        size = get_folder_size(item)
                        folders.append({
                            "path": str(item),
                            "name": item.name,
                            "size_bytes": size,
                            "size_mb": round(size / (1024**2), 2),
                            "size_gb": round(size / (1024**3), 2),
                            "depth": current_depth,
                        })
                        # Recurse if not at max depth
                        if current_depth < depth:
                            scan_folder(item, current_depth + 1)
                    except (PermissionError, OSError):
                        continue
        except (PermissionError, OSError):
            pass

    scan_folder(root, 1)

    # Sort by size descending and limit
    folders.sort(key=lambda f: f["size_bytes"], reverse=True)
    folders = folders[:limit]

    return {
        "folders": folders,
        "root": path,
        "count": len(folders),
    }


# --------------------------------------------------------------------------- #
# Startup Apps Detection (Windows)
# --------------------------------------------------------------------------- #

@app.get("/system/startup-apps")
async def get_startup_apps():
    """
    Get list of startup applications from Windows Registry.
    Returns apps configured to run at system startup.
    """
    import platform
    if platform.system() != "Windows":
        return {"apps": [], "count": 0, "message": "Only available on Windows"}

    try:
        import winreg
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="winreg not available"
        )

    startup_apps = []

    # Registry keys for startup apps
    registry_keys = [
        (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run"),
        (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\Run"),
        (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
        (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
    ]

    for hkey, subkey in registry_keys:
        try:
            key = winreg.OpenKey(hkey, subkey, 0, winreg.KEY_READ)
            try:
                i = 0
                while True:
                    try:
                        name, value, _ = winreg.EnumValue(key, i)
                        # Extract executable name from path
                        exe_name = ""
                        if value:
                            # Handle quoted paths and paths with arguments
                            path = value.strip('"').split('"')[0].strip()
                            if '\\' in path:
                                exe_name = path.split('\\')[-1]
                            else:
                                exe_name = path.split()[0] if ' ' in path else path

                        startup_apps.append({
                            "name": name,
                            "command": value,
                            "executable": exe_name.lower().replace('.exe', ''),
                            "registry_key": f"{'HKCU' if hkey == winreg.HKEY_CURRENT_USER else 'HKLM'}\\{subkey}",
                            "impact": estimate_startup_impact(exe_name),
                        })
                        i += 1
                    except OSError:
                        break
            finally:
                winreg.CloseKey(key)
        except (FileNotFoundError, PermissionError):
            continue

    return {
        "apps": startup_apps,
        "count": len(startup_apps),
    }


def estimate_startup_impact(exe_name: str) -> str:
    """
    Estimate startup impact based on executable name.
    Returns: 'high', 'medium', 'low'
    """
    exe_lower = exe_name.lower()

    high_impact = {'chrome', 'firefox', 'spotify', 'discord', 'steam', 'teams', 'slack', 'onedrive', 'dropbox'}
    medium_impact = {'securityhealth', 'defender', 'cortana', 'skype', 'outlook', 'nvidia'}

    for app in high_impact:
        if app in exe_lower:
            return "high"

    for app in medium_impact:
        if app in exe_lower:
            return "medium"

    return "low"


# --------------------------------------------------------------------------- #
# Entry Point for PyInstaller
# --------------------------------------------------------------------------- #

if __name__ == "__main__":
    import sys
    import os
    import multiprocessing

    # Required for PyInstaller on Windows to prevent infinite subprocess spawning
    multiprocessing.freeze_support()

    # Handle --noconsole mode where stdout/stderr are None (pythonw.exe)
    if sys.stdout is None:
        sys.stdout = open(os.devnull, 'w')
    if sys.stderr is None:
        sys.stderr = open(os.devnull, 'w')

    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

