import os
import json
import torch
import numpy as np

def test_phase6_1_client_stats():
    # Verify no empty clients
    assert os.path.exists('results/phase6_1/client_stats.json')
    with open('results/phase6_1/client_stats.json', 'r') as f:
        stats = json.load(f)
    for c, s in stats.items():
        assert s['Notes'] > 0
        
def test_phase6_1_embeddings():
    assert os.path.exists('results/phase6_1/embeddings_mean.npy')
    embs = np.load('results/phase6_1/embeddings_mean.npy')
    assert embs.shape[1] == 768
    assert not np.isnan(embs).any()
    assert not np.isinf(embs).any()
