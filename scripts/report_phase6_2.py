import json

def main():
    with open('reports/phase6_2_report.json', 'r') as f:
        res = json.load(f)
    with open('reports/phase6_1_report.json', 'r') as f:
        res_old = json.load(f)
        
    md = "# Phase 6.2: Client Assignment Robustness / Confounding Check\n\n"
    
    md += "## 1. Controlled Non-IID Partition Structure\n"
    md += "Unlike Phase 6.1, attacks were pseudo-randomly partitioned non-IID across clients to destroy any 1:1 correlation between clinical specialty and attack type, while keeping the client distributions strictly non-identical.\n\n"
    
    md += "### Test Set Attack Distributions:\n"
    for c in ["Client_1", "Client_2", "Client_3"]:
        dist = res['IoT_Only']['Clients'][c]['Attack_Distribution']
        md += f"**{c}**:\n"
        for atk, count in dist.items():
            md += f"- {atk}: {count}\n"
        md += "\n"
        
    md += "## 2. Global Results (Phase 6.2 Test Set)\n\n"
    md += "| Metric | IoT-Only | Clinical-Only | Multimodal |\n"
    md += "|---|---|---|---|\n"
    
    metrics = ['F1', 'Recall', 'Precision', 'PR-AUC', 'ROC-AUC']
    for m in metrics:
        a = res['IoT_Only']['Global'][m]
        b = res['Clinical_Only']['Global'][m]
        c = res['Multimodal']['Global'][m]
        md += f"| **{m}** | {a:.4f} | {b:.4f} | {c:.4f} |\n"
        
    md += "\n## 3. Client-Specific Performance (Phase 6.2)\n\n"
    md += "| Client | Edges | IoT Attack % | IoT-Only F1 | Multimodal F1 | ΔF1 |\n"
    md += "|---|---|---|---|---|---|\n"
    
    for c in ["Client_1", "Client_2", "Client_3"]:
        edges = res['IoT_Only']['Clients'][c]['Edges']
        atk = res['IoT_Only']['Clients'][c]['Attack_Ratio']
        f1_iot = res['IoT_Only']['Clients'][c]['F1']
        f1_multi = res['Multimodal']['Clients'][c]['F1']
        md += f"| {c} | {edges} | {atk*100:.1f}% | {f1_iot:.4f} | {f1_multi:.4f} | {f1_multi - f1_iot:+.4f} |\n"
        
    md += "\n## 4. Phase 6.1 vs Phase 6.2 Comparison & Confounding Analysis\n\n"
    
    f1_multi_61 = res_old['Multimodal']['Global']['F1']
    f1_multi_62 = res['Multimodal']['Global']['F1']
    f1_iot_62 = res['IoT_Only']['Global']['F1']
    
    delta_61 = f1_multi_61 - res_old['IoT_Only']['Global']['F1']
    delta_62 = f1_multi_62 - f1_iot_62
    
    md += f"- **Phase 6.1 Multimodal ΔF1 (Confounded)**: {delta_61:+.4f}\n"
    md += f"- **Phase 6.2 Multimodal ΔF1 (Deconfounded)**: {delta_62:+.4f}\n\n"
    
    if delta_62 >= delta_61 - 0.005 and delta_62 > 0:
        md += "The result provides evidence that multimodal fusion retains useful information under a less confounded non-IID client construction. The gain was not exclusively an artifact of deterministic attack mapping.\n"
    else:
        md += "The Phase 6.1 improvement was sensitive to the client assignment structure and should be interpreted as a simulation artifact rather than generalized clinical predictive information. By removing the deterministic specialty-to-attack shortcut, the multimodal F1 gain disappeared (or decreased substantially), demonstrating that the neural network was previously exploiting the artificial confounding correlation.\n"
        
    with open('reports/phase6_2_report.md', 'w', encoding='utf-8') as f:
        f.write(md)

if __name__ == "__main__":
    main()
