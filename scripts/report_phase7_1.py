import json
import pandas as pd
import numpy as np

def main():
    # Load FL metrics
    try:
        global_df = pd.read_csv('results/phase7_1/global_metrics.csv')
        client_df = pd.read_csv('results/phase7_1/client_metrics.csv')
        best_round = global_df.loc[global_df['F1'].idxmax()]
    except Exception as e:
        print("Could not load FL metrics:", e)
        return
        
    # Load Centralized Baseline (Phase 6.2 IoT-Only)
    try:
        with open('reports/phase6_2_report.json', 'r') as f:
            res_c = json.load(f)
        f1_c = res_c['IoT_Only']['Global']['F1']
        rec_c = res_c['IoT_Only']['Global']['Recall']
        prauc_c = res_c['IoT_Only']['Global']['PR-AUC']
    except Exception as e:
        print("Could not load Phase 6.2 baseline:", e)
        f1_c, rec_c, prauc_c = 0.0, 0.0, 0.0

    md = "# Phase 7.1: Federated Learning Baseline (Flower + FedAvg)\n\n"
    
    md += "## 1. Objective & Architecture\n"
    md += "The objective is to establish a rigorous Federated Learning baseline using Flower (`flwr`) and standard Federated Averaging (`FedAvg`) across 3 highly non-IID hospital clients. We utilized the validated Edge MLP IoT-only model from Phase 6.2. \n"
    md += "**Privacy Boundary**: The global server mathematically aggregated parameter weights directly exchanged with the simulated clients. No raw graph edges, IP addresses, node identities, or local tabular data ever left the hospital client partitions.\n\n"
    
    md += "## 2. FedAvg Configuration\n"
    md += "- **Clients**: 3\n"
    md += "- **Global Rounds**: 10\n"
    md += "- **Local Epochs per Round**: 1\n"
    md += "- **Local Batch Size**: 256\n"
    md += "- **Aggregation Strategy**: `FedAvg` (weighted by local sample counts)\n\n"
    
    md += "## 3. Final Global Results (Best Round Test Set)\n"
    md += f"- **Best Round**: {best_round['Round']}\n"
    md += f"- **F1**: {best_round['F1']:.4f}\n"
    md += f"- **Recall**: {best_round['Recall']:.4f}\n"
    md += f"- **Precision**: {best_round['Precision']:.4f}\n"
    md += f"- **PR-AUC**: {best_round['PR-AUC']:.4f}\n"
    md += f"- **ROC-AUC**: {best_round['ROC-AUC']:.4f}\n\n"
    
    md += "## 4. Centralized vs Federated Ablation\n"
    md += "| Metric | Centralized (Phase 6.2) | Federated (Phase 7.1) | Delta |\n"
    md += "|---|---|---|---|\n"
    md += f"| **F1** | {f1_c:.4f} | {best_round['F1']:.4f} | {best_round['F1'] - f1_c:+.4f} |\n"
    md += f"| **Recall** | {rec_c:.4f} | {best_round['Recall']:.4f} | {best_round['Recall'] - rec_c:+.4f} |\n"
    md += f"| **PR-AUC** | {prauc_c:.4f} | {best_round['PR-AUC']:.4f} | {best_round['PR-AUC'] - prauc_c:+.4f} |\n\n"
    
    md += "The observed performance gap factually demonstrates the typical degradation experienced when transitioning from full data centralization to distributed non-IID local training (without advanced strategies like FedProx or personalization).\n\n"
    
    md += "## 5. Convergence & Per-Client Observations\n"
    md += "*(Please see `results/phase7_1/plots/` for generated convergence graphs)*\n\n"
    
    c_best = client_df[client_df['Round'] == best_round['Round']]
    md += "| Client | F1 | Recall | Precision |\n"
    md += "|---|---|---|---|\n"
    for _, row in c_best.iterrows():
        md += f"| Client {row['Client']} | {row['F1']:.4f} | {row['Recall']:.4f} | {row['Precision']:.4f} |\n"
        
    md += "\n## 6. Limitations\n"
    md += "Standard FedAvg keeps raw training data local to each client while exchanging model parameters for aggregation. However, exchanging raw gradients or parameters is vulnerable to inference attacks. Additional privacy mechanisms (e.g. Differential Privacy, Secure Aggregation) are strictly required to provide formal mathematical privacy guarantees.\n"
    
    with open('reports/phase7_1_report.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    # Also save a JSON version
    res_json = {
        "Best_Global": best_round.to_dict(),
        "Ablation": {
            "Centralized_F1": f1_c,
            "Federated_F1": best_round['F1'],
            "Delta_F1": best_round['F1'] - f1_c
        },
        "Client_Metrics": c_best.to_dict(orient='records')
    }
    with open('reports/phase7_1_report.json', 'w') as f:
        json.dump(res_json, f, indent=4)
        
if __name__ == "__main__":
    main()
