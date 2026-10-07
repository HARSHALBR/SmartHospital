import os
import pandas as pd

def test_phase7_3_outputs_exist():
    assert os.path.exists('results/phase7_3/centralized_iot_metrics.csv')
    assert os.path.exists('results/phase7_3/centralized_multimodal_metrics.csv')
    assert os.path.exists('results/phase7_3/federated_iot_metrics.csv')
    assert os.path.exists('results/phase7_3/federated_multimodal_metrics.csv')
    assert os.path.exists('results/phase7_3/final_comparison.csv')
    assert os.path.exists('results/phase7_3/communication_cost.csv')
    
def test_phase7_3_budgets():
    # 2. Centralized models train for exactly 10 epochs
    ci_df = pd.read_csv('results/phase7_3/centralized_iot_metrics.csv')
    cm_df = pd.read_csv('results/phase7_3/centralized_multimodal_metrics.csv')
    assert len(ci_df) == 10
    assert len(cm_df) == 10
    
    # 3. Federated models use exactly 10 rounds
    fi_df = pd.read_csv('results/phase7_3/federated_iot_metrics.csv')
    fm_df = pd.read_csv('results/phase7_3/federated_multimodal_metrics.csv')
    assert len(fi_df) == 10
    assert len(fm_df) == 10
    
def test_phase7_3_metrics_validity():
    # 10. No NaN, 11. No Inf
    df = pd.read_csv('results/phase7_3/final_comparison.csv')
    assert not df['F1'].isna().any()
    
def test_phase7_3_communication_cost():
    # 17. Communication calculation matches model parameter count
    comm_df = pd.read_csv('results/phase7_3/communication_cost.csv')
    # IoT should be ~4225 params
    iot_params = comm_df[comm_df['Model'] == 'Federated_IoT']['Trainable_Parameters'].iloc[0]
    assert 4000 < iot_params < 5000
    
    # Multimodal should be ~135k params
    mm_params = comm_df[comm_df['Model'] == 'Federated_Multimodal']['Trainable_Parameters'].iloc[0]
    assert 130000 < mm_params < 140000
