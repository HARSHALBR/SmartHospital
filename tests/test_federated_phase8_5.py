import os
import pandas as pd

def test_phase8_5_outputs_exist():
    assert os.path.exists('results/phase8_5/summary.csv')
    
def test_phase8_5_dp_mechanics():
    df = pd.read_csv('results/phase8_5/summary.csv')
    
    # 1. sigma=0 produces no noise
    sigma_0 = df[df['Noise_Sigma'] == 0.0].iloc[0]
    assert sigma_0['Avg_Noise_Norm'] == 0.0
    
    # 2. Avg clipped norm <= 1.0
    # Because clipping factor is exactly 1.0, the average clipped norm must be <= 1.0 (some rounding float errors may apply so use 1.01)
    assert (df['Avg_Clipped_Norm'] <= 1.01).all()
    
    # 3. Higher sigma produces higher noise norm
    sigma_high = df[df['Noise_Sigma'] == 0.5].iloc[0]
    assert sigma_high['Avg_Noise_Norm'] > 0.0
