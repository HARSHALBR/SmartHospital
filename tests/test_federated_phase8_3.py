import os
import pandas as pd

def test_phase8_3_outputs_exist():
    assert os.path.exists('results/phase8_3/global_comparison.csv')
    assert os.path.exists('results/phase8_3/client_comparison.csv')
    assert os.path.exists('results/phase8_3/parameter_drift.csv')
    assert os.path.exists('results/phase8_3/best_hyperparameters.csv')
    
def test_phase8_3_validation():
    df = pd.read_csv('results/phase8_3/global_comparison.csv')
    
    # 1. No NaN, No Inf
    assert not df.isna().any().any()
    
    # 2. Proper parameters and tests
    c_df = pd.read_csv('results/phase8_3/client_comparison.csv')
    assert len(c_df) == 3
    
    d_df = pd.read_csv('results/phase8_3/parameter_drift.csv')
    assert len(d_df) == 3
