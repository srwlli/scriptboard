"""
ScriptboardCore - Core business logic engine for Scriptboard application.

This module contains the core data structures and business logic, completely
separated from UI, API, and file I/O concerns.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from schemas import BatchJobStatus


@dataclass
class Attachment:
    """Represents an attached file or text snippet."""
    id: str = field(default_factory=lambda: f"att_{uuid.uuid4().hex}")
    filename: str = ""
    content: str = ""
    binary: bool = False  # True if this is a binary file (metadata only)

    @property
    def lines(self) -> int:
        """Count lines in content (for text files only)."""
        if not self.content or self.binary:
            return 0
        return self.content.count("\n") + 1

    def to_dict(self) -> Dict:
        """Serialize to dictionary for session storage."""
        return {
            "id": self.id,
            "filename": self.filename,
            "content": self.content if not self.binary else "",
            "binary": self.binary,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> Attachment:
        """Deserialize from dictionary."""
        return cls(
            id=data.get("id", f"att_{uuid.uuid4().hex}"),
            filename=data.get("filename", ""),
            content=data.get("content", ""),
            binary=data.get("binary", False),
        )


@dataclass
class ResponseItem:
    """Represents a single LLM response."""
    id: str = field(default_factory=lambda: f"resp_{uuid.uuid4().hex}")
    source: str = ""  # e.g., "GPT", "Claude", or custom label
    content: str = ""

    @property
    def char_count(self) -> int:
        """Character count of response content."""
        return len(self.content)

    def to_dict(self) -> Dict:
        """Serialize to dictionary for session storage."""
        return {
            "id": self.id,
            "source": self.source,
            "content": self.content,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> ResponseItem:
        """Deserialize from dictionary."""
        return cls(
            id=data.get("id", f"resp_{uuid.uuid4().hex}"),
            source=data.get("source", ""),
            content=data.get("content", ""),
        )


@dataclass
class BatchJob:
    """Represents a batch processing job (Phase-2 feature)."""
    id: str = field(default_factory=lambda: f"batch_{uuid.uuid4().hex}")
    prompt: str = ""
    model: str = ""
    status: BatchJobStatus = BatchJobStatus.PENDING
    error: Optional[str] = None

    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            "id": self.id,
            "prompt": self.prompt,
            "model": self.model,
            "status": self.status.value,
            "error": self.error,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> BatchJob:
        """Deserialize from dictionary."""
        return cls(
            id=data.get("id", f"batch_{uuid.uuid4().hex}"),
            prompt=data.get("prompt", ""),
            model=data.get("model", ""),
            status=BatchJobStatus(data.get("status", BatchJobStatus.PENDING.value)),
            error=data.get("error"),
        )


class ScriptboardCore:
    """
    Core business logic engine for Scriptboard.
    
    This class owns all application state and provides pure business logic methods.
    It does NOT handle file I/O, HTTP, or UI concerns - those are handled by
    the API layer and frontend.
    """

    def __init__(
        self,
        favorites: Optional[List[tuple[str, str]]] = None,
        llm_urls: Optional[List[tuple[str, str]]] = None,
    ):
        """
        Initialize ScriptboardCore with default or provided configuration.
        
        Args:
            favorites: List of (label, path) tuples for favorite folders.
                      If None, uses defaults from settings.
            llm_urls: List of (label, url) tuples for LLM providers.
                     If None, uses defaults from settings.
        """
        from settings import DEFAULT_FAVORITES, DEFAULT_LLM_URLS

        # Session state (user content)
        self.prompt: str = ""
        self.prompt_source: Optional[str] = None  # e.g., "file", "clipboard", "preloaded:1"
        self.attachments: List[Attachment] = []
        self.responses: List[ResponseItem] = []

        # Configuration state (from config.json or defaults)
        self.favorites: List[tuple[str, str]] = list(favorites or DEFAULT_FAVORITES)
        self.llm_urls: List[tuple[str, str]] = list(llm_urls or DEFAULT_LLM_URLS)
        self.current_profile: Optional[str] = None

        # Phase-2 features
        self.batch_jobs: List[BatchJob] = []

        # Internal state
        self._token_cache: Dict[str, int] = {}  # Cache token counts by content hash

    # --------------------------------------------------------------------------- #
    # Prompt Operations
    # --------------------------------------------------------------------------- #

    def set_prompt(self, text: str, source: Optional[str] = None) -> None:
        """
        Set the current prompt text.
        
        Args:
            text: The prompt text to set
            source: Optional source identifier (e.g., "file", "clipboard", "preloaded:1")
        """
        self.prompt = text
        self.prompt_source = source or "manual"
        # Clear token cache for prompt when it changes
        self._token_cache.pop("prompt", None)

    def clear_prompt(self) -> None:
        """Clear the current prompt."""
        self.prompt = ""
        self.prompt_source = None
        self._token_cache.pop("prompt", None)

    def use_preloaded_prompt(self, key: str) -> bool:
        """
        Load a preloaded prompt by key.
        
        Args:
            key: Key from PRELOADED_PROMPTS dictionary
            
        Returns:
            True if prompt was loaded, False if key not found
        """
        from settings import PRELOADED_PROMPTS
        
        if key not in PRELOADED_PROMPTS:
            return False
        
        label, prompt_text = PRELOADED_PROMPTS[key]
        self.set_prompt(prompt_text, source=f"preloaded:{key}")
        return True

    def get_prompt_status(self) -> Dict:
        """
        Get current prompt status information.
        
        Returns:
            Dictionary with has_prompt (bool) and prompt_source (str or None)
        """
        return {
            "has_prompt": bool(self.prompt),
            "prompt_source": self.prompt_source,
            "char_count": len(self.prompt),
        }

    # --------------------------------------------------------------------------- #
    # Attachment Operations
    # --------------------------------------------------------------------------- #

    def add_attachment_from_text(
        self, text: str, suggested_name: Optional[str] = None
    ) -> Attachment:
        """
        Add an attachment from text content.
        
        Args:
            text: The text content to attach
            suggested_name: Optional filename suggestion
            
        Returns:
            The created Attachment object
        """
        filename = suggested_name or f"attachment_{len(self.attachments) + 1}.txt"
        attachment = Attachment(
            filename=filename,
            content=text,
            binary=False,
        )
        self.attachments.append(attachment)
        # Clear token cache for attachments when they change
        self._token_cache.pop("attachments", None)
        return attachment

    def add_attachment_from_path(
        self, filepath: str, content: str, binary: bool = False
    ) -> Attachment:
        """
        Add an attachment from a file path.
        
        Note: This method receives content that has already been read by the API layer.
        The Core does NOT perform file I/O - that's the API's responsibility.
        
        Args:
            filepath: Path to the file (used for filename extraction)
            content: File content (empty string if binary=True)
            binary: Whether this is a binary file (metadata only)
            
        Returns:
            The created Attachment object
        """
        import os
        filename = os.path.basename(filepath) if filepath else "unknown"
        attachment = Attachment(
            filename=filename,
            content=content if not binary else "",
            binary=binary,
        )
        self.attachments.append(attachment)
        self._token_cache.pop("attachments", None)
        return attachment

    def clear_attachments(self) -> None:
        """Clear all attachments."""
        self.attachments.clear()
        self._token_cache.pop("attachments", None)

    def list_attachments(self) -> List[Attachment]:
        """
        Get list of all attachments.
        
        Returns:
            List of Attachment objects
        """
        return list(self.attachments)

    # --------------------------------------------------------------------------- #
    # Response Operations
    # --------------------------------------------------------------------------- #

    def add_response(self, content: str, source: str = "") -> ResponseItem:
        """
        Add a new LLM response.
        
        Args:
            content: The response text content
            source: Optional source identifier (e.g., "GPT", "Claude", or custom label)
            
        Returns:
            The created ResponseItem object
        """
        response = ResponseItem(
            content=content,
            source=source or "unknown",
        )
        self.responses.append(response)
        # Clear token cache for responses when they change
        self._token_cache.pop("responses", None)
        return response

    def clear_responses(self) -> None:
        """Clear all responses."""
        self.responses.clear()
        self._token_cache.pop("responses", None)

    def responses_summary(self) -> Dict:
        """
        Get summary of all responses.
        
        Returns:
            Dictionary with count, char_count, and list of response summaries
        """
        total_chars = sum(r.char_count for r in self.responses)
        response_items = [
            {
                "id": r.id,
                "source": r.source,
                "char_count": r.char_count,
            }
            for r in self.responses
        ]
        return {
            "count": len(self.responses),
            "char_count": total_chars,
            "responses": response_items,
        }

    # --------------------------------------------------------------------------- #
    # Preview Methods
    # --------------------------------------------------------------------------- #

    def build_preview(self, max_lines: int = 3) -> str:
        """
        Build a truncated preview of the combined content.
        
        Args:
            max_lines: Maximum number of lines per section (default: 3)
            
        Returns:
            Multi-section preview text with truncation
        """
        sections = []
        
        # Prompt section
        if self.prompt:
            prompt_lines = self.prompt.splitlines()
            if len(prompt_lines) > max_lines:
                prompt_text = "\n".join(prompt_lines[:max_lines]) + "\n..."
            else:
                prompt_text = self.prompt
            sections.append(f"=== PROMPT ===\n{prompt_text}")
        
        # Attachments section
        if self.attachments:
            sections.append(f"=== ATTACHMENTS ({len(self.attachments)}) ===")
            for att in self.attachments[:5]:  # Show first 5 attachments
                if att.binary:
                    sections.append(f"  [{att.filename}] (binary file)")
                else:
                    att_lines = att.content.splitlines()
                    if len(att_lines) > max_lines:
                        att_text = "\n".join(att_lines[:max_lines]) + "\n..."
                    else:
                        att_text = att.content
                    sections.append(f"  [{att.filename}]\n{att_text}")
            if len(self.attachments) > 5:
                sections.append(f"  ... and {len(self.attachments) - 5} more")
        
        # Responses section
        if self.responses:
            sections.append(f"=== RESPONSES ({len(self.responses)}) ===")
            for resp in self.responses[:5]:  # Show first 5 responses
                resp_lines = resp.content.splitlines()
                if len(resp_lines) > max_lines:
                    resp_text = "\n".join(resp_lines[:max_lines]) + "\n..."
                else:
                    resp_text = resp.content
                sections.append(f"  [{resp.source}]\n{resp_text}")
            if len(self.responses) > 5:
                sections.append(f"  ... and {len(self.responses) - 5} more")
        
        if not sections:
            return "No content to preview."
        
        return "\n\n".join(sections)

    def build_combined_preview(self) -> str:
        """
        Build a full combined preview without truncation.
        
        Returns:
            Complete multi-section preview text
        """
        sections = []
        
        # Prompt section
        if self.prompt:
            sections.append(f"=== PROMPT ===\n{self.prompt}")
        
        # Attachments section
        if self.attachments:
            sections.append(f"=== ATTACHMENTS ({len(self.attachments)}) ===")
            for att in self.attachments:
                if att.binary:
                    sections.append(f"\n[{att.filename}] (binary file - content not available)")
                else:
                    sections.append(f"\n[{att.filename}]\n{att.content}")
        
        # Responses section
        if self.responses:
            sections.append(f"=== RESPONSES ({len(self.responses)}) ===")
            for resp in self.responses:
                sections.append(f"\n[{resp.source}]\n{resp.content}")
        
        if not sections:
            return "No content to preview."
        
        return "\n\n".join(sections)

    def build_llm_friendly_export(self) -> str:
        """
        Build LLM-optimized export format for pasting into chat interfaces.
        
        Returns:
            Formatted text optimized for LLM consumption
        """
        sections = []
        
        # Prompt section with source info
        if self.prompt:
            source_info = f" (Source: {self.prompt_source})" if self.prompt_source else ""
            sections.append(f"# PROMPT{source_info}\n\n{self.prompt}")
        
        # Attachments section with better formatting
        if self.attachments:
            sections.append(f"\n# ATTACHMENTS ({len(self.attachments)} file{'s' if len(self.attachments) != 1 else ''})\n")
            for i, att in enumerate(self.attachments, 1):
                if att.binary:
                    sections.append(f"## File {i}: {att.filename}\n\n(binary file - content not available)\n")
                else:
                    # Detect if content looks like code (simple heuristic)
                    is_likely_code = any(ext in att.filename.lower() for ext in ['.py', '.js', '.ts', '.json', '.md', '.txt', '.html', '.css', '.sql', '.sh', '.yaml', '.yml'])
                    if is_likely_code:
                        sections.append(f"## File {i}: {att.filename}\n\n```\n{att.content}\n```\n")
                    else:
                        sections.append(f"## File {i}: {att.filename}\n\n{att.content}\n")
        
        # Responses section with clear separation
        if self.responses:
            sections.append(f"\n# RESPONSES ({len(self.responses)} response{'s' if len(self.responses) != 1 else ''})\n")
            for i, resp in enumerate(self.responses, 1):
                sections.append(f"## Response {i}: {resp.source}\n\n{resp.content}\n")
        
        if not sections:
            return "No content available."
        
        # Add a brief header if there's content
        header = "--- Scriptboard Session Export ---\n\n"
        return header + "\n".join(sections)

    def build_llm_friendly_prompt(self) -> str:
        """Build LLM-friendly format for prompt only."""
        if not self.prompt:
            return "No prompt available."
        source_info = f" (Source: {self.prompt_source})" if self.prompt_source else ""
        return f"# PROMPT{source_info}\n\n{self.prompt}"

    def build_llm_friendly_attachments(self) -> str:
        """Build LLM-friendly format for attachments only."""
        if not self.attachments:
            return "No attachments available."
        
        sections = [f"# ATTACHMENTS ({len(self.attachments)} file{'s' if len(self.attachments) != 1 else ''})\n"]
        for i, att in enumerate(self.attachments, 1):
            if att.binary:
                sections.append(f"## File {i}: {att.filename}\n\n(binary file - content not available)\n")
            else:
                # Detect if content looks like code
                is_likely_code = any(ext in att.filename.lower() for ext in ['.py', '.js', '.ts', '.json', '.md', '.txt', '.html', '.css', '.sql', '.sh', '.yaml', '.yml'])
                if is_likely_code:
                    sections.append(f"## File {i}: {att.filename}\n\n```\n{att.content}\n```\n")
                else:
                    sections.append(f"## File {i}: {att.filename}\n\n{att.content}\n")
        
        return "\n".join(sections)

    def build_llm_friendly_responses(self) -> str:
        """Build LLM-friendly format for responses only."""
        if not self.responses:
            return "No responses available."
        
        sections = [f"# RESPONSES ({len(self.responses)} response{'s' if len(self.responses) != 1 else ''})\n"]
        for i, resp in enumerate(self.responses, 1):
            sections.append(f"## Response {i}: {resp.source}\n\n{resp.content}\n")
        
        return "\n".join(sections)

    # --------------------------------------------------------------------------- #
    # Session Serialization
    # --------------------------------------------------------------------------- #

    def to_dict(self) -> Dict:
        """
        Serialize the entire session state to a dictionary.
        
        Returns:
            Dictionary containing all session data with schema_version for compatibility
        """
        return {
            "schema_version": "1.0.0",  # For future compatibility
            "prompt": self.prompt,
            "prompt_source": self.prompt_source,
            "attachments": [att.to_dict() for att in self.attachments],
            "responses": [resp.to_dict() for resp in self.responses],
            "favorites": [{"label": label, "path": path} for label, path in self.favorites],
            "llm_urls": [{"label": label, "url": url} for label, url in self.llm_urls],
            "current_profile": self.current_profile,
            "batch_jobs": [job.to_dict() for job in self.batch_jobs],
        }

    def load_from_dict(self, data: Dict) -> None:
        """
        Deserialize session state from a dictionary.
        
        Args:
            data: Dictionary containing session data
            
        Note:
            Missing fields will use defaults. Invalid data is handled gracefully.
        """
        schema_version = data.get("schema_version", "1.0.0")
        
        # Load prompt
        self.prompt = data.get("prompt", "")
        self.prompt_source = data.get("prompt_source")
        
        # Load attachments
        self.attachments = []
        for att_data in data.get("attachments", []):
            try:
                self.attachments.append(Attachment.from_dict(att_data))
            except Exception:
                # Skip invalid attachments
                continue
        
        # Load responses
        self.responses = []
        for resp_data in data.get("responses", []):
            try:
                self.responses.append(ResponseItem.from_dict(resp_data))
            except Exception:
                # Skip invalid responses
                continue
        
        # Load configuration (may be overridden by profile)
        favorites_data = data.get("favorites", [])
        if favorites_data:
            self.favorites = [
                (item.get("label", ""), item.get("path", ""))
                for item in favorites_data
                if isinstance(item, dict)
            ]
        
        llm_urls_data = data.get("llm_urls", [])
        if llm_urls_data:
            self.llm_urls = [
                (item.get("label", ""), item.get("url", ""))
                for item in llm_urls_data
                if isinstance(item, dict)
            ]
        
        self.current_profile = data.get("current_profile")
        
        # Load batch jobs (Phase-2)
        self.batch_jobs = []
        for job_data in data.get("batch_jobs", []):
            try:
                self.batch_jobs.append(BatchJob.from_dict(job_data))
            except Exception:
                # Skip invalid batch jobs
                continue
        
        # Clear token cache when loading new session
        self._token_cache.clear()

    def get_session_summary(self) -> Dict:
        """
        Get a summary of the current session state.
        
        Returns:
            Dictionary with session statistics and metadata
        """
        total_chars = (
            len(self.prompt) +
            sum(len(att.content) for att in self.attachments if not att.binary) +
            sum(r.char_count for r in self.responses)
        )
        
        return {
            "has_prompt": bool(self.prompt),
            "prompt_source": self.prompt_source,
            "attachment_count": len(self.attachments),
            "response_count": len(self.responses),
            "total_chars": total_chars,
            "current_profile": self.current_profile,
        }

    # --------------------------------------------------------------------------- #
    # Token Counting
    # --------------------------------------------------------------------------- #

    def estimate_tokens(self, text: str, model: str = "gpt-4") -> int:
        """
        Estimate token count for text using tiktoken.
        
        Args:
            text: Text to count tokens for
            model: Model identifier (default: "gpt-4")
            
        Returns:
            Estimated token count
        """
        try:
            import tiktoken
            encoding = tiktoken.encoding_for_model(model)
            return len(encoding.encode(text))
        except Exception:
            # Fallback: rough estimate (1 token ≈ 4 characters)
            return len(text) // 4

    def get_token_counts(self) -> Dict:
        """
        Get token counts for prompt, attachments, and responses.
        Uses caching to avoid recalculating unchanged content.
        
        Returns:
            Dictionary with tokenizer name and token counts
        """
        # Calculate prompt tokens
        prompt_key = f"prompt_{hash(self.prompt)}"
        if prompt_key not in self._token_cache:
            self._token_cache[prompt_key] = self.estimate_tokens(self.prompt)
        prompt_tokens = self._token_cache[prompt_key]
        
        # Calculate attachment tokens
        attachment_tokens = 0
        for att in self.attachments:
            if not att.binary:
                att_key = f"att_{att.id}_{hash(att.content)}"
                if att_key not in self._token_cache:
                    self._token_cache[att_key] = self.estimate_tokens(att.content)
                attachment_tokens += self._token_cache[att_key]
        
        # Calculate response tokens
        response_tokens = 0
        for resp in self.responses:
            resp_key = f"resp_{resp.id}_{hash(resp.content)}"
            if resp_key not in self._token_cache:
                self._token_cache[resp_key] = self.estimate_tokens(resp.content)
            response_tokens += self._token_cache[resp_key]
        
        total_tokens = prompt_tokens + attachment_tokens + response_tokens
        
        return {
            "tokenizer": "tiktoken",
            "prompt_tokens": prompt_tokens,
            "attachment_tokens": attachment_tokens,
            "response_tokens": response_tokens,
            "total_tokens": total_tokens,
        }

    # --------------------------------------------------------------------------- #
    # Search Functionality
    # --------------------------------------------------------------------------- #

    def search(self, query: str, limit: int = 20, offset: int = 0) -> Dict:
        """
        Search across prompt, attachments, and responses with case-insensitive substring matching.
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            offset: Number of results to skip (for pagination)
            
        Returns:
            Dictionary with query, total count, limit, offset, and list of SearchResultItem-like results
        """
        from schemas import SearchItemType
        
        query_lower = query.lower()
        results = []
        
        # Search in prompt
        if self.prompt and query_lower in self.prompt.lower():
            # Find snippet around match
            prompt_lower = self.prompt.lower()
            idx = prompt_lower.find(query_lower)
            start = max(0, idx - 50)
            end = min(len(self.prompt), idx + len(query) + 50)
            snippet = self.prompt[start:end]
            if start > 0:
                snippet = "..." + snippet
            if end < len(self.prompt):
                snippet = snippet + "..."
            
            results.append({
                "id": None,
                "type": SearchItemType.PROMPT,
                "name": "Prompt",
                "snippet": snippet,
            })
        
        # Search in attachments
        for att in self.attachments:
            if not att.binary and query_lower in att.content.lower():
                content_lower = att.content.lower()
                idx = content_lower.find(query_lower)
                start = max(0, idx - 50)
                end = min(len(att.content), idx + len(query) + 50)
                snippet = att.content[start:end]
                if start > 0:
                    snippet = "..." + snippet
                if end < len(att.content):
                    snippet = snippet + "..."
                
                results.append({
                    "id": att.id,
                    "type": SearchItemType.ATTACHMENT,
                    "name": att.filename,
                    "snippet": snippet,
                })
        
        # Search in responses
        for resp in self.responses:
            if query_lower in resp.content.lower():
                content_lower = resp.content.lower()
                idx = content_lower.find(query_lower)
                start = max(0, idx - 50)
                end = min(len(resp.content), idx + len(query) + 50)
                snippet = resp.content[start:end]
                if start > 0:
                    snippet = "..." + snippet
                if end < len(resp.content):
                    snippet = snippet + "..."
                
                results.append({
                    "id": resp.id,
                    "type": SearchItemType.RESPONSE,
                    "name": f"Response from {resp.source}",
                    "snippet": snippet,
                })
        
        # Apply pagination
        total = len(results)
        paginated_results = results[offset:offset + limit]
        
        return {
            "query": query,
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": paginated_results,
        }

    # --------------------------------------------------------------------------- #
    # Batch Queue Operations (Phase-2)
    # --------------------------------------------------------------------------- #

    def enqueue_batch(self, prompt: str, models: List[str]) -> List[BatchJob]:
        """
        Enqueue batch processing jobs for a prompt across multiple models.
        
        Args:
            prompt: The prompt text to process
            models: List of model identifiers (e.g., ["openai:gpt-4", "anthropic:claude-3"])
            
        Returns:
            List of created BatchJob objects
        """
        jobs = []
        for model in models:
            job = BatchJob(
                prompt=prompt,
                model=model,
                status=BatchJobStatus.PENDING,
                error=None,
            )
            self.batch_jobs.append(job)
            jobs.append(job)
        return jobs

    def get_batch_jobs(self) -> List[BatchJob]:
        """
        Get all batch jobs.
        
        Returns:
            List of BatchJob objects
        """
        return list(self.batch_jobs)

