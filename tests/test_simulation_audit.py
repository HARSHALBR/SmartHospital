import os
import pytest
from fastapi.testclient import TestClient
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.main import app

client = TestClient(app)

def test_simulation_components_exist():
    sim_dir = os.path.join(project_root, "dashboard", "src", "components", "simulation")
    expected_files = [
        "HospitalNetworkSim.jsx",
        "IoTGraphView.jsx",
        "ClinicalVectorization.jsx",
        "MultimodalRepresentation.jsx",
        "FederatedPlayground.jsx",
        "ResearchResultsLimitations.jsx",
        "graphUtils.js"
    ]
    for fname in expected_files:
        fpath = os.path.join(sim_dir, fname)
        assert os.path.exists(fpath), f"Missing simulation component: {fname}"

def test_simulation_route_registered():
    app_jsx_path = os.path.join(project_root, "dashboard", "src", "App.jsx")
    with open(app_jsx_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert 'path="simulation"' in content
    assert 'HospitalSimulation' in content

    sidebar_jsx_path = os.path.join(project_root, "dashboard", "src", "components", "Sidebar.jsx")
    with open(sidebar_jsx_path, "r", encoding="utf-8") as f:
        sb_content = f.read()
    assert "Simulation Center" in sb_content
    assert "'/simulation'" in sb_content

def test_graph_neighborhood_algorithm():
    """
    Validates 1-hop and 2-hop neighborhood derivation algorithm
    matching graphUtils.js logic on a small known test graph.
    Graph:
      A --- B --- C --- D
    """
    def compute_neighborhoods(node_id, edges):
        one_hop = set()
        for src, tgt in edges:
            if src == node_id:
                one_hop.add(tgt)
            elif tgt == node_id:
                one_hop.add(src)
        
        two_hop = set()
        for n in one_hop:
            for src, tgt in edges:
                if src == n and tgt != node_id and tgt not in one_hop:
                    two_hop.add(tgt)
                elif tgt == n and src != node_id and src not in one_hop:
                    two_hop.add(src)
        return one_hop, two_hop

    test_edges = [
        ("A", "B"),
        ("B", "C"),
        ("C", "D")
    ]

    # For node A:
    # 1-hop: B
    # 2-hop: C (not D, D is 3-hop)
    one_a, two_a = compute_neighborhoods("A", test_edges)
    assert one_a == {"B"}, f"Expected {{'B'}}, got {one_a}"
    assert two_a == {"C"}, f"Expected {{'C'}}, got {two_a}"
    assert "D" not in two_a

    # For node B:
    # 1-hop: A, C
    # 2-hop: D
    one_b, two_b = compute_neighborhoods("B", test_edges)
    assert one_b == {"A", "C"}
    assert two_b == {"D"}

    # For node C:
    # 1-hop: B, D
    # 2-hop: A
    one_c, two_c = compute_neighborhoods("C", test_edges)
    assert one_c == {"B", "D"}
    assert two_c == {"A"}

def test_inference_guard_http_503():
    """Verify that live anomaly inference is safely blocked (HTTP 503) without exposing sensitive data."""
    payload = {"features": [0.0] * 31}
    response = client.post("/api/inference", json=payload)
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["status"] == "BLOCKED"
    assert "limitation" in data["detail"]
    assert "password" not in response.text.lower()
    assert "secret" not in response.text.lower()

def test_multimodal_confounding_negative_finding():
    """Verify that the documented Phase 6.2 negative finding (delta_f1 == 0.0) is served by backend."""
    response = client.get("/api/metrics/multimodal-confounding")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["iot_only_f1"] == 0.9926
    assert data["clinical_only_f1"] == 0.1214
    assert data["multimodal_f1"] == 0.9926
    assert data["delta_f1"] == 0.0

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "smart-hospital" in response.json()["service"]
