import pytest
from fastapi.testclient import TestClient
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "smart-hospital-federated-learning-api",
        "phase": "10.2"
    }

def test_metrics_endpoints():
    endpoints = [
        "/api/metrics/centralized-baselines",
        "/api/metrics/multimodal-confounding",
        "/api/metrics/centralized-vs-federated",
        "/api/metrics/non-iid",
        "/api/metrics/fedprox",
        "/api/metrics/personalization",
        "/api/metrics/byzantine",
        "/api/metrics/dp",
        "/api/metrics/secure-aggregation",
        "/api/metrics/attack-surface",
        "/api/metrics/all"
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 200, f"Failed at {endpoint}"
        json_data = response.json()
        assert "source" in json_data
        assert "status" in json_data
        assert json_data["status"] == "verified"
        assert "data" in json_data

def test_inference_invalid_input():
    # Only 2 features instead of 31
    response = client.post("/api/inference", json={"features": [0.1, 0.2]})
    assert response.status_code == 422 # Unprocessable Entity
    
    # String instead of float
    response = client.post("/api/inference", json={"features": ["text"] * 31})
    assert response.status_code == 422

def test_inference_valid_synthetic_input():
    # Exactly 31 synthetic float features
    synthetic_features = [0.0] * 31
    response = client.post("/api/inference", json={"features": synthetic_features})
    
    # We expect this to be BLOCKED (503) because Phase 7.3 fedavg_global_model.pth is missing
    assert response.status_code == 503
    json_data = response.json()
    assert json_data["detail"]["status"] == "BLOCKED"
    assert "not found" in json_data["detail"]["message"].lower()

def test_no_sensitive_data_exposure():
    # Ensure there are no routes that expose IP or raw text
    response = client.get("/api/metrics/all")
    content = response.text.lower()
    assert "192.168" not in content
    assert "patient" not in content
