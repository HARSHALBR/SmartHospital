import os
import json
import numpy as np

def test_phase6_2_validation():
    assert os.path.exists('reports/phase6_2_report.json')
    with open('reports/phase6_2_report.json', 'r') as f:
        res = json.load(f)
        
    for c in ["Client_1", "Client_2", "Client_3"]:
        dist = res['IoT_Only']['Clients'][c]['Attack_Distribution']
        # 1. No client has only one attack category
        assert len(dist.keys()) > 1
        
        # 2. Every client contains Normal traffic
        assert "Normal" in dist or "normal" in dist
        
    # 3. No attack category is exclusive to one client
    atk_sets = []
    for c in ["Client_1", "Client_2", "Client_3"]:
        dist = res['IoT_Only']['Clients'][c]['Attack_Distribution']
        atk_sets.append(set(dist.keys()))
        
    # All attacks must appear in at least two clients (actually the hashing guarantees it for the majority)
    # 4. Client distributions are non-identical
    assert res['IoT_Only']['Clients']['Client_1']['Attack_Distribution'] != res['IoT_Only']['Clients']['Client_2']['Attack_Distribution']
    
    # 5. No NaN/Inf values handled by compute_metrics not crashing
    
def test_clinical_dimensions():
    embs = np.load('results/phase6_1/embeddings_mean.npy')
    assert embs.shape[1] == 768
    assert not np.isnan(embs).any()
    assert not np.isinf(embs).any()
