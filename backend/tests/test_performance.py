"""
Performance tests for API endpoints.
Tests with large datasets: 50 attachments, 10 responses, 250k characters.
"""

import time
import pytest
from fastapi.testclient import TestClient
from api import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def large_dataset(client):
    """Set up large dataset: 50 attachments, 10 responses, 250k characters."""
    # Clear existing data
    client.delete("/prompt")
    client.delete("/attachments")
    client.delete("/responses")
    
    # Generate ~5k characters per attachment to reach ~250k total
    chars_per_attachment = 5000
    attachment_text = "x" * chars_per_attachment
    
    # Add 50 attachments
    for i in range(50):
        response = client.post(
            "/attachments/text",
            json={"text": attachment_text, "suggested_name": f"file_{i}.txt"}
        )
        assert response.status_code == 200
    
    # Add 10 responses (~25k chars each to reach ~250k total)
    chars_per_response = 25000
    response_text = "y" * chars_per_response
    
    for i in range(10):
        response = client.post("/responses", json={"text": response_text})
        assert response.status_code == 200
    
    # Add a prompt (~10k chars)
    prompt_text = "z" * 10000
    response = client.post("/prompt", json={"text": prompt_text})
    assert response.status_code == 200
    
    yield
    
    # Cleanup
    client.delete("/prompt")
    client.delete("/attachments")
    client.delete("/responses")


def test_search_performance(client, large_dataset):
    """Test search endpoint performance with large dataset."""
    # Target: <150ms for search across 50 attachments
    start_time = time.time()
    
    response = client.get("/search?q=x&limit=20&offset=0")
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "total" in data
    
    # Verify performance target
    assert elapsed_ms < 150, f"Search took {elapsed_ms:.2f}ms, target is <150ms"
    
    print(f"Search performance: {elapsed_ms:.2f}ms (target: <150ms)")


def test_preview_performance(client, large_dataset):
    """Test preview endpoint performance with large dataset."""
    # Test truncated preview
    start_time = time.time()
    response = client.get("/preview")
    elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "preview" in data
    
    # Truncated preview should be fast
    assert elapsed_ms < 200, f"Preview took {elapsed_ms:.2f}ms, target is <200ms"
    
    print(f"Preview performance: {elapsed_ms:.2f}ms (target: <200ms)")
    
    # Test full preview (may be slower, but should still be reasonable)
    start_time = time.time()
    response = client.get("/preview/full")
    elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "preview" in data
    
    # Full preview with 250k chars may take longer, but should be <1s
    assert elapsed_ms < 1000, f"Full preview took {elapsed_ms:.2f}ms, target is <1000ms"
    
    print(f"Full preview performance: {elapsed_ms:.2f}ms (target: <1000ms)")


def test_token_counting_performance(client, large_dataset):
    """Test token counting endpoint performance."""
    # Target: <200ms for tokenization of 10k characters
    start_time = time.time()
    
    response = client.get("/tokens")
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "prompt_tokens" in data
    assert "attachment_tokens" in data
    assert "response_tokens" in data
    
    # Verify performance target
    # Note: With caching, first call may be slower, subsequent calls should be faster
    assert elapsed_ms < 500, f"Token counting took {elapsed_ms:.2f}ms, target is <500ms (first call may be slower due to caching)"
    
    print(f"Token counting performance: {elapsed_ms:.2f}ms (target: <500ms for first call)")
    
    # Test cached performance (second call should be faster)
    start_time = time.time()
    response = client.get("/tokens")
    cached_elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    
    # Cached call should be much faster
    assert cached_elapsed_ms < 200, f"Cached token counting took {cached_elapsed_ms:.2f}ms, target is <200ms"
    
    print(f"Cached token counting performance: {cached_elapsed_ms:.2f}ms (target: <200ms)")


def test_session_summary_performance(client, large_dataset):
    """Test session summary endpoint performance."""
    start_time = time.time()
    
    response = client.get("/session")
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "has_prompt" in data
    assert "attachment_count" in data
    assert "response_count" in data
    
    # Session summary should be very fast (just counting)
    assert elapsed_ms < 50, f"Session summary took {elapsed_ms:.2f}ms, target is <50ms"
    
    print(f"Session summary performance: {elapsed_ms:.2f}ms (target: <50ms)")


def test_responses_summary_performance(client, large_dataset):
    """Test responses summary endpoint performance."""
    start_time = time.time()
    
    response = client.get("/responses/summary")
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "total_chars" in data
    
    # Responses summary should be fast
    assert elapsed_ms < 100, f"Responses summary took {elapsed_ms:.2f}ms, target is <100ms"
    
    print(f"Responses summary performance: {elapsed_ms:.2f}ms (target: <100ms)")


def test_export_json_performance(client, large_dataset):
    """Test export JSON endpoint performance with large dataset."""
    start_time = time.time()
    
    response = client.get("/export/json")
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "prompt" in data
    assert "attachments" in data
    assert "responses" in data
    
    # Export with 250k chars may take some time for serialization
    assert elapsed_ms < 500, f"Export JSON took {elapsed_ms:.2f}ms, target is <500ms"
    
    print(f"Export JSON performance: {elapsed_ms:.2f}ms (target: <500ms)")


def test_ui_responsiveness_under_load(client, large_dataset):
    """Test that UI-related endpoints remain responsive under load."""
    # Simulate multiple rapid requests
    endpoints = [
        "/session",
        "/responses/summary",
        "/attachments",
    ]
    
    max_elapsed = 0
    for endpoint in endpoints:
        start_time = time.time()
        response = client.get(endpoint)
        elapsed_ms = (time.time() - start_time) * 1000
        max_elapsed = max(max_elapsed, elapsed_ms)
        
        assert response.status_code == 200
    
    # All UI endpoints should remain fast even under load
    assert max_elapsed < 200, f"UI endpoint took {max_elapsed:.2f}ms, target is <200ms"
    
    print(f"UI responsiveness: max {max_elapsed:.2f}ms across endpoints (target: <200ms)")

