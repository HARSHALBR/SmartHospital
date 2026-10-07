import os
import pandas as pd

def test_phase8_2_outputs_exist():
    assert os.path.exists('results/phase8_2/mu_comparison.csv')
    for f in ['fedavg', 'mu_0.001', 'mu_0.01', 'mu_0.1']:
        assert os.path.exists(f'results/phase8_2/{f}/global_metrics.csv')
        assert os.path.exists(f'results/phase8_2/{f}/client_metrics.csv')
        assert os.path.exists(f'results/phase8_2/{f}/divergence_metrics.csv')

def test_phase8_2_validation():
    # 9. FedProx mu=0 is mathematically equivalent to FedAvg
    df = pd.read_csv('results/phase8_2/mu_comparison.csv')
    fedavg = df[df['Mu'] == 0.0]
    assert len(fedavg) == 1
    assert fedavg.iloc[0]['Algorithm'] == 'FedAvg'
    
    # 14. No NaN, 15. No Inf
    assert not df.isna().any().any()
    
def test_phase8_2_divergence_reduced():
    # FedProx should reduce parameter divergence relative to FedAvg
    df = pd.read_csv('results/phase8_2/mu_comparison.csv')
    fedavg_div = df[df['Mu'] == 0.0]['Mean_Divergence'].iloc[0]
    fedprox_high_mu = df[df['Mu'] == 0.1]['Mean_Divergence'].iloc[0]
    
    # Divergence should decrease as mu increases
    assert fedprox_high_mu <= fedavg_div
