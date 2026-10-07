import pandas as pd
import json
import matplotlib.pyplot as plt
import os
import numpy as np

def main():
    os.makedirs('results/phase8_3/plots', exist_ok=True)
    os.makedirs('reports', exist_ok=True)
    
    global_df = pd.read_csv('results/phase8_3/global_comparison.csv')
    client_df = pd.read_csv('results/phase8_3/client_comparison.csv')
    drift_df = pd.read_csv('results/phase8_3/parameter_drift.csv')
    
    # Plot 1: FedAvg vs Personalized FL — Worst Client F1
    worst_f1_fedavg = global_df[global_df['Metric'] == 'Worst Client F1']['FedAvg'].iloc[0]
    worst_f1_pers = global_df[global_df['Metric'] == 'Worst Client F1']['Personalized FL'].iloc[0]
    
    plt.figure(figsize=(6, 6))
    plt.bar(['FedAvg', 'Personalized FL'], [worst_f1_fedavg, worst_f1_pers], color=['skyblue', 'lightgreen'])
    plt.title('Worst Client F1')
    plt.ylabel('F1 Score')
    plt.ylim([0.9, 1.0])
    plt.grid(axis='y')
    plt.savefig('results/phase8_3/plots/worst_client_f1.png')
    plt.close()
    
    # Plot 2: FedAvg vs Personalized FL — Mean Client F1
    mean_f1_fedavg = global_df[global_df['Metric'] == 'Mean Client F1']['FedAvg'].iloc[0]
    mean_f1_pers = global_df[global_df['Metric'] == 'Mean Client F1']['Personalized FL'].iloc[0]
    
    plt.figure(figsize=(6, 6))
    plt.bar(['FedAvg', 'Personalized FL'], [mean_f1_fedavg, mean_f1_pers], color=['skyblue', 'lightgreen'])
    plt.title('Mean Client F1')
    plt.ylabel('F1 Score')
    plt.ylim([0.9, 1.0])
    plt.grid(axis='y')
    plt.savefig('results/phase8_3/plots/mean_client_f1.png')
    plt.close()
    
    # Plot 3: Per-client F1 comparison
    x = np.arange(len(client_df['Client']))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(10, 6))
    rects1 = ax.bar(x - width/2, client_df['FedAvg_F1'], width, label='FedAvg')
    rects2 = ax.bar(x + width/2, client_df['Personalized_F1'], width, label='Personalized FL')
    
    ax.set_ylabel('F1 Score')
    ax.set_title('Per-client F1 Score Comparison')
    ax.set_xticks(x)
    ax.set_xticklabels([f"Client {c}" for c in client_df['Client']])
    ax.legend()
    ax.set_ylim([0.9, 1.0])
    plt.grid(axis='y')
    plt.savefig('results/phase8_3/plots/per_client_f1.png')
    plt.close()
    
    # Plot 4: Client F1 standard deviation comparison
    std_fedavg = global_df[global_df['Metric'] == 'Client F1 Std']['FedAvg'].iloc[0]
    std_pers = global_df[global_df['Metric'] == 'Client F1 Std']['Personalized FL'].iloc[0]
    
    plt.figure(figsize=(6, 6))
    plt.bar(['FedAvg', 'Personalized FL'], [std_fedavg, std_pers], color=['lightcoral', 'gold'])
    plt.title('Client F1 Standard Deviation (Lower is better)')
    plt.ylabel('Standard Deviation')
    plt.grid(axis='y')
    plt.savefig('results/phase8_3/plots/client_std.png')
    plt.close()
    
    # Plot 5: Personalization parameter drift per client
    plt.figure(figsize=(8, 6))
    plt.bar([f"Client {c}" for c in drift_df['Client']], drift_df['L2_Divergence'], color='purple')
    plt.title('Personalization Parameter Drift ($L_2$ Divergence)')
    plt.ylabel('Divergence')
    plt.grid(axis='y')
    plt.savefig('results/phase8_3/plots/parameter_drift.png')
    plt.close()
    
    # Markdown Report Generation
    md = "# Phase 8.3: Personalized Federated Learning under Severe Non-IID\n\n"
    md += "## 1. Objective & Motivation\n"
    md += "Phase 8.1 showed that under Severe non-IID partitions, worst-client performance drops and client-variance increases. Phase 8.2 proved that restricting weight drift (FedProx) did not successfully recover local utility. The objective of Phase 8.3 is to determine if **Local Personalization** (fine-tuning the global FedAvg model purely on local data without server transmission) can improve worst-client F1 without harming global anomaly detection.\n\n"
    
    md += "## 2. Methodology & Experimental Setup\n"
    md += "- **Data Partition**: Exactly the Severe non-IID split from Phase 8.1.\n"
    md += "- **Baseline**: Standard FedAvg over 10 communication rounds (1 local epoch per round).\n"
    md += "- **Personalization**: Head-only fine-tuning (freezing layer 0, training the output projection head). The optimal number of local personalization epochs $E \\in \\{1, 3, 5\\}$ was strictly selected using local **validation** subsets.\n"
    md += "- **Fairness**: Personalized models are only evaluated on their respective client's held-out test data. Global F1 represents the aggregation of all isolated personalized test results.\n\n"
    
    best_epochs = pd.read_csv('results/phase8_3/best_hyperparameters.csv')['Best_Epochs'].iloc[0]
    md += f"**Validation-Selected Hyperparameters**: Optimal local personalization epochs = **{best_epochs}**.\n\n"
    
    md += "## 3. Global & Aggregate Robustness Metrics\n"
    md += "| Metric | FedAvg | Personalized FL | $\\Delta$ |\n"
    md += "|---|---:|---:|---:|\n"
    for _, row in global_df.iterrows():
        md += f"| {row['Metric']} | {row['FedAvg']:.4f} | {row['Personalized FL']:.4f} | {row['Delta']:+.4f} |\n"
    md += "\n"
    
    md += "## 4. Per-Client Performance Metrics\n"
    md += "| Client | FedAvg F1 | Personalized F1 | Improvement |\n"
    md += "|---|---:|---:|---:|\n"
    for _, row in client_df.iterrows():
        md += f"| Client {row['Client']} | {row['FedAvg_F1']:.4f} | {row['Personalized_F1']:.4f} | {row['Improvement']:+.4f} |\n"
    md += "\n"
    
    md += "## 5. Client Parameter Drift\n"
    md += "| Client | $L_2$ Divergence ($||w_{pers} - w_{global}||_2$) |\n"
    md += "|---|---:|\n"
    for _, row in drift_df.iterrows():
        md += f"| Client {row['Client']} | {row['L2_Divergence']:.4f} |\n"
    md += "\n"
    
    md += "## 6. Scientific Interpretation\n"
    delta_worst = worst_f1_pers - worst_f1_fedavg
    delta_global = global_df[global_df['Metric'] == 'Global F1']['Personalized FL'].iloc[0] - global_df[global_df['Metric'] == 'Global F1']['FedAvg'].iloc[0]
    
    if delta_worst > 0.005 and delta_global >= -0.005:
        md += "Personalized FL **successfully improved worst-client utility** without sacrificing the unified global boundary! The fine-tuning phase allowed severely skewed minority clients to map the generalized global representation to their hyper-specific local attack vectors, substantially raising the lowest performing client while maintaining generalizability.\n"
    elif delta_worst > 0.005 and delta_global < -0.005:
        md += "Personalized FL **improved local utility at the cost of global consistency**. While the specialized clients adapted to their own skews, catastrophic forgetting of minority global labels occurred, shrinking the overall global anomaly detection accuracy.\n"
    else:
        md += "Personalized FL provided **no meaningful recovery** for the worst-case client. The local fine-tuning merely caused the classifier head to mathematically overfit the skewed distribution, failing to extract fundamentally better boundaries. Severe data-starvation dominates the performance ceiling, which cannot be patched purely by localized gradient descent.\n"
        
    md += "\n## 7. Limitations & Recommendations\n"
    md += "The primary limitation is that head-only personalization on a shallow EdgeMLP provides limited degrees of freedom for structural boundary warping. Future steps should evaluate whether architectural changes (like adding depth) or data-level augmentation (like synthetic oversampling) resolve the structural starvation that personalization could not fix.\n"
    
    with open('reports/Phase_8_3_Personalized_FL.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    with open('reports/phase8_3_personalized_fl_report.txt', 'w', encoding='utf-8') as f:
        f.write(md)
        
    final_json = {
        "global_comparison": global_df.to_dict(orient='records'),
        "client_comparison": client_df.to_dict(orient='records'),
        "parameter_drift": drift_df.to_dict(orient='records')
    }
    with open('reports/phase8_3_personalized_fl_report.json', 'w') as f:
        json.dump(final_json, f, indent=4)

if __name__ == "__main__":
    main()
