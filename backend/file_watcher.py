"""
File System Watcher for Orchestrator Real-Time Updates
WO-WEBSOCKET-REALTIME-UPDATES-001

Monitors coderef directories across all tracked projects for plan.json, stub.json,
and workorder-log.txt changes. Broadcasts events via WebSocket with debouncing.
"""

import os
import logging
import threading
from pathlib import Path
from typing import Dict, Set
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

logger = logging.getLogger(__name__)

# Global observer instance
_observer: Observer | None = None
_event_queue: Dict[str, Dict] = {}
_queue_lock = threading.Lock()
_debounce_timer: threading.Timer | None = None


class CodeRefEventHandler(FileSystemEventHandler):
    """
    Handles file system events for coderef directories.
    Debounces rapid changes and broadcasts events via WebSocket.
    """

    def __init__(self, websocket_manager):
        super().__init__()
        self.manager = websocket_manager
        self.watched_patterns = ['plan.json', 'stub.json', 'workorder-log.txt']

    def _should_process(self, path: str) -> bool:
        """Check if file matches watched patterns."""
        file_name = os.path.basename(path)
        return file_name in self.watched_patterns

    def _extract_event_data(self, event: FileSystemEvent) -> Dict | None:
        """Extract structured event data from file system event."""
        if not self._should_process(event.src_path):
            return None

        file_path = Path(event.src_path)
        file_name = file_path.name

        # Determine project path (walk up to find project root)
        project_path = None
        feature_name = None

        parts = file_path.parts
        try:
            # Find coderef in path
            coderef_index = parts.index('coderef')
            project_path = Path(*parts[:coderef_index])

            # Extract feature name if in working/ or archived/
            if coderef_index + 2 < len(parts):
                if parts[coderef_index + 1] in ['working', 'archived', 'stubs']:
                    feature_name = parts[coderef_index + 2]
        except (ValueError, IndexError):
            pass

        # Determine event type
        event_type_map = {
            'plan.json': 'plan',
            'stub.json': 'stub',
            'workorder-log.txt': 'workorder'
        }

        base_type = event_type_map.get(file_name, 'unknown')

        if event.event_type == 'created':
            event_type = f'{base_type}_added'
        elif event.event_type == 'modified':
            event_type = f'{base_type}_updated'
        elif event.event_type == 'deleted':
            event_type = f'{base_type}_deleted'
        else:
            return None

        return {
            'type': event_type,
            'file_path': str(file_path),
            'file_name': file_name,
            'project_path': str(project_path) if project_path else None,
            'feature_name': feature_name,
            'timestamp': datetime.utcnow().isoformat()
        }

    def _queue_event(self, event_data: Dict):
        """
        Add event to queue with debouncing.
        Events are batched by file path to avoid duplicates.
        """
        global _debounce_timer

        with _queue_lock:
            # Use file_path as key for deduplication
            file_path = event_data['file_path']
            _event_queue[file_path] = event_data

            # Cancel existing timer
            if _debounce_timer and _debounce_timer.is_alive():
                _debounce_timer.cancel()

            # Start new timer (500ms debounce)
            _debounce_timer = threading.Timer(0.5, self._process_queue)
            _debounce_timer.start()

    def _process_queue(self):
        """Process all queued events and broadcast them."""
        global _event_queue

        with _queue_lock:
            if not _event_queue:
                return

            events_to_broadcast = list(_event_queue.values())
            _event_queue.clear()

        logger.info(f"Processing {len(events_to_broadcast)} debounced events")

        # Broadcast events asynchronously
        for event_data in events_to_broadcast:
            try:
                # Schedule broadcast (will be handled by event loop)
                import asyncio
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self.manager.broadcast(event_data))
                else:
                    # If no event loop, broadcast in background thread
                    threading.Thread(
                        target=lambda: asyncio.run(self.manager.broadcast(event_data))
                    ).start()
            except Exception as e:
                logger.error(f"Failed to broadcast event: {e}")

    def on_created(self, event):
        """Handle file creation events."""
        if not event.is_directory:
            event_data = self._extract_event_data(event)
            if event_data:
                logger.debug(f"File created: {event.src_path}")
                self._queue_event(event_data)

    def on_modified(self, event):
        """Handle file modification events."""
        if not event.is_directory:
            event_data = self._extract_event_data(event)
            if event_data:
                logger.debug(f"File modified: {event.src_path}")
                self._queue_event(event_data)

    def on_deleted(self, event):
        """Handle file deletion events."""
        if not event.is_directory:
            event_data = self._extract_event_data(event)
            if event_data:
                logger.debug(f"File deleted: {event.src_path}")
                self._queue_event(event_data)


def start_watching(project_paths: list[str], websocket_manager):
    """
    Start watching coderef directories in all project paths.

    Args:
        project_paths: List of project root paths to monitor
        websocket_manager: WebSocket manager for broadcasting events
    """
    global _observer

    if _observer and _observer.is_alive():
        logger.warning("File watcher already running")
        return

    logger.info(f"Starting file watcher for {len(project_paths)} projects")

    _observer = Observer()
    event_handler = CodeRefEventHandler(websocket_manager)

    watched_paths: Set[str] = set()

    for project_path in project_paths:
        coderef_path = os.path.join(project_path, 'coderef')

        if not os.path.exists(coderef_path):
            logger.warning(f"Coderef directory not found: {coderef_path}")
            continue

        # Watch coderef directory recursively
        try:
            _observer.schedule(event_handler, coderef_path, recursive=True)
            watched_paths.add(coderef_path)
            logger.info(f"Watching: {coderef_path}")
        except Exception as e:
            logger.error(f"Failed to watch {coderef_path}: {e}")

    if watched_paths:
        _observer.start()
        logger.info(f"File watcher started, monitoring {len(watched_paths)} directories")
    else:
        logger.warning("No valid coderef directories found to watch")


def stop_watching():
    """Stop the file watcher gracefully."""
    global _observer, _debounce_timer

    if _debounce_timer and _debounce_timer.is_alive():
        _debounce_timer.cancel()

    if _observer and _observer.is_alive():
        logger.info("Stopping file watcher")
        _observer.stop()
        _observer.join(timeout=5)
        _observer = None
        logger.info("File watcher stopped")
