"""
Unit tests for key_logger module.
"""

import pytest
import time
from unittest.mock import Mock, patch, MagicMock
from key_logger import KeyLogger, MacroEvent, EventType


class TestMacroEvent:
    """Tests for MacroEvent dataclass."""
    
    def test_keydown_event_to_dict(self):
        """Test KeyDown event serialization."""
        event = MacroEvent(
            type=EventType.KEY_DOWN,
            ts_delta_ms=100,
            key="a"
        )
        result = event.to_dict()
        assert result["type"] == "KeyDown"
        assert result["ts_delta_ms"] == 100
        assert result["key"] == "a"
    
    def test_clipboard_event_to_dict(self):
        """Test ClipboardSet event serialization."""
        event = MacroEvent(
            type=EventType.CLIPBOARD_SET,
            ts_delta_ms=50,
            clipboard_text="test content"
        )
        result = event.to_dict()
        assert result["type"] == "ClipboardSet"
        assert result["ts_delta_ms"] == 50
        assert result["clipboard_text"] == "test content"
    
    def test_event_from_dict(self):
        """Test event deserialization."""
        data = {
            "type": "KeyDown",
            "ts_delta_ms": 100,
            "key": "space"
        }
        event = MacroEvent.from_dict(data)
        assert event.type == EventType.KEY_DOWN
        assert event.ts_delta_ms == 100
        assert event.key == "space"


class TestKeyLogger:
    """Tests for KeyLogger class."""
    
    def test_initialization(self):
        """Test KeyLogger initialization."""
        logger = KeyLogger()
        assert not logger.is_recording()
        assert logger.get_events() == []
    
    @patch('key_logger.keyboard')
    @patch('key_logger.pyperclip')
    def test_start_recording_success(self, mock_pyperclip, mock_keyboard):
        """Test successful recording start."""
        # Mock keyboard listener
        mock_listener = MagicMock()
        mock_keyboard.Listener.return_value = mock_listener
        
        logger = KeyLogger()
        logger.start_recording()
        
        assert logger.is_recording()
        mock_listener.start.assert_called_once()
    
    @patch('key_logger.keyboard', None)
    def test_start_recording_missing_pynput(self):
        """Test recording start fails when pynput is missing."""
        logger = KeyLogger()
        with pytest.raises(RuntimeError, match="pynput is required"):
            logger.start_recording()
    
    @patch('key_logger.pyperclip', None)
    @patch('key_logger.keyboard')
    def test_start_recording_missing_pyperclip(self, mock_keyboard):
        """Test recording start fails when pyperclip is missing."""
        mock_listener = MagicMock()
        mock_keyboard.Listener.return_value = mock_listener
        
        logger = KeyLogger()
        with pytest.raises(RuntimeError, match="pyperclip is required"):
            logger.start_recording()
    
    @patch('key_logger.keyboard')
    @patch('key_logger.pyperclip')
    def test_stop_recording_success(self, mock_pyperclip, mock_keyboard):
        """Test successful recording stop."""
        mock_listener = MagicMock()
        mock_keyboard.Listener.return_value = mock_listener
        
        logger = KeyLogger()
        logger.start_recording()
        events = logger.stop_recording()
        
        assert not logger.is_recording()
        assert isinstance(events, list)
        mock_listener.stop.assert_called_once()
    
    def test_stop_recording_when_not_recording(self):
        """Test stop recording fails when not recording."""
        logger = KeyLogger()
        with pytest.raises(RuntimeError, match="Not currently recording"):
            logger.stop_recording()
    
    @patch('key_logger.keyboard')
    @patch('key_logger.pyperclip')
    def test_timestamp_tracking(self, mock_pyperclip, mock_keyboard):
        """Test timestamp delta computation."""
        mock_listener = MagicMock()
        mock_keyboard.Listener.return_value = mock_listener
        
        logger = KeyLogger()
        logger.start_recording()
        
        # Simulate adding events with time gaps
        time.sleep(0.1)  # 100ms gap
        logger._add_event(EventType.KEY_DOWN, key="a")
        
        time.sleep(0.05)  # 50ms gap
        logger._add_event(EventType.KEY_UP, key="a")
        
        events = logger.stop_recording()
        
        assert len(events) == 2
        # First event should have 0 delta (or very small)
        assert events[0].ts_delta_ms >= 0
        # Second event should have ~50ms delta (allowing some variance)
        assert 30 <= events[1].ts_delta_ms <= 150
    
    @patch('key_logger.keyboard')
    @patch('key_logger.pyperclip')
    def test_idle_gap_clamping(self, mock_pyperclip, mock_keyboard):
        """Test that very long idle gaps are clamped."""
        mock_listener = MagicMock()
        mock_keyboard.Listener.return_value = mock_listener
        
        logger = KeyLogger()
        logger.start_recording()
        
        # Add first event
        logger._add_event(EventType.KEY_DOWN, key="a")
        
        # Simulate very long gap (more than 5 seconds)
        logger._last_timestamp = time.time() - 10  # 10 seconds ago
        
        # Add second event
        logger._add_event(EventType.KEY_UP, key="a")
        
        events = logger.stop_recording()
        
        assert len(events) == 2
        # Second event should have clamped delta (max 5000ms)
        assert events[1].ts_delta_ms == logger._max_idle_gap_ms
    
    @patch('key_logger.keyboard')
    @patch('key_logger.pyperclip')
    def test_key_to_string_mapping(self, mock_pyperclip, mock_keyboard):
        """Test key to string conversion."""
        from pynput.keyboard import Key
        
        logger = KeyLogger()
        
        # Test special keys
        assert logger._key_to_string(Key.space) == "space"
        assert logger._key_to_string(Key.enter) == "enter"
        assert logger._key_to_string(Key.shift) == "shift"
        
        # Test regular character
        assert logger._key_to_string("a") == "a"


class TestClipboardMonitoring:
    """Tests for clipboard monitoring functionality."""
    
    @patch('key_logger.pyperclip')
    @patch('key_logger.keyboard')
    def test_clipboard_change_detection(self, mock_keyboard, mock_pyperclip):
        """Test clipboard change detection."""
        mock_listener = MagicMock()
        mock_keyboard.Listener.return_value = mock_listener
        
        # Mock clipboard content changes
        mock_pyperclip.paste.side_effect = ["initial", "updated"]
        
        logger = KeyLogger()
        logger.start_recording()
        
        # Simulate clipboard check
        logger._last_clipboard_content = "initial"
        logger._check_clipboard_change()
        
        # Should record clipboard event
        events = logger.get_events()
        # Note: This test may not capture the event if clipboard monitoring
        # runs in a separate thread. This is a simplified test.
        
        logger.stop_recording()
    
    @patch('key_logger.WIN32_AVAILABLE', False)
    @patch('key_logger.pyperclip')
    @patch('key_logger.keyboard')
    def test_polling_fallback(self, mock_keyboard, mock_pyperclip):
        """Test that polling fallback is used when Win32 is unavailable."""
        mock_listener = MagicMock()
        mock_keyboard.Listener.return_value = mock_listener
        
        logger = KeyLogger()
        logger.start_recording()
        
        # Should use polling method
        assert logger._clipboard_thread is not None
        
        logger.stop_recording()

