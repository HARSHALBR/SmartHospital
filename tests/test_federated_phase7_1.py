import os
import pandas as pd
import ast

def test_fl_output_files():
    assert os.path.exists('results/phase7_1/global_metrics.csv')
    assert os.path.exists('results/phase7_1/client_metrics.csv')
    assert os.path.exists('reports/phase7_1_report.md')
    assert os.path.exists('reports/phase7_1_report.json')
    
def test_fl_metrics():
    global_df = pd.read_csv('results/phase7_1/global_metrics.csv')
    # 1. 10 federated rounds
    assert len(global_df) == 10
    
    # 2. No NaN values in F1
    assert not global_df['F1'].isna().any()
    
    client_df = pd.read_csv('results/phase7_1/client_metrics.csv')
    # 3. Exactly 3 clients participate
    assert set(client_df['Client'].unique()) == {1, 2, 3}
    
    # 4. 10 rounds per client = 30 rows
    assert len(client_df) == 30
    
def test_privacy_boundary_code():
    # 5. Server code does not load raw client datasets
    with open('experiments/train_federated_phase7_1.py', 'r') as f:
        code = f.read()
    
    # Verify no clinical embeddings are loaded
    assert "embeddings_mean.npy" not in code
    
    # Verify the architecture is strict
    assert "EdgeMLP" in code
    assert "edge_dim=31" in code
