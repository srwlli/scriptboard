"""
Unit tests for ScriptboardCore.
"""

import pytest
from core import ScriptboardCore, Attachment, ResponseItem


class TestScriptboardCore:
    def test_init(self):
        """Test ScriptboardCore initialization."""
        core = ScriptboardCore()
        assert core.prompt == ""
        assert core.prompt_source is None
        assert len(core.attachments) == 0
        assert len(core.responses) == 0

    def test_set_prompt(self):
        """Test setting prompt."""
        core = ScriptboardCore()
        core.set_prompt("Test prompt", source="manual")
        assert core.prompt == "Test prompt"
        assert core.prompt_source == "manual"

    def test_clear_prompt(self):
        """Test clearing prompt."""
        core = ScriptboardCore()
        core.set_prompt("Test prompt")
        core.clear_prompt()
        assert core.prompt == ""
        assert core.prompt_source is None

    def test_add_attachment_from_text(self):
        """Test adding attachment from text."""
        core = ScriptboardCore()
        attachment = core.add_attachment_from_text("File content", suggested_name="test.txt")
        assert attachment.filename == "test.txt"
        assert attachment.content == "File content"
        assert attachment.lines == 1
        assert len(core.attachments) == 1

    def test_add_response(self):
        """Test adding response."""
        core = ScriptboardCore()
        response = core.add_response("Response content", source="GPT")
        assert response.content == "Response content"
        assert response.source == "GPT"
        assert len(core.responses) == 1

    def test_search(self):
        """Test search functionality."""
        core = ScriptboardCore()
        core.set_prompt("This is a test prompt")
        core.add_attachment_from_text("Attachment with keyword", suggested_name="test.txt")
        core.add_response("Response with keyword", source="GPT")

        results = core.search("keyword")
        assert results["total"] == 2
        assert len(results["results"]) == 2

    def test_to_dict(self):
        """Test session serialization."""
        core = ScriptboardCore()
        core.set_prompt("Test")
        core.add_attachment_from_text("Content", suggested_name="test.txt")
        core.add_response("Response", source="GPT")

        session_dict = core.to_dict()
        assert session_dict["prompt"] == "Test"
        assert len(session_dict["attachments"]) == 1
        assert len(session_dict["responses"]) == 1
        assert "schema_version" in session_dict

    def test_load_from_dict(self):
        """Test session deserialization."""
        core = ScriptboardCore()
        session_dict = {
            "schema_version": "1.0",
            "prompt": "Loaded prompt",
            "attachments": [
                {
                    "id": "att_123",
                    "filename": "test.txt",
                    "content": "Content",
                    "binary": False,
                }
            ],
            "responses": [
                {
                    "id": "resp_123",
                    "source": "GPT",
                    "content": "Response",
                }
            ],
        }

        core.load_from_dict(session_dict)
        assert core.prompt == "Loaded prompt"
        assert len(core.attachments) == 1
        assert len(core.responses) == 1

