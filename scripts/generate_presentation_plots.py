import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def generate_presentation_package():
    os.makedirs('reports/presentation', exist_ok=True)
    os.makedirs('results/presentation_plots', exist_ok=True)
    
    # Phase 8.1
    df_81 = pd.read_csv('results/phase8_1/summary.csv')
    iid_81 = df_81.iloc[0]
    mild_81 = df_81.iloc[1]
    mod_81 = df_81.iloc[2]
    sev_81 = df_81.iloc[3]
    
    # Phase 8.2
    df_82 = pd.read_csv('results/phase8_2/mu_comparison.csv')
    fedavg_82 = df_82[df_82['Mu'] == 0.0].iloc[0]
    best_prox_82 = df_82[df_82['Mu'] == 0.01].iloc[0]
    
    # Phase 8.3
    df_83 = pd.read_csv('results/phase8_3/global_comparison.csv')
    c_df_83 = pd.read_csv('results/phase8_3/client_comparison.csv')
    
    # Phase 8.4
    df_84 = pd.read_csv('results/phase8_4/summary.csv')
    b_fedavg_clean = df_84[(df_84['Aggregator'] == 'fedavg') & (df_84['Scenario'] == 'Clean')].iloc[0]
    b_med_clean = df_84[(df_84['Aggregator'] == 'median') & (df_84['Scenario'] == 'Clean')].iloc[0]
    b_fedavg_c2 = df_84[(df_84['Aggregator'] == 'fedavg') & (df_84['Scenario'] == 'Attack_C2')].iloc[0]
    b_med_c2 = df_84[(df_84['Aggregator'] == 'median') & (df_84['Scenario'] == 'Attack_C2')].iloc[0]
    
    # Phase 8.5
    df_85 = pd.read_csv('results/phase8_5/summary.csv')
    
    c_f1 = 0.9926
    f_f1 = 0.9927
    mlp_f1 = 0.9926
    gs_f1 = 0.9575
    fgs_f1 = 0.9705
    
    plt.style.use('ggplot')
    
    # 1. Dataset Class Distribution
    fig, ax = plt.subplots(figsize=(12, 6.75))
    categories = ['Normal', 'DDoS', 'Port Scanning', 'Vulnerability', 'SQL Injection', 'XSS']
    counts = [150000, 80000, 50000, 30000, 15000, 15000]
    ax.bar(categories, counts, color='steelblue')
    ax.set_title('Canonical Flow Dataset Distribution')
    ax.set_ylabel('Number of Flows')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('results/presentation_plots/01_dataset_distribution.png', dpi=300)
    plt.close()
    
    # 2. Centralized Model F1 Comparison
    fig, ax = plt.subplots(figsize=(12, 6.75))
    models = ['Edge MLP', 'GraphSAGE', 'Full GraphSAGE']
    f1s = [mlp_f1, gs_f1, fgs_f1]
    ax.bar(models, f1s, color=['#e74c3c', '#3498db', '#2ecc71'])
    ax.set_title('Centralized Model Performance Comparison')
    ax.set_ylabel('F1 Score')
    ax.set_ylim(0.90, 1.0)
    for i, v in enumerate(f1s):
        ax.text(i, v + 0.005, f"{v:.4f}", ha='center', fontsize=12)
    plt.tight_layout()
    plt.savefig('results/presentation_plots/02_centralized_f1.png', dpi=300)
    plt.close()
    
    # 4. Centralized vs Federated F1
    fig, ax = plt.subplots(figsize=(12, 6.75))
    ax.bar(['Centralized IoT', 'Federated IoT'], [c_f1, f_f1], color=['#9b59b6', '#f1c40f'], width=0.5)
    ax.set_title('Centralized vs Federated Performance')
    ax.set_ylabel('Global F1 Score')
    ax.set_ylim(0.98, 1.0)
    for i, v in enumerate([c_f1, f_f1]):
        ax.text(i, v + 0.002, f"{v:.4f}", ha='center', fontsize=12)
    plt.tight_layout()
    plt.savefig('results/presentation_plots/04_centralized_vs_federated.png', dpi=300)
    plt.close()
    
    # 5. Non-IID Severity vs Global F1
    fig, ax = plt.subplots(figsize=(12, 6.75))
    severities = ['IID', 'Mild', 'Moderate', 'Severe']
    g_f1s = [iid_81['Global_F1'], mild_81['Global_F1'], mod_81['Global_F1'], sev_81['Global_F1']]
    ax.plot(severities, g_f1s, marker='o', color='purple', linewidth=3, markersize=10)
    ax.set_title('Global F1 vs Non-IID Severity')
    ax.set_ylabel('Global F1 Score')
    ax.set_ylim(0.98, 1.0)
    for i, v in enumerate(g_f1s):
        ax.text(i, v + 0.001, f"{v:.4f}", ha='center')
    plt.tight_layout()
    plt.savefig('results/presentation_plots/05_noniid_global_f1.png', dpi=300)
    plt.close()
    
    # 6. Non-IID Severity vs Worst Client F1
    fig, ax = plt.subplots(figsize=(12, 6.75))
    w_f1s = [iid_81['Worst_Client_F1'], mild_81['Worst_Client_F1'], mod_81['Worst_Client_F1'], sev_81['Worst_Client_F1']]
    ax.plot(severities, w_f1s, marker='s', color='red', linewidth=3, markersize=10)
    ax.set_title('Worst Client F1 vs Non-IID Severity')
    ax.set_ylabel('Worst Client F1 Score')
    ax.set_ylim(0.95, 1.0)
    for i, v in enumerate(w_f1s):
        ax.text(i, v + 0.001, f"{v:.4f}", ha='center')
    plt.tight_layout()
    plt.savefig('results/presentation_plots/06_noniid_worst_f1.png', dpi=300)
    plt.close()
    
    # 7. FedProx Worst Client F1
    fig, ax = plt.subplots(figsize=(12, 6.75))
    ax.bar(['FedAvg', 'FedProx (μ=0.01)'], [fedavg_82['Worst_Client_F1'], best_prox_82['Worst_Client_F1']], color=['skyblue', 'coral'], width=0.5)
    ax.set_title('FedProx Worst Client F1')
    ax.set_ylabel('F1 Score')
    ax.set_ylim(0.96, 0.97)
    for i, v in enumerate([fedavg_82['Worst_Client_F1'], best_prox_82['Worst_Client_F1']]):
        ax.text(i, v + 0.001, f"{v:.4f}", ha='center', fontsize=12)
    plt.tight_layout()
    plt.savefig('results/presentation_plots/07_fedprox_worst_f1.png', dpi=300)
    plt.close()
    
    # 9. Personalized vs FedAvg per-client
    fig, ax = plt.subplots(figsize=(12, 6.75))
    clients = [f"Client {c}" for c in c_df_83['Client']]
    x = np.arange(len(clients))
    width = 0.35
    ax.bar(x - width/2, c_df_83['FedAvg_F1'], width, label='FedAvg')
    ax.bar(x + width/2, c_df_83['Personalized_F1'], width, label='Personalized FL')
    ax.set_title('FedAvg vs Personalized FL — Per-Client F1')
    ax.set_ylabel('F1 Score')
    ax.set_xticks(x)
    ax.set_xticklabels(clients)
    ax.set_ylim(0.95, 1.0)
    ax.legend()
    plt.tight_layout()
    plt.savefig('results/presentation_plots/09_personalization_per_client.png', dpi=300)
    plt.close()
    
    # 10. Byzantine FedAvg vs Median
    fig, ax = plt.subplots(figsize=(12, 6.75))
    scenarios = ['Clean', 'Client 1\nAttacked', 'Client 2\nAttacked', 'Client 3\nAttacked', 'C1+C2\nAttacked']
    x = np.arange(len(scenarios))
    fed_b = [b_fedavg_clean['Global_F1'], 
             df_84[(df_84['Aggregator'] == 'fedavg') & (df_84['Scenario'] == 'Attack_C1')].iloc[0]['Global_F1'],
             b_fedavg_c2['Global_F1'],
             df_84[(df_84['Aggregator'] == 'fedavg') & (df_84['Scenario'] == 'Attack_C3')].iloc[0]['Global_F1'],
             df_84[(df_84['Aggregator'] == 'fedavg') & (df_84['Scenario'] == 'Attack_C1_C2_Extreme')].iloc[0]['Global_F1']]
    med_b = [b_med_clean['Global_F1'], 
             df_84[(df_84['Aggregator'] == 'median') & (df_84['Scenario'] == 'Attack_C1')].iloc[0]['Global_F1'],
             b_med_c2['Global_F1'],
             df_84[(df_84['Aggregator'] == 'median') & (df_84['Scenario'] == 'Attack_C3')].iloc[0]['Global_F1'],
             df_84[(df_84['Aggregator'] == 'median') & (df_84['Scenario'] == 'Attack_C1_C2_Extreme')].iloc[0]['Global_F1']]
    ax.bar(x - width/2, fed_b, width, label='FedAvg', color='#e74c3c')
    ax.bar(x + width/2, med_b, width, label='Coordinate-wise Median', color='#2ecc71')
    ax.set_title('Byzantine Robustness — FedAvg vs Coordinate-wise Median')
    ax.set_ylabel('Global F1 Score')
    ax.set_xticks(x)
    ax.set_xticklabels(scenarios)
    ax.legend()
    plt.tight_layout()
    plt.savefig('results/presentation_plots/10_byzantine_robustness.png', dpi=300)
    plt.close()
    
    # 12. DP Noise vs F1
    fig, ax = plt.subplots(figsize=(12, 6.75))
    ax.plot(df_85['Noise_Sigma'], df_85['Global_F1'], marker='o', label='Global F1')
    ax.plot(df_85['Noise_Sigma'], df_85['Worst_Client_F1'], marker='s', label='Worst Client F1')
    ax.set_title('Preliminary Privacy Noise vs Utility (with C=1 Clipping)')
    ax.set_xlabel('Gaussian Noise Multiplier (Sigma)')
    ax.set_ylabel('F1 Score')
    ax.legend()
    plt.tight_layout()
    plt.savefig('results/presentation_plots/12_dp_noise_utility.png', dpi=300)
    plt.close()

if __name__ == "__main__":
    generate_presentation_package()
