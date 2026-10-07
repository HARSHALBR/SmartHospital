import pytest
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(project_root, 'src'))
from api.data_layer import verify_data_layer

def test_data_layer_completeness():
    metrics = verify_data_layer()
    
    # 1. Check all keys exist
    expected_keys = [
        "baselines", "multimodal", "cent_vs_fed", "non_iid", "fedprox",
        "personalization", "byzantine", "dp", "sec_agg", "attack_surface"
    ]
    for key in expected_keys:
        assert key in metrics, f"Missing key: {key}"
        
    # 2. Verify Data loaded from CSVs
    assert len(metrics["non_iid"]) > 0, "Phase 8.1 Non-IID metrics failed to load"
    assert len(metrics["fedprox"]) > 0, "Phase 8.2 FedProx metrics failed to load"
    assert len(metrics["personalization"]) > 0, "Phase 8.3 Personalization metrics failed to load"
    assert len(metrics["byzantine"]) > 0, "Phase 8.4 Byzantine metrics failed to load"
    assert len(metrics["dp"]) > 0, "Phase 9 DP metrics failed to load"
    assert len(metrics["attack_surface"]) > 0, "Phase 9 Attack Surface failed to load"
    
    print("All Phase 1-9 metrics successfully verified and loaded from frozen CSV artifacts.")
    
if __name__ == "__main__":
    test_data_layer_completeness()
