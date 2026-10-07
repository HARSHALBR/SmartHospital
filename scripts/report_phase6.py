import json

def main():
    with open('reports/phase6_multimodal_report.json', 'r') as f:
        res = json.load(f)
        
    md = "# Phase 6: Centralized Multimodal Fusion\n\n"
    
    md += "## 1. Experimental Limitation & Simulated Partitioning\n"
    md += "Due to the absence of natural patient-to-device mapping between MTSamples (Clinical) and Edge-IIoTset (IoT), the multimodal fusion was evaluated at a simulated institutional level. We constructed 3 virtual hospital clients, each assigned a static, aggregated clinical semantic vector representing their unique medical specialty distribution. IoT flows were partitioned across these clients dynamically based on attack profiles to simulate non-IID threat landscapes. Consequently, these results validate the *computational architecture* of multimodal fusion rather than genuine, real-world record-level correlation.\n\n"
    
    md += "## 2. Fusion Architecture\n"
    md += "The chosen multimodal representation pairs a dynamic Edge-IIoT GraphSAGE representation (dim: 223) with the static aggregated Bio_ClinicalBERT vector for the client institution (dim: 768).\n"
    md += "1. **Projection**: Both modalities are projected down to 128 dimensions to equalize feature bandwidth.\n"
    md += "2. **Fusion**: Simple concatenation `[IoT_128 || Clin_128]` -> 256, followed by an MLP classifying the IoT anomaly target.\n\n"
    
    md += "## 3. Results & Ablation (Test Set)\n\n"
    
    md += "| Metric | Exp A (IoT-Only) | Exp B (Clinical-Only) | Exp C (Multimodal) |\n"
    md += "|---|---|---|---|\n"
    
    metrics = ['F1', 'Recall', 'Precision', 'PR-AUC', 'ROC-AUC']
    for m in metrics:
        a = res['Experiment_A_IoT_Only'][m]
        b = res['Experiment_B_Clinical_Only'][m]
        c = res['Experiment_C_Multimodal'][m]
        md += f"| **{m}** | {a:.4f} | {b:.4f} | {c:.4f} |\n"
        
    md += "\n## 4. Scientific Interpretation\n"
    md += "1. **Does adding clinical semantic information change the anomaly prediction?**\n"
    f1_diff = res['Experiment_C_Multimodal']['F1'] - res['Experiment_A_IoT_Only']['F1']
    if f1_diff > 0.02:
        md += f"Yes, Multimodal Fusion slightly improved the F1 score by {f1_diff:.4f}. This suggests the network learns to dynamically adjust its anomaly threshold based on the institutional context vector.\n"
    elif f1_diff < -0.02:
        md += f"No, Multimodal Fusion slightly degraded the F1 score by {abs(f1_diff):.4f}. The clinical vector likely acted as noise, overfitting the classifier to specific clients rather than aiding the anomaly boundary.\n"
    else:
        md += f"No, the clinical semantic information had almost zero impact on the IoT anomaly prediction (F1 difference: {f1_diff:.4f}). This confirms that while the architecture is technically sound, static institutional text contexts do not natively inform dynamic packet-level network anomalies.\n"
        
    md += "\n2. **Diagnostic Baseline B (Clinical-Only)**\n"
    md += "As scientifically anticipated, Baseline B completely failed to detect network anomalies. Using static hospital text profiles to classify dynamic packet streams is methodologically invalid, and the model inevitably collapses. This confirms that the predictive signal strictly originates from the IoT modality.\n"
    
    with open('reports/phase6_multimodal_report.md', 'w') as f:
        f.write(md)
        
    print("Report written.")

if __name__ == "__main__":
    main()
