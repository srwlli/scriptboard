"""
FileManager core logic - adapted from fileman CLI with improvements:
- Parallel hashing (ThreadPoolExecutor)
- Exclusion/inclusion filters (fnmatch)
- OS trash integration (send2trash)
- Action logging for undo capability
- Generator-based streaming for progress
"""

import fnmatch
import hashlib
import os
import re
import shutil
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Generator, Iterable, List, Optional

try:
    from send2trash import send2trash
    HAS_SEND2TRASH = True
except ImportError:
    HAS_SEND2TRASH = False


@dataclass(frozen=True)
class Action:
    """Represents a file operation for preview/apply/undo."""
    op: str  # move, rename, delete, trash, dupe, archive_dupe, etc.
    src: str
    dst: Optional[str] = None
    meta: Optional[dict] = field(default_factory=dict)

    def to_dict(self) -> dict:
        result = {"op": self.op, "src": self.src}
        if self.dst is not None:
            result["dst"] = self.dst
        if self.meta:
            result["meta"] = self.meta
        return result


# Action history for undo capability (session-based)
_ACTION_HISTORY: List[List[Action]] = []


def get_action_history() -> List[List[Action]]:
    """Get the action history (list of operation batches)."""
    return _ACTION_HISTORY.copy()


def clear_action_history() -> None:
    """Clear all action history."""
    _ACTION_HISTORY.clear()


def _store_actions(actions: List[Action]) -> None:
    """Store a batch of actions in history for undo."""
    if actions:
        _ACTION_HISTORY.append(actions)


def matches_pattern(path: Path, pattern: str) -> bool:
    """Check if path matches a glob pattern."""
    # Check against full path and just the name
    return fnmatch.fnmatch(str(path), pattern) or fnmatch.fnmatch(path.name, pattern)


def matches_any_pattern(path: Path, patterns: List[str]) -> bool:
    """Check if path matches any of the given patterns."""
    return any(matches_pattern(path, p) for p in patterns)


def safe_iter_files(
    root: Path,
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
    include: Optional[List[str]] = None,
) -> Iterable[Path]:
    """
    Iterate files with optional filtering.

    Args:
        root: Starting directory or file
        recursive: Whether to recurse into subdirectories
        exclude: Glob patterns to exclude (e.g., ['node_modules', '*.git'])
        include: Glob patterns to include (if specified, only matching files)
    """
    root = root.expanduser().resolve()
    if not root.exists():
        return
    if root.is_file():
        yield root
        return

    exclude = exclude or []
    include = include or []

    iterator = root.rglob("*") if recursive else root.glob("*")

    for p in iterator:
        if not p.is_file():
            continue

        # Check exclusions
        if exclude and matches_any_pattern(p, exclude):
            continue

        # Check inclusions (if specified)
        if include and not matches_any_pattern(p, include):
            continue

        yield p


def unique_path(dst: Path) -> Path:
    """Generate unique path by adding (1), (2), etc. if file exists."""
    if not dst.exists():
        return dst
    stem = dst.stem
    suffix = dst.suffix
    parent = dst.parent
    i = 1
    while True:
        candidate = parent / f"{stem} ({i}){suffix}"
        if not candidate.exists():
            return candidate
        i += 1


def ensure_dir(p: Path, apply: bool) -> None:
    """Create directory if it doesn't exist (when apply=True)."""
    if p.exists():
        return
    if apply:
        p.mkdir(parents=True, exist_ok=True)


def move_file(src: Path, dst_dir: Path, apply: bool) -> Action:
    """Move file to destination directory."""
    src = src.expanduser().resolve()
    dst_dir = dst_dir.expanduser().resolve()
    ensure_dir(dst_dir, apply)
    dst = unique_path(dst_dir / src.name)
    if apply:
        shutil.move(str(src), str(dst))
    return Action(op="move", src=str(src), dst=str(dst))


def rename_file(src: Path, new_name: str, apply: bool) -> Action:
    """Rename file to new name."""
    src = src.expanduser().resolve()
    dst = unique_path(src.with_name(new_name))
    if apply:
        src.rename(dst)
    return Action(op="rename", src=str(src), dst=str(dst))


def safe_delete(path: Path, use_trash: bool = True, apply: bool = True) -> Action:
    """
    Delete file - to OS trash (default) or permanently.

    Args:
        path: File to delete
        use_trash: If True, move to Recycle Bin; if False, permanent delete
        apply: If False, return action without executing
    """
    path = path.expanduser().resolve()

    if use_trash and HAS_SEND2TRASH:
        if apply:
            send2trash(str(path))
        return Action(op="trash", src=str(path))
    else:
        if apply:
            path.unlink()
        return Action(op="delete", src=str(path))


def file_hash(p: Path, algo: str = "sha256", chunk_size: int = 1024 * 1024) -> str:
    """Compute hash of file contents."""
    h = hashlib.new(algo)
    with p.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def parallel_hash_files(
    files: List[Path],
    algo: str = "sha256",
    workers: Optional[int] = None,
    progress_callback: Optional[Callable[[int, int, Path], None]] = None,
) -> dict:
    """
    Hash files in parallel using ThreadPoolExecutor.

    Args:
        files: List of files to hash
        algo: Hash algorithm (default: sha256)
        workers: Number of worker threads (default: CPU count)
        progress_callback: Called with (current, total, current_file)

    Returns:
        Dict mapping Path -> hash string
    """
    results = {}
    total = len(files)

    if total == 0:
        return results

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(file_hash, f, algo): f for f in files}
        for i, future in enumerate(as_completed(futures)):
            f = futures[future]
            try:
                results[f] = future.result()
            except Exception as e:
                results[f] = None  # Mark as failed
            if progress_callback:
                progress_callback(i + 1, total, f)

    return results


def sanitize_filename(name: str, pattern: str = r"[^A-Za-z0-9._ -]") -> str:
    """Remove invalid characters from filename."""
    name = re.sub(pattern, "_", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def remove_empty_dirs(root: Path, apply: bool = True) -> List[Action]:
    """Remove empty directories under root (bottom-up)."""
    actions = []
    if not root.is_dir():
        return actions

    # Walk bottom-up to remove empty dirs
    for dirpath, dirnames, filenames in os.walk(str(root), topdown=False):
        dirpath = Path(dirpath)
        if dirpath == root:
            continue
        if not any(dirpath.iterdir()):
            if apply:
                dirpath.rmdir()
            actions.append(Action(op="rmdir", src=str(dirpath)))

    return actions


# ============================================================================
# COMMAND IMPLEMENTATIONS
# ============================================================================

def cmd_organize(
    path: str,
    by: str = "ext",
    dest: Optional[str] = None,
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
    include: Optional[List[str]] = None,
    remove_empty: bool = False,
    apply: bool = False,
) -> List[Action]:
    """
    Organize files into folders by extension, date, or month.

    Args:
        path: Source directory
        by: Organization mode - 'ext', 'date', or 'month'
        dest: Destination base directory (default: same as path)
        recursive: Process subdirectories
        exclude: Patterns to exclude
        include: Patterns to include
        remove_empty: Remove empty directories after organizing
        apply: Actually perform the operations

    Returns:
        List of actions (performed or would-be-performed)
    """
    src = Path(path).expanduser().resolve()
    base = Path(dest).expanduser().resolve() if dest else src
    exclude = exclude or []
    include = include or []

    actions = []

    for f in safe_iter_files(src, recursive=recursive, exclude=exclude, include=include):
        if by == "ext":
            key = f.suffix[1:].lower() if f.suffix else "noext"
        elif by == "date":
            t = time.gmtime(f.stat().st_mtime)
            key = time.strftime("%Y-%m-%d", t)
        else:  # month
            t = time.gmtime(f.stat().st_mtime)
            key = time.strftime("%Y-%m", t)

        dst_dir = base / key
        action = move_file(f, dst_dir, apply=apply)
        actions.append(action)

    if remove_empty and apply:
        actions.extend(remove_empty_dirs(src, apply=apply))

    if apply:
        _store_actions(actions)

    return actions


def cmd_rename(
    path: str,
    pattern: Optional[str] = None,
    replace: str = "",
    prefix: str = "",
    suffix: str = "",
    lower: bool = False,
    upper: bool = False,
    sanitize: bool = False,
    enumerate_files: bool = False,
    start: int = 1,
    step: int = 1,
    width: int = 3,
    ext_filter: Optional[str] = None,
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
    apply: bool = False,
) -> List[Action]:
    """
    Bulk rename files with pattern replacement, prefix/suffix, case changes.

    Args:
        path: Directory to process
        pattern: Regex pattern to match in filename stem
        replace: Replacement string for pattern matches
        prefix: String to prepend to filename
        suffix: String to append to filename (before extension)
        lower: Convert to lowercase
        upper: Convert to uppercase
        sanitize: Remove invalid characters
        enumerate_files: Add sequential numbers (_001, _002, etc.)
        start: Starting number for enumeration
        step: Step increment for enumeration
        width: Zero-padding width for enumeration
        ext_filter: Only process files with this extension
        recursive: Process subdirectories
        exclude: Patterns to exclude
        apply: Actually perform the operations

    Returns:
        List of rename actions
    """
    root = Path(path).expanduser().resolve()
    exclude = exclude or []
    regex = re.compile(pattern) if pattern else None
    only_ext = ext_filter.lower().lstrip(".") if ext_filter else None

    actions = []
    i = start

    for f in safe_iter_files(root, recursive=recursive, exclude=exclude):
        if only_ext and f.suffix.lower().lstrip(".") != only_ext:
            continue

        name = f.stem
        ext = f.suffix

        if regex:
            name = regex.sub(replace, name)

        if enumerate_files:
            name = f"{name}_{i:0{width}d}"
            i += step

        name = prefix + name + suffix

        if lower and not upper:
            name = name.lower()
        elif upper and not lower:
            name = name.upper()

        new_name = name + ext

        if sanitize:
            new_name = sanitize_filename(new_name)

        if new_name != f.name:
            action = rename_file(f, new_name, apply=apply)
            actions.append(action)

    if apply:
        _store_actions(actions)

    return actions


def cmd_clean(
    path: str,
    older_than_days: Optional[int] = None,
    larger_than_mb: Optional[int] = None,
    archive_dir: Optional[str] = None,
    use_trash: bool = True,
    delete_permanently: bool = False,
    remove_empty: bool = False,
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
    apply: bool = False,
) -> List[Action]:
    """
    Archive or delete files based on age/size criteria.

    Args:
        path: Directory to clean
        older_than_days: Files older than this many days
        larger_than_mb: Files larger than this many MB
        archive_dir: Move files here instead of deleting
        use_trash: Move to OS recycle bin (default)
        delete_permanently: Permanently delete files
        remove_empty: Remove empty directories after cleaning
        recursive: Process subdirectories
        exclude: Patterns to exclude
        apply: Actually perform the operations

    Returns:
        List of actions
    """
    root = Path(path).expanduser().resolve()
    exclude = exclude or []
    cutoff = time.time() - (older_than_days * 86400) if older_than_days is not None else None

    actions = []

    for f in safe_iter_files(root, recursive=recursive, exclude=exclude):
        try:
            st = f.stat()
        except OSError:
            continue

        matches = True

        if cutoff is not None and st.st_mtime >= cutoff:
            matches = False

        if larger_than_mb is not None and st.st_size < larger_than_mb * 1024 * 1024:
            matches = False

        if not matches:
            continue

        if archive_dir:
            # Archive instead of delete
            archive_path = Path(archive_dir).expanduser().resolve()
            action = move_file(f, archive_path, apply=apply)
            actions.append(action)
        elif delete_permanently:
            action = safe_delete(f, use_trash=False, apply=apply)
            actions.append(action)
        else:
            action = safe_delete(f, use_trash=use_trash, apply=apply)
            actions.append(action)

    if remove_empty and apply:
        actions.extend(remove_empty_dirs(root, apply=apply))

    if apply:
        _store_actions(actions)

    return actions


def cmd_index(
    path: str,
    include_hash: bool = False,
    hash_algo: str = "sha256",
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
) -> List[dict]:
    """
    Generate file inventory/index.

    Args:
        path: Directory to index
        include_hash: Include file hashes
        hash_algo: Hash algorithm to use
        recursive: Process subdirectories
        exclude: Patterns to exclude

    Returns:
        List of file info dicts
    """
    root = Path(path).expanduser().resolve()
    exclude = exclude or []

    rows = []
    files = list(safe_iter_files(root, recursive=recursive, exclude=exclude))

    # If hashing, use parallel processing
    hashes = {}
    if include_hash:
        hashes = parallel_hash_files(files, algo=hash_algo)

    for f in files:
        try:
            st = f.stat()
            row = {
                "path": str(f),
                "name": f.name,
                "size_bytes": st.st_size,
                "mtime_epoch": int(st.st_mtime),
            }
            if include_hash:
                row[hash_algo] = hashes.get(f)
            rows.append(row)
        except OSError:
            continue

    return rows


def cmd_index_stream(
    path: str,
    include_hash: bool = False,
    hash_algo: str = "sha256",
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
) -> Generator[dict, None, None]:
    """
    Generate file index with progress events (for SSE streaming).

    Yields:
        Progress events: {"type": "progress", "current": N, "total": M, ...}
        Action events: {"type": "action", "file": {...}}
        Complete event: {"type": "complete", "total_files": N, "total_bytes": M}
    """
    root = Path(path).expanduser().resolve()
    exclude = exclude or []

    # First pass: count files
    files = list(safe_iter_files(root, recursive=recursive, exclude=exclude))
    total = len(files)

    yield {"type": "progress", "current": 0, "total": total, "phase": "scanning"}

    total_bytes = 0
    results = []

    for i, f in enumerate(files):
        try:
            st = f.stat()
            row = {
                "path": str(f),
                "name": f.name,
                "size_bytes": st.st_size,
                "mtime_epoch": int(st.st_mtime),
            }

            if include_hash:
                try:
                    row[hash_algo] = file_hash(f, algo=hash_algo)
                except Exception:
                    row[hash_algo] = None

            total_bytes += st.st_size
            results.append(row)

            yield {
                "type": "progress",
                "current": i + 1,
                "total": total,
                "phase": "indexing",
                "current_file": f.name,
            }
        except OSError:
            continue

    yield {
        "type": "complete",
        "total_files": len(results),
        "total_bytes": total_bytes,
        "files": results,
    }


def cmd_dupes(
    path: str,
    hash_algo: str = "sha256",
    action: str = "list",  # list, trash, delete, archive
    archive_dir: Optional[str] = None,
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
    apply: bool = False,
) -> List[dict]:
    """
    Find duplicate files by size + hash.

    Args:
        path: Directory to scan
        hash_algo: Hash algorithm
        action: What to do with dupes - list, trash, delete, archive
        archive_dir: Where to archive dupes (if action=archive)
        recursive: Process subdirectories
        exclude: Patterns to exclude
        apply: Actually perform the operations

    Returns:
        List of duplicate groups with actions
    """
    root = Path(path).expanduser().resolve()
    exclude = exclude or []

    # Group files by size first (optimization)
    by_size = {}
    for f in safe_iter_files(root, recursive=recursive, exclude=exclude):
        try:
            size = f.stat().st_size
            by_size.setdefault(size, []).append(f)
        except OSError:
            continue

    # Filter to only sizes with potential dupes
    candidates = []
    for size, files in by_size.items():
        if len(files) >= 2:
            candidates.extend(files)

    # Hash candidates in parallel
    hashes = parallel_hash_files(candidates, algo=hash_algo)

    # Group by hash
    by_hash = {}
    for f, h in hashes.items():
        if h is not None:
            by_hash.setdefault(h, []).append(f)

    # Build result groups
    groups = []
    all_actions = []

    for h, files in by_hash.items():
        if len(files) < 2:
            continue

        size = files[0].stat().st_size
        keep = files[0]

        group = {
            "hash": h,
            "hash_algo": hash_algo,
            "size_bytes": size,
            "count": len(files),
            "keep": str(keep),
            "duplicates": [str(f) for f in files[1:]],
            "actions": [],
        }

        # Handle duplicates based on action
        for f in files[1:]:
            if action == "list":
                act = Action(op="dupe", src=str(f), meta={"kept": str(keep)})
            elif action == "trash":
                act = safe_delete(f, use_trash=True, apply=apply)
            elif action == "delete":
                act = safe_delete(f, use_trash=False, apply=apply)
            elif action == "archive" and archive_dir:
                act = move_file(f, Path(archive_dir), apply=apply)
            else:
                act = Action(op="dupe", src=str(f), meta={"kept": str(keep)})

            group["actions"].append(act.to_dict())
            all_actions.append(act)

        groups.append(group)

    if apply and all_actions:
        _store_actions(all_actions)

    return groups


def cmd_dupes_stream(
    path: str,
    hash_algo: str = "sha256",
    recursive: bool = True,
    exclude: Optional[List[str]] = None,
) -> Generator[dict, None, None]:
    """
    Find duplicates with progress streaming (for SSE).

    Yields:
        Progress events for scanning, hashing, and final results
    """
    root = Path(path).expanduser().resolve()
    exclude = exclude or []

    yield {"type": "progress", "phase": "scanning", "message": "Scanning files..."}

    # Group by size
    by_size = {}
    file_count = 0
    for f in safe_iter_files(root, recursive=recursive, exclude=exclude):
        try:
            size = f.stat().st_size
            by_size.setdefault(size, []).append(f)
            file_count += 1
        except OSError:
            continue

    yield {"type": "progress", "phase": "scanning", "total_files": file_count}

    # Get candidates
    candidates = []
    for size, files in by_size.items():
        if len(files) >= 2:
            candidates.extend(files)

    yield {
        "type": "progress",
        "phase": "hashing",
        "current": 0,
        "total": len(candidates),
        "message": f"Hashing {len(candidates)} candidate files...",
    }

    # Hash with progress
    hashes = {}
    for i, f in enumerate(candidates):
        try:
            hashes[f] = file_hash(f, algo=hash_algo)
        except Exception:
            pass

        yield {
            "type": "progress",
            "phase": "hashing",
            "current": i + 1,
            "total": len(candidates),
            "current_file": f.name,
        }

    # Group by hash
    by_hash = {}
    for f, h in hashes.items():
        if h is not None:
            by_hash.setdefault(h, []).append(f)

    # Build groups
    groups = []
    total_dupe_size = 0

    for h, files in by_hash.items():
        if len(files) < 2:
            continue

        size = files[0].stat().st_size
        dupe_size = size * (len(files) - 1)
        total_dupe_size += dupe_size

        groups.append({
            "hash": h,
            "hash_algo": hash_algo,
            "size_bytes": size,
            "count": len(files),
            "keep": str(files[0]),
            "duplicates": [str(f) for f in files[1:]],
            "wasted_bytes": dupe_size,
        })

    yield {
        "type": "complete",
        "groups": groups,
        "total_groups": len(groups),
        "total_duplicates": sum(g["count"] - 1 for g in groups),
        "total_wasted_bytes": total_dupe_size,
    }


def undo_actions(actions: List[Action], apply: bool = False) -> List[Action]:
    """
    Reverse a batch of actions.

    Args:
        actions: List of actions to reverse
        apply: Actually perform the reversal

    Returns:
        List of reverse actions
    """
    reverse_actions = []

    for action in reversed(actions):
        if action.op == "move" and action.dst:
            # Move back: dst -> src directory
            src_dir = str(Path(action.src).parent)
            reverse = move_file(Path(action.dst), Path(src_dir), apply=apply)
            reverse_actions.append(reverse)

        elif action.op == "rename" and action.dst:
            # Rename back: dst -> original name
            original_name = Path(action.src).name
            reverse = rename_file(Path(action.dst), original_name, apply=apply)
            reverse_actions.append(reverse)

        elif action.op in ("trash", "delete"):
            # Cannot undo permanent deletes; trash might be recoverable manually
            reverse_actions.append(
                Action(op="undo_failed", src=action.src, meta={"reason": "Cannot restore deleted files"})
            )

        elif action.op == "rmdir":
            # Recreate directory
            if apply:
                Path(action.src).mkdir(parents=True, exist_ok=True)
            reverse_actions.append(Action(op="mkdir", src=action.src))

    return reverse_actions
