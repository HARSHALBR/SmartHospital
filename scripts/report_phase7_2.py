import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os

def main():
    os.makedirs('results/phase7_2/plots', exist_ok=True)
    
    try:
        mm_global = pd.read_csv('results/phase7_2/global_metrics.csv')
        mm_client = pd.read_csv('results/phase7_2/client_metrics.csv')
        best_round_mm = mm_global.loc[mm_global['F1'].idxmax()]
    except Exception as e:
        print("Could not load Phase 7.2 Multimodal metrics:", e)
        return
        
    try:
        iot_global = pd.read_csv('results/phase7_1/global_metrics.csv')
        best_round_iot = iot_global.loc[iot_global['F1'].idxmax()]
    except Exception as e:
        print("Could not load Phase 7.1 IoT-only metrics:", e)
        return
        
    # Comparative Plots
    plt.figure(figsize=(10, 6))
    plt.plot(iot_global['Round'], iot_global['F1'], marker='o', label='IoT-only FedAvg (Phase 7.1)')
    plt.plot(mm_global['Round'], mm_global['F1'], marker='x', label='Multimodal FedAvg (Phase 7.2)')
    plt.title('Global F1 vs Federated Round (IoT-only vs Multimodal)')
    plt.xlabel('Round')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase7_2/plots/comparative_f1.png')
    plt.close()
    
    plt.figure(figsize=(10, 6))
    plt.plot(iot_global['Round'], iot_global['PR-AUC'], marker='o', label='IoT-only FedAvg (Phase 7.1)')
    plt.plot(mm_global['Round'], mm_global['PR-AUC'], marker='x', label='Multimodal FedAvg (Phase 7.2)')
    plt.title('Global PR-AUC vs Federated Round (IoT-only vs Multimodal)')
    plt.xlabel('Round')
    plt.ylabel('PR-AUC Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase7_2/plots/comparative_prauc.png')
    plt.close()

    md = "# Phase 7.2: Federated Multimodal Learning (FedAvg)\n\n"
    
    md += "## 1. Objective & Architecture\n"
    md += "The objective is to extend the IoT-only FedAvg baseline to full Multimodal (IoT + Clinical) FedAvg, preserving the 3 non-IID clients without allowing clinical representations or graph features to be centralized. We used the Phase 6.2 multimodal architecture: mapping the 31-dimensional IoT features and 768-dimensional Bio_ClinicalBERT vectors through separate 128-dimensional projection heads, then concatenating them before final anomaly prediction.\n\n"
    
    md += "## 2. FedAvg Configuration\n"
    md += "- **Clients**: 3\n"
    md += "- **Global Rounds**: 10\n"
    md += "- **Local Epochs per Round**: 1\n"
    md += "- **Local Batch Size**: 256\n"
    md += "- **Aggregation Strategy**: `FedAvg` (weighted by local sample counts)\n\n"
    
    md += "## 3. Client Distributions & Data-Locality Boundary\n"
    md += "Data mapping (Phase 6.2 identical assignment):\n"
    md += "- **Client 1** (Surgery): ~64% Attack (mostly DDoS_ICMP/TCP).\n"
    md += "- **Client 2** (Consult / Cardiovascular): ~51% Attack (mostly Port_Scanning, Password, Backdoor).\n"
    md += "- **Client 3** (Psychiatry / Misc): ~99% Attack (mostly Injection, XSS).\n\n"
    md += "**Privacy Boundary**: The server mathematically aggregates local model weight updates. No IoT features, flow metadata, timestamps, IP addresses, clinical notes, or Bio_ClinicalBERT embeddings were centralized.\n\n"
    
    md += "## 4. Final Global Results (Best Round Test Set)\n"
    md += f"- **Best Round**: {best_round_mm['Round']}\n"
    md += f"- **F1**: {best_round_mm['F1']:.4f}\n"
    md += f"- **Recall**: {best_round_mm['Recall']:.4f}\n"
    md += f"- **Precision**: {best_round_mm['Precision']:.4f}\n"
    md += f"- **PR-AUC**: {best_round_mm['PR-AUC']:.4f}\n"
    md += f"- **ROC-AUC**: {best_round_mm['ROC-AUC']:.4f}\n\n"
    
    md += "## 5. IoT-Only (Phase 7.1) vs Multimodal (Phase 7.2) Comparison\n"
    md += "Both phases strictly used 10 rounds, 1 local epoch/round, and learning rate 1e-3.\n\n"
    
    md += "| Metric | Phase 7.1 (IoT-Only) | Phase 7.2 (Multimodal) | Delta |\n"
    md += "|---|---|---|---|\n"
    md += f"| **F1** | {best_round_iot['F1']:.4f} | {best_round_mm['F1']:.4f} | {best_round_mm['F1'] - best_round_iot['F1']:+.4f} |\n"
    md += f"| **Recall** | {best_round_iot['Recall']:.4f} | {best_round_mm['Recall']:.4f} | {best_round_mm['Recall'] - best_round_iot['Recall']:+.4f} |\n"
    md += f"| **Precision** | {best_round_iot['Precision']:.4f} | {best_round_mm['Precision']:.4f} | {best_round_mm['Precision'] - best_round_iot['Precision']:+.4f} |\n"
    md += f"| **PR-AUC** | {best_round_iot['PR-AUC']:.4f} | {best_round_mm['PR-AUC']:.4f} | {best_round_mm['PR-AUC'] - best_round_iot['PR-AUC']:+.4f} |\n"
    md += f"| **ROC-AUC** | {best_round_iot['ROC-AUC']:.4f} | {best_round_mm['ROC-AUC']:.4f} | {best_round_mm['ROC-AUC'] - best_round_iot['ROC-AUC']:+.4f} |\n\n"
    
    md += "### Interpretation:\n"
    if (best_round_mm['F1'] - best_round_iot['F1']) > 0.005:
        md += "The inclusion of clinical embeddings demonstrated a measurable improvement over the IoT-only baseline. However, this must not be interpreted as a causal packet-level anomaly indicator, as established in the Phase 6.2 confounding checks.\n\n"
    else:
        md += "The inclusion of clinical embeddings did **not** meaningfully improve packet-level anomaly detection under the deconfounded non-IID federated setting. The static clinical embeddings functionally acted as uniform client-level biases rather than dynamic threat signals, matching the theoretical limitations discovered during Phase 6.2.\n\n"
        
    md += "## 6. Per-Client Observations (Phase 7.2 Best Round)\n"
    c_best = mm_client[mm_client['Round'] == best_round_mm['Round']]
    md += "| Client | F1 | Recall | Precision |\n"
    md += "|---|---|---|---|\n"
    for _, row in c_best.iterrows():
        md += f"| Client {row['Client']} | {row['F1']:.4f} | {row['Recall']:.4f} | {row['Precision']:.4f} |\n"
        
    md += "\n## 7. Limitations\n"
    md += "FedAvg provides data locality but does **NOT** itself provide formal differential privacy or immunity from model-update inference attacks. Advanced mechanisms like Secure Aggregation or Differential Privacy are required to fully obscure the weight updates. Furthermore, static hospital-level notes do not hold 1:1 correspondences with individual Edge IIoT sensor faults.\n"
    
    with open('reports/phase7_2_report.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    res_json = {
        "Best_Multimodal": best_round_mm.to_dict(),
        "Ablation": {
            "IoT_Only_F1": best_round_iot['F1'],
            "Multimodal_F1": best_round_mm['F1'],
            "Delta_F1": best_round_mm['F1'] - best_round_iot['F1'],
            "Delta_PR-AUC": best_round_mm['PR-AUC'] - best_round_iot['PR-AUC']
        },
        "Client_Metrics": c_best.to_dict(orient='records')
    }
    with open('reports/phase7_2_report.json', 'w') as f:
        json.dump(res_json, f, indent=4)
        
if __name__ == "__main__":
    main()
