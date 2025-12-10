"""
Integration tests for API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from api import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_session_endpoint(client):
    """Test session summary endpoint."""
    response = client.get("/session")
    assert response.status_code == 200
    data = response.json()
    assert "has_prompt" in data
    assert "attachment_count" in data
    assert "response_count" in data


def test_prompt_endpoint(client):
    """Test prompt endpoints."""
    # Set prompt
    response = client.post("/prompt", json={"text": "Test prompt"})
    assert response.status_code == 200

    # Check session
    response = client.get("/session")
    assert response.status_code == 200
    data = response.json()
    assert data["has_prompt"] is True

    # Clear prompt
    response = client.delete("/prompt")
    assert response.status_code == 200

    # Verify cleared
    response = client.get("/session")
    data = response.json()
    assert data["has_prompt"] is False


def test_attachment_endpoints(client):
    """Test attachment endpoints."""
    # Add attachment
    response = client.post("/attachments/text", json={"text": "File content", "suggested_name": "test.txt"})
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"

    # List attachments
    response = client.get("/attachments")
    assert response.status_code == 200
    attachments = response.json()
    assert len(attachments) == 1

    # Clear attachments
    response = client.delete("/attachments")
    assert response.status_code == 200

    # Verify cleared
    response = client.get("/attachments")
    attachments = response.json()
    assert len(attachments) == 0


def test_response_endpoints(client):
    """Test response endpoints."""
    # Add response
    response = client.post("/responses", json={"text": "Response content"})
    assert response.status_code == 200

    # Get summary
    response = client.get("/responses/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1

    # Clear responses
    response = client.delete("/responses")
    assert response.status_code == 200

    # Verify cleared
    response = client.get("/responses/summary")
    data = response.json()
    assert data["count"] == 0


def test_search_endpoint(client):
    """Test search endpoint."""
    # Add content
    client.post("/prompt", json={"text": "Test search query"})
    client.post("/attachments/text", json={"text": "Another search result", "suggested_name": "test.txt"})

    # Search
    response = client.get("/search?q=search")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2


def test_error_handling(client):
    """Test error handling returns structured envelope."""
    # Invalid endpoint
    response = client.get("/nonexistent")
    assert response.status_code == 404

    # Invalid payload
    response = client.post("/prompt", json={"invalid": "data"})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]

