"""
Integration tests for macro API endpoints.
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from api import app, get_macros_dir
from key_logger import KeyLogger, MacroEvent, EventType


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_key_logger():
    """Create a mock key logger for testing."""
    logger = MagicMock(spec=KeyLogger)
    logger.is_recording.return_value = False
    logger.get_events.return_value = []
    return logger


@pytest.fixture
def temp_macros_dir(monkeypatch):
    """Create temporary macros directory for testing."""
    temp_dir = Path(tempfile.mkdtemp())
    monkeypatch.setattr("api.get_macros_dir", lambda: temp_dir)
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


class TestMacroRecordingEndpoints:
    """Tests for macro recording endpoints."""
    
    @patch('api.key_logger')
    def test_start_recording_success(self, mock_key_logger_global, client):
        """Test successful recording start."""
        mock_key_logger_global.start_recording = MagicMock()
        
        response = client.post("/macros/record/start")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "recording"
        mock_key_logger_global.start_recording.assert_called_once()
    
    @patch('api.key_logger', None)
    def test_start_recording_unavailable(self, client):
        """Test recording start when key logger is unavailable."""
        response = client.post("/macros/record/start")
        
        assert response.status_code == 503
        data = response.json()
        assert "not available" in data["detail"].lower()
    
    @patch('api.key_logger')
    def test_start_recording_already_recording(self, mock_key_logger_global, client):
        """Test recording start when already recording."""
        mock_key_logger_global.start_recording.side_effect = RuntimeError("Already recording")
        
        response = client.post("/macros/record/start")
        
        assert response.status_code == 409
        data = response.json()
        assert "already" in data["detail"].lower()
    
    @patch('api.key_logger')
    def test_stop_recording_success(self, mock_key_logger_global, client):
        """Test successful recording stop."""
        # Create mock events
        mock_events = [
            MacroEvent(type=EventType.KEY_DOWN, ts_delta_ms=0, key="a"),
            MacroEvent(type=EventType.KEY_UP, ts_delta_ms=50, key="a"),
        ]
        mock_key_logger_global.stop_recording.return_value = mock_events
        
        response = client.post("/macros/record/stop")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "stopped"
        assert "events" in data
        assert len(data["events"]) == 2
        assert data["events"][0]["type"] == "KeyDown"
        assert data["events"][0]["key"] == "a"
    
    @patch('api.key_logger')
    def test_stop_recording_not_recording(self, mock_key_logger_global, client):
        """Test stop recording when not recording."""
        mock_key_logger_global.stop_recording.side_effect = RuntimeError("Not currently recording")
        
        response = client.post("/macros/record/stop")
        
        assert response.status_code == 409
        data = response.json()
        assert "not currently" in data["detail"].lower()


class TestMacroSaveEndpoint:
    """Tests for macro save endpoint."""
    
    def test_save_macro_success(self, client, temp_macros_dir):
        """Test successful macro save."""
        payload = {
            "name": "test_macro",
            "events": [
                {"type": "KeyDown", "ts_delta_ms": 0, "key": "a"},
                {"type": "KeyUp", "ts_delta_ms": 50, "key": "a"},
            ]
        }
        
        response = client.post("/macros/save", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "test_macro"
        assert "path" in data
        assert "created_at" in data
        
        # Verify file was created
        macro_files = list(temp_macros_dir.glob("*.json"))
        assert len(macro_files) == 1
        
        # Verify file content
        with open(macro_files[0], "r", encoding="utf-8") as f:
            macro_data = json.load(f)
        
        assert macro_data["name"] == "test_macro"
        assert macro_data["id"] == data["id"]
        assert len(macro_data["events"]) == 2
    
    def test_save_macro_invalid_name(self, client):
        """Test macro save with invalid name."""
        payload = {
            "name": "test@macro!",  # Invalid characters
            "events": [{"type": "KeyDown", "ts_delta_ms": 0, "key": "a"}]
        }
        
        response = client.post("/macros/save", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert "alphanumeric" in data["detail"].lower()
    
    def test_save_macro_empty_name(self, client):
        """Test macro save with empty name."""
        payload = {
            "name": "",
            "events": [{"type": "KeyDown", "ts_delta_ms": 0, "key": "a"}]
        }
        
        response = client.post("/macros/save", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_save_macro_no_events(self, client):
        """Test macro save with no events."""
        payload = {
            "name": "test_macro",
            "events": []
        }
        
        response = client.post("/macros/save", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert "at least one event" in data["detail"].lower()
    
    def test_save_macro_atomic_write(self, client, temp_macros_dir):
        """Test that macro save uses atomic write."""
        payload = {
            "name": "atomic_test",
            "events": [{"type": "KeyDown", "ts_delta_ms": 0, "key": "a"}]
        }
        
        response = client.post("/macros/save", json=payload)
        
        assert response.status_code == 200
        
        # Verify no .tmp files remain
        tmp_files = list(temp_macros_dir.glob("*.tmp"))
        assert len(tmp_files) == 0
        
        # Verify only .json files exist
        json_files = list(temp_macros_dir.glob("*.json"))
        assert len(json_files) == 1
    
    def test_save_macro_filename_sanitization(self, client, temp_macros_dir):
        """Test that macro filename is properly sanitized."""
        payload = {
            "name": "test/macro@name!",
            "events": [{"type": "KeyDown", "ts_delta_ms": 0, "key": "a"}]
        }
        
        response = client.post("/macros/save", json=payload)
        
        assert response.status_code == 200
        
        # Verify file exists with sanitized name
        macro_files = list(temp_macros_dir.glob("*.json"))
        assert len(macro_files) == 1
        # Filename should not contain invalid characters
        assert "@" not in macro_files[0].name
        assert "/" not in macro_files[0].name
        assert "!" not in macro_files[0].name


class TestMacroJSONStructure:
    """Tests for macro JSON structure validation."""
    
    def test_macro_json_structure(self, client, temp_macros_dir):
        """Test that saved macro has correct JSON structure."""
        payload = {
            "name": "structured_test",
            "events": [
                {"type": "KeyDown", "ts_delta_ms": 0, "key": "space"},
                {"type": "KeyUp", "ts_delta_ms": 100, "key": "space"},
                {"type": "ClipboardSet", "ts_delta_ms": 200, "clipboard_text": "test"},
            ]
        }
        
        response = client.post("/macros/save", json=payload)
        assert response.status_code == 200
        
        # Load and validate JSON structure
        macro_files = list(temp_macros_dir.glob("*.json"))
        with open(macro_files[0], "r", encoding="utf-8") as f:
            macro_data = json.load(f)
        
        # Required fields
        assert "id" in macro_data
        assert "name" in macro_data
        assert "created_at" in macro_data
        assert "events" in macro_data
        
        # Validate event structure
        assert len(macro_data["events"]) == 3
        for event in macro_data["events"]:
            assert "type" in event
            assert "ts_delta_ms" in event
        
        # Validate specific event types
        assert macro_data["events"][0]["type"] == "KeyDown"
        assert macro_data["events"][0]["key"] == "space"
        assert macro_data["events"][2]["type"] == "ClipboardSet"
        assert macro_data["events"][2]["clipboard_text"] == "test"

