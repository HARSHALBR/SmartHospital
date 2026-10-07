import pandas as pd
import json
import matplotlib.pyplot as plt
import os

def main():
    os.makedirs('results/phase7_3/plots', exist_ok=True)
    
    final_df = pd.read_csv('results/phase7_3/final_comparison.csv')
    client_df = pd.read_csv('results/phase7_3/client_comparison.csv')
    comm_df = pd.read_csv('results/phase7_3/communication_cost.csv')
    time_df = pd.read_csv('results/phase7_3/training_time.csv')
    
    ci_df = pd.read_csv('results/phase7_3/centralized_iot_metrics.csv')
    cm_df = pd.read_csv('results/phase7_3/centralized_multimodal_metrics.csv')
    fi_df = pd.read_csv('results/phase7_3/federated_iot_metrics.csv')
    fm_df = pd.read_csv('results/phase7_3/federated_multimodal_metrics.csv')
    
    plt.figure(figsize=(10, 6))
    plt.plot(ci_df['Round'], ci_df['F1'], marker='o', label='Centralized IoT')
    plt.plot(cm_df['Round'], cm_df['F1'], marker='s', label='Centralized Multimodal')
    plt.plot(fi_df['Round'], fi_df['F1'], marker='^', label='Federated IoT')
    plt.plot(fm_df['Round'], fm_df['F1'], marker='x', label='Federated Multimodal')
    plt.title('Global F1 vs Epoch/Round')
    plt.xlabel('Epoch / Round')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase7_3/plots/convergence_f1.png')
    plt.close()
    
    plt.figure(figsize=(10, 6))
    plt.plot(ci_df['Round'], ci_df['PR-AUC'], marker='o', label='Centralized IoT')
    plt.plot(cm_df['Round'], cm_df['PR-AUC'], marker='s', label='Centralized Multimodal')
    plt.plot(fi_df['Round'], fi_df['PR-AUC'], marker='^', label='Federated IoT')
    plt.plot(fm_df['Round'], fm_df['PR-AUC'], marker='x', label='Federated Multimodal')
    plt.title('Global PR-AUC vs Epoch/Round')
    plt.xlabel('Epoch / Round')
    plt.ylabel('PR-AUC Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase7_3/plots/convergence_pr_auc.png')
    plt.close()
    
    md = "# Phase 7.3: Fair Centralized vs Federated Evaluation\n\n"
    md += "## 1. Objective & Experimental Design\n"
    md += "The objective is to establish a mathematically fair comparison between Centralized and Federated (FedAvg) training under strictly identical optimization budgets (10 global rounds/epochs). The non-IID Phase 6.2 hospital-client data partitions and validated static Bio_ClinicalBERT representations were preserved.\n\n"
    
    md += "## 2. Centralized vs Federated Comparison\n"
    md += "| Model | F1 | Precision | Recall | PR-AUC | ROC-AUC |\n"
    md += "|---|---|---|---|---|---|\n"
    for _, row in final_df.iterrows():
        md += f"| {row['Model']} | {row['F1']:.4f} | {row['Precision']:.4f} | {row['Recall']:.4f} | {row['PR-AUC']:.4f} | {row['ROC-AUC']:.4f} |\n"
    md += "\n"
    
    c_iot = final_df[final_df['Model'] == 'Centralized_IoT'].iloc[0]
    f_iot = final_df[final_df['Model'] == 'Federated_IoT'].iloc[0]
    c_mm = final_df[final_df['Model'] == 'Centralized_Multimodal'].iloc[0]
    f_mm = final_df[final_df['Model'] == 'Federated_Multimodal'].iloc[0]
    
    md += "### Accuracy Trade-off Analysis\n"
    md += f"- **Federated IoT vs Centralized IoT F1 $\\Delta$**: {f_iot['F1'] - c_iot['F1']:+.4f}\n"
    md += f"- **Federated Multimodal vs Centralized Multimodal F1 $\\Delta$**: {f_mm['F1'] - c_mm['F1']:+.4f}\n\n"
    
    if abs(f_iot['F1'] - c_iot['F1']) < 0.01:
        md += "The Federated models achieved near-parity with the Centralized models. The mathematical aggregation of FedAvg successfully modeled the global packet anomaly distribution without requiring direct access to the raw datasets, demonstrating an incredibly efficient optimization path for this non-IID IoT data.\n\n"
    else:
        md += "The Federated models suffered a measurable degradation in F1 compared to the Centralized models, illustrating the classic weight-divergence penalty introduced by local training on highly skewed, non-IID attack vectors.\n\n"
        
    md += "### Multimodal vs IoT-only Comparison\n"
    md += f"- **Centralized Multimodal vs IoT F1 $\\Delta$**: {c_mm['F1'] - c_iot['F1']:+.4f}\n"
    md += f"- **Federated Multimodal vs IoT F1 $\\Delta$**: {f_mm['F1'] - f_iot['F1']:+.4f}\n\n"
    md += "Consistent with Phase 6.2, after the removal of the deterministic clinical-specialty/attack-type confounding shortcut, the clinical embeddings do not provide a causal or consistent packet-level anomaly indicator. They function as static parameter biases.\n\n"
    
    md += "## 3. Communication & Computational Overhead\n"
    md += "### Communication Cost (FedAvg, 10 Rounds, 3 Clients)\n"
    md += "| Model | Trainable Parameters | Parameter Size (MB) | Server to Client (MB) | Client to Server (MB) | Total Communication (MB) |\n"
    md += "|---|---|---|---|---|---|\n"
    for _, row in comm_df.iterrows():
        md += f"| {row['Model']} | {row['Trainable_Parameters']} | {row['Parameter_Size_MB']:.4f} | {row['Server_to_Client_MB']:.4f} | {row['Client_to_Server_MB']:.4f} | {row['Total_Communication_MB']:.4f} |\n"
    md += "\n"
    
    md += "### Computational Cost (CPU Wall-clock Time)\n"
    md += "| Model | Training Time (Seconds) |\n"
    md += "|---|---|\n"
    for _, row in time_df.iterrows():
        md += f"| {row['Model']} | {row['Training_Time_Seconds']:.2f} |\n"
    md += "\n"
    
    md += "## 4. Privacy & Data Locality Boundary\n"
    md += "In the Centralized experiments, raw Edge-IIoTset edge features and labels were artificially pooled into a single memory buffer. In the Federated experiments, all raw datasets remained isolated. The server only calculated $w = \\sum \\frac{n_k}{n} w_k$. **Crucial Limitation**: Standard FedAvg provides data locality but does **NOT** provide formal differential privacy. Weight updates remain vulnerable to inference attacks without secure aggregation mechanisms.\n"
    
    with open('reports/phase7_3_report.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    with open('reports/phase7_3_report.json', 'w') as f:
        json.dump(final_df.to_dict(orient='records'), f, indent=4)

if __name__ == "__main__":
    main()
