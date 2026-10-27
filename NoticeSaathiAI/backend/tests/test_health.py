def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "NoticeSaathi AI"
    assert "ocr" in data
    assert "ai" in data

def test_ocr_health_endpoint(client):
    response = client.get("/api/health/ocr")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data
    assert "engine" in data
    assert "message" in data

def test_ai_health_endpoint(client):
    response = client.get("/api/health/ai")
    assert response.status_code == 200
    data = response.json()
    assert "configured_provider" in data
    assert "active_provider" in data
    assert "is_mock_mode" in data
    assert data["is_mock_mode"] is True
