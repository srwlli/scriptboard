"""
Key logger module for recording keyboard and clipboard events.

This module provides the KeyLogger class for capturing keyboard actions
and clipboard activity on Windows, with support for saving sequences as macros.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

try:
    from pynput import keyboard
    from pynput.keyboard import Key, Listener
except ImportError:
    keyboard = None
    Key = None
    Listener = None

try:
    import pyperclip
except ImportError:
    pyperclip = None

try:
    import win32clipboard
    import win32con
    import win32event
    import win32api
    WIN32_AVAILABLE = True
except ImportError:
    WIN32_AVAILABLE = False


class EventType(str, Enum):
    """Types of events that can be recorded."""
    KEY_DOWN = "KeyDown"
    KEY_UP = "KeyUp"
    CLIPBOARD_SET = "ClipboardSet"
    DELAY = "Delay"
    WINDOW_FOCUS = "WindowFocus"  # Optional, not implemented in initial version


@dataclass
class MacroEvent:
    """Represents a single recorded event in a macro."""
    type: EventType
    ts_delta_ms: int = 0  # Milliseconds since previous event
    # KeyDown/KeyUp fields
    key: Optional[str] = None  # Key name (e.g., "a", "space", "ctrl")
    # ClipboardSet fields
    clipboard_text: Optional[str] = None
    # Delay fields (explicit delay)
    delay_ms: Optional[int] = None
    # WindowFocus fields (optional, not implemented)
    window_title: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert event to dictionary for JSON serialization."""
        result = {
            "type": self.type.value,
            "ts_delta_ms": self.ts_delta_ms,
        }
        if self.key is not None:
            result["key"] = self.key
        if self.clipboard_text is not None:
            result["clipboard_text"] = self.clipboard_text
        if self.delay_ms is not None:
            result["delay_ms"] = self.delay_ms
        if self.window_title is not None:
            result["window_title"] = self.window_title
        return result

    @classmethod
    def from_dict(cls, data: dict) -> MacroEvent:
        """Create event from dictionary."""
        event_type = EventType(data["type"])
        event = cls(
            type=event_type,
            ts_delta_ms=data.get("ts_delta_ms", 0),
        )
        if "key" in data:
            event.key = data["key"]
        if "clipboard_text" in data:
            event.clipboard_text = data["clipboard_text"]
        if "delay_ms" in data:
            event.delay_ms = data["delay_ms"]
        if "window_title" in data:
            event.window_title = data["window_title"]
        return event


class KeyLogger:
    """
    Records keyboard and clipboard events for macro creation.
    
    Windows-first implementation using pynput for keyboard hooks and
    Win32 APIs (with polling fallback) for clipboard monitoring.
    """

    def __init__(self):
        """Initialize the key logger."""
        self._recording = False
        self._events: List[MacroEvent] = []
        self._last_timestamp: Optional[float] = None
        self._keyboard_listener: Optional[Listener] = None
        self._clipboard_thread: Optional[threading.Thread] = None
        self._clipboard_stop_event = threading.Event()
        self._last_clipboard_content: Optional[str] = None
        self._clipboard_lock = threading.Lock()
        
        # Maximum idle gap between events (5 seconds)
        self._max_idle_gap_ms = 5000

    def _key_to_string(self, key) -> str:
        """Convert pynput Key object to string representation."""
        if key is None:
            return ""
        
        # Handle special keys
        if isinstance(key, Key):
            # Map common special keys
            key_map = {
                Key.space: "space",
                Key.enter: "enter",
                Key.tab: "tab",
                Key.backspace: "backspace",
                Key.delete: "delete",
                Key.esc: "escape",
                Key.shift: "shift",
                Key.ctrl: "ctrl",
                Key.alt: "alt",
                Key.cmd: "cmd",  # Windows key
                Key.up: "up",
                Key.down: "down",
                Key.left: "left",
                Key.right: "right",
                Key.home: "home",
                Key.end: "end",
                Key.page_up: "page_up",
                Key.page_down: "page_down",
            }
            return key_map.get(key, key.name if hasattr(key, 'name') else str(key))
        
        # Regular character key
        return str(key).replace("'", "")

    def _on_key_press(self, key):
        """Handle key press event."""
        print(f"[KeyLogger] _on_key_press called: {key}, recording={self._recording}")
        if not self._recording:
            return

        try:
            key_str = self._key_to_string(key)
            print(f"[KeyLogger] Recording KEY_DOWN: {key_str}")
            self._add_event(EventType.KEY_DOWN, key=key_str)
        except Exception as e:
            # Log error but don't stop recording
            print(f"[KeyLogger] Error recording key press: {e}")

    def _on_key_release(self, key):
        """Handle key release event."""
        if not self._recording:
            return

        try:
            key_str = self._key_to_string(key)
            print(f"[KeyLogger] Recording KEY_UP: {key_str}")
            self._add_event(EventType.KEY_UP, key=key_str)
        except Exception as e:
            # Log error but don't stop recording
            print(f"[KeyLogger] Error recording key release: {e}")

    def _add_event(self, event_type: EventType, **kwargs):
        """Add an event to the recording with timestamp tracking."""
        current_time = time.time()
        ts_delta_ms = 0
        
        if self._last_timestamp is not None:
            delta_seconds = current_time - self._last_timestamp
            ts_delta_ms = int(delta_seconds * 1000)
            
            # Clamp very long idle gaps to max_idle_gap_ms
            if ts_delta_ms > self._max_idle_gap_ms:
                ts_delta_ms = self._max_idle_gap_ms
        
        event = MacroEvent(
            type=event_type,
            ts_delta_ms=ts_delta_ms,
            **kwargs
        )
        
        self._events.append(event)
        self._last_timestamp = current_time

    def _monitor_clipboard_win32(self):
        """Monitor clipboard using Win32 events (preferred method)."""
        if not WIN32_AVAILABLE:
            return
        
        try:
            # Get initial clipboard content
            win32clipboard.OpenClipboard()
            try:
                if win32clipboard.IsClipboardFormatAvailable(win32con.CF_TEXT):
                    content = win32clipboard.GetClipboardData(win32con.CF_TEXT)
                    if isinstance(content, bytes):
                        content = content.decode('utf-8', errors='ignore')
                    self._last_clipboard_content = content
            finally:
                win32clipboard.CloseClipboard()
            
            # Create clipboard change event
            clipboard_event = win32event.CreateEvent(None, False, False, None)
            
            while not self._clipboard_stop_event.is_set():
                # Wait for clipboard change or timeout (100ms)
                result = win32api.MsgWaitForMultipleObjects(
                    [clipboard_event],
                    False,
                    100,  # 100ms timeout
                    win32con.QS_ALLINPUT
                )
                
                if result == win32con.WAIT_OBJECT_0:
                    # Clipboard changed
                    self._check_clipboard_change()
                elif result == win32con.WAIT_TIMEOUT:
                    # Timeout - check clipboard anyway (fallback)
                    self._check_clipboard_change()
        except Exception as e:
            # Fall back to polling if Win32 fails
            print(f"Win32 clipboard monitoring failed, using polling: {e}")
            self._monitor_clipboard_polling()

    def _monitor_clipboard_polling(self):
        """Monitor clipboard using polling (fallback method)."""
        if pyperclip is None:
            return
        
        try:
            # Get initial clipboard content
            self._last_clipboard_content = pyperclip.paste()
        except Exception:
            self._last_clipboard_content = None
        
        while not self._clipboard_stop_event.is_set():
            time.sleep(0.1)  # 100ms interval
            self._check_clipboard_change()

    def _check_clipboard_change(self):
        """Check if clipboard content has changed and record event if so."""
        if not self._recording:
            return
        
        try:
            if pyperclip is None:
                return
            
            current_content = pyperclip.paste()
            
            with self._clipboard_lock:
                if current_content != self._last_clipboard_content:
                    self._last_clipboard_content = current_content
                    self._add_event(
                        EventType.CLIPBOARD_SET,
                        clipboard_text=current_content
                    )
        except Exception as e:
            # Ignore clipboard errors (e.g., if clipboard contains non-text)
            pass

    def _start_clipboard_monitoring(self):
        """Start clipboard monitoring in a separate thread."""
        if pyperclip is None:
            return
        
        self._clipboard_stop_event.clear()
        
        # Try Win32 first, fall back to polling
        if WIN32_AVAILABLE:
            self._clipboard_thread = threading.Thread(
                target=self._monitor_clipboard_win32,
                daemon=True
            )
        else:
            self._clipboard_thread = threading.Thread(
                target=self._monitor_clipboard_polling,
                daemon=True
            )
        
        self._clipboard_thread.start()

    def _stop_clipboard_monitoring(self):
        """Stop clipboard monitoring."""
        self._clipboard_stop_event.set()
        if self._clipboard_thread and self._clipboard_thread.is_alive():
            self._clipboard_thread.join(timeout=1.0)

    def start_recording(self):
        """
        Start recording keyboard and clipboard events.
        
        Raises:
            RuntimeError: If already recording or if dependencies are missing.
        """
        if self._recording:
            raise RuntimeError("Already recording")
        
        if keyboard is None or Listener is None:
            raise RuntimeError("pynput is required for keyboard recording")
        
        if pyperclip is None:
            raise RuntimeError("pyperclip is required for clipboard monitoring")
        
        # Reset state
        self._events.clear()
        self._last_timestamp = None
        self._last_clipboard_content = None
        
        # Start keyboard listener
        self._keyboard_listener = Listener(
            on_press=self._on_key_press,
            on_release=self._on_key_release
        )
        self._keyboard_listener.start()
        print(f"[KeyLogger] Keyboard listener started: {self._keyboard_listener}")
        print(f"[KeyLogger] Listener is_alive: {self._keyboard_listener.is_alive()}")

        # Start clipboard monitoring
        self._start_clipboard_monitoring()

        # Mark as recording
        self._recording = True
        self._last_timestamp = time.time()
        print(f"[KeyLogger] Recording started, _recording={self._recording}")

    def stop_recording(self) -> List[MacroEvent]:
        """
        Stop recording and return captured events.

        Returns:
            List of captured MacroEvent objects.

        Raises:
            RuntimeError: If not currently recording.
        """
        if not self._recording:
            raise RuntimeError("Not currently recording")

        print(f"[KeyLogger] Stopping recording, events captured: {len(self._events)}")

        # Stop keyboard listener
        if self._keyboard_listener:
            print(f"[KeyLogger] Stopping keyboard listener, is_alive: {self._keyboard_listener.is_alive()}")
            self._keyboard_listener.stop()
            self._keyboard_listener = None

        # Stop clipboard monitoring
        self._stop_clipboard_monitoring()

        # Mark as not recording
        self._recording = False

        print(f"[KeyLogger] Recording stopped, returning {len(self._events)} events")
        # Return copy of events
        return list(self._events)

    def is_recording(self) -> bool:
        """Check if currently recording."""
        return self._recording

    def get_events(self) -> List[MacroEvent]:
        """Get current list of events (without stopping recording)."""
        return list(self._events)

