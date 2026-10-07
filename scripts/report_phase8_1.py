import pandas as pd
import json
import matplotlib.pyplot as plt
import os

def main():
    os.makedirs('results/phase8_1/plots', exist_ok=True)
    
    summary_df = pd.read_csv('results/phase8_1/summary.csv')
    jsd_df = pd.read_csv('results/phase8_1/heterogeneity_metrics.csv')
    
    severities = ['iid', 'mild', 'moderate', 'severe']
    
    # 1. Global F1 vs Round
    plt.figure(figsize=(10, 6))
    for sev in severities:
        df = pd.read_csv(f'results/phase8_1/{sev}/global_metrics.csv')
        plt.plot(df['Round'], df['F1'], marker='o', label=sev.capitalize())
    plt.title('Global F1 vs Federated Round Across Severities')
    plt.xlabel('Round')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_1/plots/convergence_f1.png')
    plt.close()
    
    # 2. Global PR-AUC vs Round
    plt.figure(figsize=(10, 6))
    for sev in severities:
        df = pd.read_csv(f'results/phase8_1/{sev}/global_metrics.csv')
        plt.plot(df['Round'], df['PR-AUC'], marker='s', label=sev.capitalize())
    plt.title('Global PR-AUC vs Federated Round Across Severities')
    plt.xlabel('Round')
    plt.ylabel('PR-AUC Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_1/plots/convergence_pr_auc.png')
    plt.close()
    
    # 3. Non-IID Severity (JSD) -> Global F1 and Worst Client F1
    plt.figure(figsize=(10, 6))
    plt.plot(summary_df['Mean_JSD'], summary_df['Global_F1'], marker='^', label='Global F1')
    plt.plot(summary_df['Mean_JSD'], summary_df['Worst_Client_F1'], marker='v', label='Worst Client F1')
    plt.title('Performance vs Client Heterogeneity (Jensen-Shannon Divergence)')
    plt.xlabel('Mean JSD (Heterogeneity)')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    for i, txt in enumerate(summary_df['Severity']):
        plt.annotate(txt, (summary_df['Mean_JSD'][i], summary_df['Global_F1'][i]), textcoords="offset points", xytext=(0,10), ha='center')
    plt.savefig('results/phase8_1/plots/jsd_vs_f1.png')
    plt.close()
    
    md = "# Phase 8.1: Controlled Non-IID Severity Analysis\n\n"
    md += "## 1. Objective & Experimental Design\n"
    md += "This phase systematically measures the robustness of standard FedAvg under progressively worsening client data heterogeneity. We implemented four controlled data partitions: IID, Mild, Moderate, and Severe, using deterministic hashing to route the canonical IoT graphs while preserving total data limits and keeping model hyperparameters strictly identical (10 rounds, 1 local epoch, EdgeMLP).\n\n"
    
    md += "## 2. Statistical Heterogeneity (Jensen-Shannon Divergence)\n"
    md += "We quantify the skew of each severity level using the Jensen-Shannon Divergence (JSD) between the client attack distributions and the global distribution.\n\n"
    md += "| Severity | Client 1 JSD | Client 2 JSD | Client 3 JSD | Mean JSD |\n"
    md += "|---|---|---|---|---|\n"
    for _, row in jsd_df.iterrows():
        md += f"| {row['Severity']} | {row['Client_1_JSD']:.4f} | {row['Client_2_JSD']:.4f} | {row['Client_3_JSD']:.4f} | {row['Mean_JSD']:.4f} |\n"
    md += "\n"
    
    md += "## 3. Final Summary Table (Performance across Severities)\n"
    md += "| Severity | Mean JSD | Global F1 | Global PR-AUC | Mean Client F1 | Worst Client F1 | Client F1 Std |\n"
    md += "|---|---|---|---|---|---|---|\n"
    for _, row in summary_df.iterrows():
        md += f"| {row['Severity']} | {row['Mean_JSD']:.4f} | {row['Global_F1']:.4f} | {row['Global_PR_AUC']:.4f} | {row['Mean_Client_F1']:.4f} | {row['Worst_Client_F1']:.4f} | {row['Client_F1_Std']:.4f} |\n"
    md += "\n"
    
    iid_f1 = summary_df[summary_df['Severity'] == 'Iid']['Global_F1'].iloc[0]
    sev_f1 = summary_df[summary_df['Severity'] == 'Severe']['Global_F1'].iloc[0]
    iid_worst = summary_df[summary_df['Severity'] == 'Iid']['Worst_Client_F1'].iloc[0]
    sev_worst = summary_df[summary_df['Severity'] == 'Severe']['Worst_Client_F1'].iloc[0]
    
    md += "## 4. Robustness Interpretation\n"
    md += f"- **Global F1 Degradation (IID → Severe)**: {sev_f1 - iid_f1:+.4f}\n"
    md += f"- **Worst-Client F1 Degradation (IID → Severe)**: {sev_worst - iid_worst:+.4f}\n\n"
    
    if abs(sev_f1 - iid_f1) < 0.05 and abs(sev_worst - iid_worst) < 0.05:
        md += "FedAvg demonstrated **high robustness** under the tested heterogeneity range. Both Global F1 and Worst-Client F1 remained remarkably stable despite the severe skewing of local attack distributions. The shared representation proved resilient to local label imbalances over 10 communication rounds.\n\n"
    elif abs(sev_f1 - iid_f1) < 0.05 and abs(sev_worst - iid_worst) >= 0.05:
        md += "FedAvg maintained **high Global F1**, but demonstrated a severe **client-level fairness/utility imbalance**. While the global server metric appeared healthy, the model effectively sacrificed the performance of specialized local clients as heterogeneity increased, masking local catastrophic forgetting.\n\n"
    else:
        md += "FedAvg suffered **significant degradation** as heterogeneity increased. The parameter weight divergence across highly specialized clients caused catastrophic interference during global aggregation, fundamentally destroying the unified global boundary.\n\n"
        
    with open('reports/phase8_1_report.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    with open('reports/phase8_1_report.json', 'w') as f:
        json.dump(summary_df.to_dict(orient='records'), f, indent=4)

if __name__ == "__main__":
    main()
