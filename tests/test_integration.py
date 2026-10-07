import httpx
import time
import sys

def run_tests():
    base_url = "http://127.0.0.1:8000/api"
    
    # Wait for server to start
    for _ in range(5):
        try:
            r = httpx.get(f"{base_url}/health")
            if r.status_code == 200:
                break
        except httpx.ConnectError:
            time.sleep(1)
    else:
        print("Failed to connect to FastAPI server.")
        sys.exit(1)

    # 1. Test /api/health
    health = httpx.get(f"{base_url}/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    print("Health check PASSED")

    # 2. Test /api/metrics/all
    metrics = httpx.get(f"{base_url}/metrics/all")
    assert metrics.status_code == 200
    data = metrics.json()
    assert data["status"] == "verified"
    
    # Check all metric groups
    groups = ["baselines", "multimodal", "cent_vs_fed", "non_iid", "fedprox", "personalization", "byzantine", "dp", "sec_agg", "attack_surface"]
    for g in groups:
        assert g in data["data"], f"Missing group {g}"
        assert data["data"][g] is not None, f"Group {g} is empty"
    print("Metrics endpoint PASSED")

    # 3. Test /api/inference
    features = [0.0] * 31
    inference = httpx.post(f"{base_url}/inference", json={"features": features})
    assert inference.status_code == 503
    assert "blocked" in inference.json()["detail"]["limitation"].lower()
    print("Inference 503 test PASSED")

    print("ALL INTEGRATION TESTS PASSED")

if __name__ == "__main__":
    run_tests()
