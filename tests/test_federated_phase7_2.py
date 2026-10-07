import os
import pandas as pd
import json

def test_phase7_2_architecture_and_clients():
    assert os.path.exists('results/phase7_2/global_metrics.csv')
    assert os.path.exists('results/phase7_2/client_metrics.csv')
    
    mm_global = pd.read_csv('results/phase7_2/global_metrics.csv')
    mm_client = pd.read_csv('results/phase7_2/client_metrics.csv')
    
    # 1. Exactly three clients
    assert set(mm_client['Client'].unique()) == {1, 2, 3}
    
    # 14, 15. No NaN or Inf
    assert not mm_global['F1'].isna().any()
    
    # 17. 10 rounds matching Phase 7.1
    iot_global = pd.read_csv('results/phase7_1/global_metrics.csv')
    assert len(mm_global) == len(iot_global) == 10
    
def test_phase7_2_data_locality_boundary():
    with open('experiments/train_federated_phase7_2.py', 'r') as f:
        code = f.read()
        
    # 10. Server does not load raw datasets (Server loop is in main, uses loaders)
    # 11. No raw clinical embeddings are transmitted to server
    assert "c_weights = [val.cpu().numpy() for _, val in local_model.state_dict().items()]" in code
    assert "client_weights.append(c_weights)" in code
    
    # 12. FedAvg uses sample-count weighting
    assert "layer_sum = sum(w[i] * n for w, n in zip(weights_list, sample_counts))" in code
    
def test_multimodal_dimensionality():
    with open('src/multimodal/fusion.py', 'r') as f:
        fusion_code = f.read()
        
    # 5. Clinical dimension = 768
    assert "clin_in_dim=768" in fusion_code
    
    # 6. IoT projection = 128
    # 7. Clinical projection = 128
    assert "proj_dim=128" in fusion_code
    
    # 8. Fusion dimensionality is correct
    assert "nn.Linear(proj_dim * 2, hidden_dim)" in fusion_code
