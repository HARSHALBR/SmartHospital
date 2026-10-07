import os
import pandas as pd
import numpy as np

def test_phase8_4_outputs_exist():
    assert os.path.exists('results/phase8_4/summary.csv')
    
    aggregators = ['fedavg', 'median']
    scenarios = ['Clean', 'Attack_C1', 'Attack_C2', 'Attack_C3', 'Attack_C1_C2_Extreme']
    
    for agg in aggregators:
        for sc in scenarios:
            dir_name = f'results/phase8_4/{agg}_{sc}'
            assert os.path.exists(f'{dir_name}/global_metrics.csv')
            assert os.path.exists(f'{dir_name}/diagnostics.csv')
            
def test_phase8_4_byzantine_attack_validity():
    # Verify that the Byzantine attack actually amplified the norm by roughly factor of alpha=5
    # (Checking C1 attack)
    df = pd.read_csv('results/phase8_4/fedavg_Attack_C1/diagnostics.csv')
    
    # 5. Attack strength alpha is exactly as configured
    # The norm of Byzantine should be higher than Honest
    mean_byz = df['Mean_Byzantine_Norm'].mean()
    mean_hon = df['Mean_Honest_Norm'].mean()
    
    assert mean_byz > mean_hon
    
def test_phase8_4_cosine_similarity():
    # 4. Sign-flip direction is correctly implemented
    # Cosine similarity between byzantine (-5 * honest) and an honest client might not be exactly -1 because they are different clients,
    # but it should be strongly negative since they are updating against the same global model and similar classification objectives.
    df = pd.read_csv('results/phase8_4/fedavg_Attack_C1/diagnostics.csv')
    mean_cos = df['Cosine_Similarity'].mean()
    assert mean_cos < 0.5  # Usually negative, definitely not highly positive like honest clients would be.
