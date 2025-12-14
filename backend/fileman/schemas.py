"""Pydantic schemas for FileManager API endpoints."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class FileAction(BaseModel):
    """Represents a single file operation."""
    op: str = Field(..., description="Operation type: move, rename, delete, trash, dupe, etc.")
    src: str = Field(..., description="Source file path")
    dst: Optional[str] = Field(None, description="Destination path (for move/rename)")
    meta: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class OrganizeRequest(BaseModel):
    """Request to organize files into folders."""
    path: str = Field(..., description="Source directory to organize")
    by: Literal["ext", "date", "month"] = Field("ext", description="Organization mode")
    dest: Optional[str] = Field(None, description="Destination base directory")
    recursive: bool = Field(True, description="Process subdirectories")
    exclude: List[str] = Field(default_factory=list, description="Glob patterns to exclude")
    include: List[str] = Field(default_factory=list, description="Glob patterns to include")
    remove_empty: bool = Field(False, description="Remove empty directories after organizing")
    apply: bool = Field(False, description="Actually perform operations (False = dry run)")


class RenameRequest(BaseModel):
    """Request to bulk rename files."""
    path: str = Field(..., description="Directory to process")
    pattern: Optional[str] = Field(None, description="Regex pattern to match in filename")
    replace: str = Field("", description="Replacement string for pattern matches")
    prefix: str = Field("", description="String to prepend to filename")
    suffix: str = Field("", description="String to append to filename (before extension)")
    lower: bool = Field(False, description="Convert to lowercase")
    upper: bool = Field(False, description="Convert to uppercase")
    sanitize: bool = Field(False, description="Remove invalid characters")
    enumerate_files: bool = Field(False, description="Add sequential numbers")
    start: int = Field(1, description="Starting number for enumeration")
    step: int = Field(1, description="Step increment for enumeration")
    width: int = Field(3, description="Zero-padding width for enumeration")
    ext_filter: Optional[str] = Field(None, description="Only process files with this extension")
    recursive: bool = Field(True, description="Process subdirectories")
    exclude: List[str] = Field(default_factory=list, description="Glob patterns to exclude")
    apply: bool = Field(False, description="Actually perform operations")


class CleanRequest(BaseModel):
    """Request to clean/archive files."""
    path: str = Field(..., description="Directory to clean")
    older_than_days: Optional[int] = Field(None, description="Files older than this many days")
    larger_than_mb: Optional[int] = Field(None, description="Files larger than this many MB")
    archive_dir: Optional[str] = Field(None, description="Archive directory (instead of deleting)")
    use_trash: bool = Field(True, description="Move to OS recycle bin")
    delete_permanently: bool = Field(False, description="Permanently delete files")
    remove_empty: bool = Field(False, description="Remove empty directories after cleaning")
    recursive: bool = Field(True, description="Process subdirectories")
    exclude: List[str] = Field(default_factory=list, description="Glob patterns to exclude")
    apply: bool = Field(False, description="Actually perform operations")


class IndexRequest(BaseModel):
    """Request to generate file index."""
    path: str = Field(..., description="Directory to index")
    include_hash: bool = Field(False, description="Include file hashes")
    hash_algo: str = Field("sha256", description="Hash algorithm")
    recursive: bool = Field(True, description="Process subdirectories")
    exclude: List[str] = Field(default_factory=list, description="Glob patterns to exclude")


class DupesRequest(BaseModel):
    """Request to find duplicate files."""
    path: str = Field(..., description="Directory to scan")
    hash_algo: str = Field("sha256", description="Hash algorithm")
    action: Literal["list", "trash", "delete", "archive"] = Field("list", description="Action for duplicates")
    archive_dir: Optional[str] = Field(None, description="Archive directory for duplicates")
    recursive: bool = Field(True, description="Process subdirectories")
    exclude: List[str] = Field(default_factory=list, description="Glob patterns to exclude")
    apply: bool = Field(False, description="Actually perform operations")


class UndoRequest(BaseModel):
    """Request to undo previous operations."""
    batch_index: Optional[int] = Field(None, description="Index of batch to undo (None = most recent)")
    apply: bool = Field(False, description="Actually perform the undo")


class PreviewResponse(BaseModel):
    """Response containing preview of file operations."""
    actions: List[FileAction] = Field(..., description="List of actions")
    files_scanned: int = Field(0, description="Total files scanned")
    total_size_bytes: int = Field(0, description="Total size in bytes")
    message: Optional[str] = Field(None, description="Status message")


class IndexResponse(BaseModel):
    """Response containing file index."""
    files: List[Dict[str, Any]] = Field(..., description="List of file info")
    total_files: int = Field(0, description="Total files indexed")
    total_size_bytes: int = Field(0, description="Total size in bytes")


class DupeGroup(BaseModel):
    """A group of duplicate files."""
    hash: str = Field(..., description="File hash")
    hash_algo: str = Field(..., description="Hash algorithm used")
    size_bytes: int = Field(..., description="File size in bytes")
    count: int = Field(..., description="Number of copies")
    keep: str = Field(..., description="Path of file to keep")
    duplicates: List[str] = Field(..., description="Paths of duplicate files")
    wasted_bytes: Optional[int] = Field(None, description="Bytes wasted by duplicates")
    actions: List[Dict[str, Any]] = Field(default_factory=list, description="Actions taken")


class DupesResponse(BaseModel):
    """Response containing duplicate file groups."""
    groups: List[DupeGroup] = Field(..., description="Duplicate groups")
    total_groups: int = Field(0, description="Number of duplicate groups")
    total_duplicates: int = Field(0, description="Total duplicate files")
    total_wasted_bytes: int = Field(0, description="Total wasted space")


class ActionHistoryBatch(BaseModel):
    """A batch of actions from history."""
    index: int = Field(..., description="Batch index")
    actions: List[FileAction] = Field(..., description="Actions in this batch")
    count: int = Field(..., description="Number of actions")


class ActionHistoryResponse(BaseModel):
    """Response containing action history."""
    batches: List[ActionHistoryBatch] = Field(..., description="Action batches")
    total_batches: int = Field(0, description="Total number of batches")


class ProgressEvent(BaseModel):
    """SSE progress event."""
    type: Literal["progress", "action", "complete", "error"] = Field(..., description="Event type")
    phase: Optional[str] = Field(None, description="Current phase")
    current: int = Field(0, description="Current item")
    total: int = Field(0, description="Total items")
    current_file: Optional[str] = Field(None, description="Current file being processed")
    message: Optional[str] = Field(None, description="Status message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")
