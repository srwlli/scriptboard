"""FastAPI router for FileManager endpoints."""

import asyncio
import json
from pathlib import Path
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from . import core
from . import schemas

router = APIRouter(prefix="/fileman", tags=["FileManager"])


def _actions_to_response(actions: list, path: str) -> schemas.PreviewResponse:
    """Convert action list to PreviewResponse."""
    total_size = 0
    for action in actions:
        try:
            src_path = Path(action.src)
            if src_path.exists():
                total_size += src_path.stat().st_size
        except (OSError, AttributeError):
            pass

    return schemas.PreviewResponse(
        actions=[schemas.FileAction(**a.to_dict()) for a in actions],
        files_scanned=len(actions),
        total_size_bytes=total_size,
    )


@router.post("/organize", response_model=schemas.PreviewResponse)
async def organize_files(req: schemas.OrganizeRequest):
    """
    Organize files into folders by extension, date, or month.
    Returns preview by default; set apply=True to execute.
    """
    try:
        path = Path(req.path).expanduser().resolve()
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {req.path}")
        if not path.is_dir():
            raise HTTPException(status_code=400, detail="Path must be a directory")

        actions = core.cmd_organize(
            path=req.path,
            by=req.by,
            dest=req.dest,
            recursive=req.recursive,
            exclude=req.exclude,
            include=req.include,
            remove_empty=req.remove_empty,
            apply=req.apply,
        )

        response = _actions_to_response(actions, req.path)
        response.message = f"{'Applied' if req.apply else 'Preview'}: {len(actions)} files"
        return response

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=f"Permission denied: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rename", response_model=schemas.PreviewResponse)
async def rename_files(req: schemas.RenameRequest):
    """
    Bulk rename files with pattern replacement, prefix/suffix, case changes.
    Returns preview by default; set apply=True to execute.
    """
    try:
        path = Path(req.path).expanduser().resolve()
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {req.path}")

        actions = core.cmd_rename(
            path=req.path,
            pattern=req.pattern,
            replace=req.replace,
            prefix=req.prefix,
            suffix=req.suffix,
            lower=req.lower,
            upper=req.upper,
            sanitize=req.sanitize,
            enumerate_files=req.enumerate_files,
            start=req.start,
            step=req.step,
            width=req.width,
            ext_filter=req.ext_filter,
            recursive=req.recursive,
            exclude=req.exclude,
            apply=req.apply,
        )

        response = _actions_to_response(actions, req.path)
        response.message = f"{'Renamed' if req.apply else 'Preview'}: {len(actions)} files"
        return response

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=f"Permission denied: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clean", response_model=schemas.PreviewResponse)
async def clean_files(req: schemas.CleanRequest):
    """
    Archive or delete files based on age/size criteria.
    Returns preview by default; set apply=True to execute.
    """
    try:
        path = Path(req.path).expanduser().resolve()
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {req.path}")
        if not path.is_dir():
            raise HTTPException(status_code=400, detail="Path must be a directory")

        # Require at least one filter
        if req.older_than_days is None and req.larger_than_mb is None:
            raise HTTPException(
                status_code=400,
                detail="Must specify at least one filter: older_than_days or larger_than_mb"
            )

        actions = core.cmd_clean(
            path=req.path,
            older_than_days=req.older_than_days,
            larger_than_mb=req.larger_than_mb,
            archive_dir=req.archive_dir,
            use_trash=req.use_trash,
            delete_permanently=req.delete_permanently,
            remove_empty=req.remove_empty,
            recursive=req.recursive,
            exclude=req.exclude,
            apply=req.apply,
        )

        response = _actions_to_response(actions, req.path)
        response.message = f"{'Cleaned' if req.apply else 'Preview'}: {len(actions)} files"
        return response

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=f"Permission denied: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/index", response_model=schemas.IndexResponse)
async def index_files(req: schemas.IndexRequest):
    """
    Generate file inventory/index (non-streaming).
    For large directories, use /index/stream instead.
    """
    try:
        path = Path(req.path).expanduser().resolve()
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {req.path}")

        files = core.cmd_index(
            path=req.path,
            include_hash=req.include_hash,
            hash_algo=req.hash_algo,
            recursive=req.recursive,
            exclude=req.exclude,
        )

        total_size = sum(f.get("size_bytes", 0) for f in files)

        return schemas.IndexResponse(
            files=files,
            total_files=len(files),
            total_size_bytes=total_size,
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=f"Permission denied: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/index/stream")
async def index_files_stream(
    path: str = Query(..., description="Directory to index"),
    include_hash: bool = Query(False, description="Include file hashes"),
    hash_algo: str = Query("sha256", description="Hash algorithm"),
    recursive: bool = Query(True, description="Process subdirectories"),
    exclude: str = Query("", description="Comma-separated exclude patterns"),
):
    """
    Generate file index with SSE progress streaming.
    Returns Server-Sent Events with progress updates.
    """
    async def generate() -> AsyncGenerator[str, None]:
        try:
            resolved = Path(path).expanduser().resolve()
            if not resolved.exists():
                yield f"data: {json.dumps({'type': 'error', 'message': f'Path not found: {path}'})}\n\n"
                return

            exclude_list = [p.strip() for p in exclude.split(",") if p.strip()]

            for event in core.cmd_index_stream(
                path=path,
                include_hash=include_hash,
                hash_algo=hash_algo,
                recursive=recursive,
                exclude=exclude_list,
            ):
                yield f"data: {json.dumps(event)}\n\n"
                # Yield control to event loop to allow streaming
                await asyncio.sleep(0)

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/dupes", response_model=schemas.DupesResponse)
async def find_duplicates(req: schemas.DupesRequest):
    """
    Find duplicate files (non-streaming).
    For large directories, use /dupes/stream instead.
    """
    try:
        path = Path(req.path).expanduser().resolve()
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {req.path}")
        if not path.is_dir():
            raise HTTPException(status_code=400, detail="Path must be a directory")

        groups = core.cmd_dupes(
            path=req.path,
            hash_algo=req.hash_algo,
            action=req.action,
            archive_dir=req.archive_dir,
            recursive=req.recursive,
            exclude=req.exclude,
            apply=req.apply,
        )

        total_dupes = sum(g["count"] - 1 for g in groups)
        total_wasted = sum(g.get("wasted_bytes", g["size_bytes"] * (g["count"] - 1)) for g in groups)

        return schemas.DupesResponse(
            groups=[schemas.DupeGroup(**g) for g in groups],
            total_groups=len(groups),
            total_duplicates=total_dupes,
            total_wasted_bytes=total_wasted,
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=f"Permission denied: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dupes/stream")
async def find_duplicates_stream(
    path: str = Query(..., description="Directory to scan"),
    hash_algo: str = Query("sha256", description="Hash algorithm"),
    recursive: bool = Query(True, description="Process subdirectories"),
    exclude: str = Query("", description="Comma-separated exclude patterns"),
):
    """
    Find duplicates with SSE progress streaming.
    Returns Server-Sent Events with progress updates.
    """
    async def generate() -> AsyncGenerator[str, None]:
        try:
            resolved = Path(path).expanduser().resolve()
            if not resolved.exists():
                yield f"data: {json.dumps({'type': 'error', 'message': f'Path not found: {path}'})}\n\n"
                return

            exclude_list = [p.strip() for p in exclude.split(",") if p.strip()]

            for event in core.cmd_dupes_stream(
                path=path,
                hash_algo=hash_algo,
                recursive=recursive,
                exclude=exclude_list,
            ):
                yield f"data: {json.dumps(event)}\n\n"
                # Yield control to event loop to allow streaming
                await asyncio.sleep(0)

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history", response_model=schemas.ActionHistoryResponse)
async def get_action_history():
    """Get the action history for undo capability."""
    history = core.get_action_history()

    batches = []
    for i, batch in enumerate(history):
        batches.append(schemas.ActionHistoryBatch(
            index=i,
            actions=[schemas.FileAction(**a.to_dict()) for a in batch],
            count=len(batch),
        ))

    return schemas.ActionHistoryResponse(
        batches=batches,
        total_batches=len(batches),
    )


@router.post("/undo", response_model=schemas.PreviewResponse)
async def undo_actions(req: schemas.UndoRequest):
    """
    Undo a batch of previous actions.
    Returns preview by default; set apply=True to execute.
    """
    try:
        history = core.get_action_history()

        if not history:
            raise HTTPException(status_code=404, detail="No actions in history to undo")

        batch_index = req.batch_index if req.batch_index is not None else len(history) - 1

        if batch_index < 0 or batch_index >= len(history):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid batch index: {batch_index}. Valid range: 0-{len(history) - 1}"
            )

        batch = history[batch_index]
        reverse_actions = core.undo_actions(batch, apply=req.apply)

        # If applied, remove from history
        if req.apply:
            history.pop(batch_index)

        return schemas.PreviewResponse(
            actions=[schemas.FileAction(**a.to_dict()) for a in reverse_actions],
            files_scanned=len(reverse_actions),
            total_size_bytes=0,
            message=f"{'Undone' if req.apply else 'Preview undo'}: {len(reverse_actions)} actions",
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=f"Permission denied: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history")
async def clear_history():
    """Clear all action history."""
    core.clear_action_history()
    return {"message": "Action history cleared"}
