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

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError

from core import ScriptboardCore
from schemas import (
    AddPromptPayload,
    AttachmentTextPayload,
    ErrorCode,
    ErrorInfo,
    ErrorResponse,
    PromptPreloadedPayload,
    TextPayload,
)

# Global ScriptboardCore instance
core = ScriptboardCore()

# Autosave debounce state
_autosave_task: Optional[asyncio.Task] = None

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
                # Save migrated config
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
    """Load a preloaded prompt by key from config.json."""
    config = load_config()
    prompts = config.get("prompts", {})
    
    if payload.key in prompts:
        prompt_data = prompts[payload.key]
        core.set_prompt(prompt_data["text"], source=f"preloaded:{payload.key}")
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

@app.get("/git/status")
async def get_git_status():
    """Check Git repository status."""
    try:
        from git import Repo, InvalidGitRepositoryError
        import os
        
        # Try to find git repo in current directory or parent
        current_dir = Path.cwd()
        repo_path = None
        
        for path in [current_dir, current_dir.parent]:
            git_path = path / ".git"
            if git_path.exists():
                repo_path = path
                break
        
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
    """Commit current session to git with validation."""
    try:
        from git import Repo, InvalidGitRepositoryError, GitCommandError
        import os
        
        message = payload.get("message", "Update Scriptboard session")
        session_path = payload.get("session_path")  # Optional: specific session file
        
        # Find git repo
        current_dir = Path.cwd()
        repo_path = None
        
        for path in [current_dir, current_dir.parent]:
            git_path = path / ".git"
            if git_path.exists():
                repo_path = path
                break
        
        if not repo_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not a git repository",
            )
        
        repo = Repo(repo_path)
        
        # If session_path provided, add that file; otherwise add all session files
        sessions_dir = get_sessions_dir()
        if session_path:
            session_file = Path(session_path)
            if not session_file.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session file not found",
                )
            repo.index.add([str(session_file)])
        else:
            # Add all session files
            for session_file in sessions_dir.glob("*.json"):
                if session_file.is_file():
                    repo.index.add([str(session_file)])
        
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

