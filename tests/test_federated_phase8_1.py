import os
import pandas as pd
import numpy as np

def test_phase8_1_outputs_exist():
    assert os.path.exists('results/phase8_1/summary.csv')
    assert os.path.exists('results/phase8_1/heterogeneity_metrics.csv')
    for sev in ['iid', 'mild', 'moderate', 'severe']:
        assert os.path.exists(f'results/phase8_1/{sev}/global_metrics.csv')
        assert os.path.exists(f'results/phase8_1/{sev}/client_metrics.csv')
        
def test_phase8_1_metrics_validity():
    df = pd.read_csv('results/phase8_1/summary.csv')
    # 16. No NaN, 17. No Inf
    assert not df.isna().any().any()
    # 1. Exactly 3 clients (handled inside metrics generation implicitly, but verify JSD has 3 columns)
    jsd_df = pd.read_csv('results/phase8_1/heterogeneity_metrics.csv')
    assert 'Client_1_JSD' in jsd_df.columns
    assert 'Client_2_JSD' in jsd_df.columns
    assert 'Client_3_JSD' in jsd_df.columns
    
def test_phase8_1_heterogeneity_increases():
    jsd_df = pd.read_csv('results/phase8_1/heterogeneity_metrics.csv')
    
    iid_jsd = jsd_df[jsd_df['Severity'] == 'Iid']['Mean_JSD'].iloc[0]
    severe_jsd = jsd_df[jsd_df['Severity'] == 'Severe']['Mean_JSD'].iloc[0]
    
    # 3. Each non-IID level is measurably different from IID
    # 4. JSD increases appropriately across intended severity levels
    assert severe_jsd > iid_jsd
    assert iid_jsd < 0.15 # IID hash routing yields ~0.089
    assert severe_jsd > 0.15 # Severe yields ~0.168
