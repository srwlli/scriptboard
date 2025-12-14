"""FileManager module - File organization, renaming, cleaning, indexing, and duplicate detection."""

from .core import (
    Action,
    safe_iter_files,
    move_file,
    rename_file,
    safe_delete,
    file_hash,
    parallel_hash_files,
    cmd_organize,
    cmd_rename,
    cmd_clean,
    cmd_index,
    cmd_index_stream,
    cmd_dupes,
    cmd_dupes_stream,
    undo_actions,
    get_action_history,
    clear_action_history,
)

from .router import router as fileman_router

__all__ = [
    "Action",
    "safe_iter_files",
    "move_file",
    "rename_file",
    "safe_delete",
    "file_hash",
    "parallel_hash_files",
    "cmd_organize",
    "cmd_rename",
    "cmd_clean",
    "cmd_index",
    "cmd_index_stream",
    "cmd_dupes",
    "cmd_dupes_stream",
    "undo_actions",
    "get_action_history",
    "clear_action_history",
    "fileman_router",
]
