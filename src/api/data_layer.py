import os
import pandas as pd
import json

RESULTS_DIR = "results"
REPORTS_DIR = "reports"

def get_centralized_baselines():
    # Extracted directly from Phase 4.2 / Phase 6.2 frozen results
    return {
        "edge_mlp": 0.9926,
        "graphsage_no_edge": 0.8319, # Note: from prompt instructions 
        "full_graphsage": 0.9705
    }

def get_multimodal_confounding():
    # From Phase 6.2 robustness check
    return {
        "iot_only_f1": 0.9926,
        "clinical_only_f1": 0.1214,
        "multimodal_f1": 0.9926,
        "delta_f1": 0.0000
    }

def get_centralized_vs_federated():
    # Phase 7.3 fair comparison
    return {
        "centralized_iot": 0.9926,
        "federated_iot": 0.9927,
        "centralized_multimodal": 0.9926,
        "federated_multimodal": 0.9926
    }

def get_non_iid_metrics():
    # Phase 8.1
    path = os.path.join(RESULTS_DIR, "phase8_1", "summary.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    records = df.to_dict('records')
    return records

def get_fedprox_metrics():
    # Phase 8.2
    path = os.path.join(RESULTS_DIR, "phase8_2", "mu_comparison.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    return df.to_dict('records')

def get_personalization_metrics():
    # Phase 8.3
    path = os.path.join(RESULTS_DIR, "phase8_3", "client_comparison.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    return df.to_dict('records')

def get_byzantine_metrics():
    # Phase 8.4
    path = os.path.join(RESULTS_DIR, "phase8_4", "summary.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    # Filter to essential presentation metrics
    target_scenarios = ['Clean', 'Attack_C1', 'Attack_C2', 'Attack_C3', 'Attack_C1_C2_Extreme']
    df_filtered = df[df['Scenario'].isin(target_scenarios)]
    return df_filtered.to_dict('records')

def get_dp_metrics():
    # Phase 9.3 (uses Phase 8.5)
    path = os.path.join(RESULTS_DIR, "phase9", "privacy_accounting.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    return df.to_dict('records')

def get_secure_agg_metrics():
    # Phase 9.4
    path = os.path.join(RESULTS_DIR, "phase9", "secure_aggregation_comparison.csv")
    if not os.path.exists(path):
        return {}
    df = pd.read_csv(path)
    return df.iloc[0].to_dict()

def get_attack_surface():
    # Phase 9
    path = os.path.join(RESULTS_DIR, "phase9", "attack_surface_matrix.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    return df.to_dict('records')

def verify_data_layer():
    # Check that all files exist and load correctly
    metrics = {
        "baselines": get_centralized_baselines(),
        "multimodal": get_multimodal_confounding(),
        "cent_vs_fed": get_centralized_vs_federated(),
        "non_iid": get_non_iid_metrics(),
        "fedprox": get_fedprox_metrics(),
        "personalization": get_personalization_metrics(),
        "byzantine": get_byzantine_metrics(),
        "dp": get_dp_metrics(),
        "sec_agg": get_secure_agg_metrics(),
        "attack_surface": get_attack_surface()
    }
    return metrics
