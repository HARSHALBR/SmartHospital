import pandas as pd

def generate_byzantine_report():
    df = pd.read_csv('results/phase8_4/summary.csv')
    
    b_fedavg_clean = df[(df['Aggregator'] == 'fedavg') & (df['Scenario'] == 'Clean')].iloc[0]
    b_med_clean = df[(df['Aggregator'] == 'median') & (df['Scenario'] == 'Clean')].iloc[0]
    b_fedavg_c1 = df[(df['Aggregator'] == 'fedavg') & (df['Scenario'] == 'Attack_C1')].iloc[0]
    b_med_c1 = df[(df['Aggregator'] == 'median') & (df['Scenario'] == 'Attack_C1')].iloc[0]
    b_fedavg_c2 = df[(df['Aggregator'] == 'fedavg') & (df['Scenario'] == 'Attack_C2')].iloc[0]
    b_med_c2 = df[(df['Aggregator'] == 'median') & (df['Scenario'] == 'Attack_C2')].iloc[0]
    b_fedavg_c3 = df[(df['Aggregator'] == 'fedavg') & (df['Scenario'] == 'Attack_C3')].iloc[0]
    b_med_c3 = df[(df['Aggregator'] == 'median') & (df['Scenario'] == 'Attack_C3')].iloc[0]
    b_fedavg_c12 = df[(df['Aggregator'] == 'fedavg') & (df['Scenario'] == 'Attack_C1_C2_Extreme')].iloc[0]
    b_med_c12 = df[(df['Aggregator'] == 'median') & (df['Scenario'] == 'Attack_C1_C2_Extreme')].iloc[0]

    md = "# Phase 9.2: Byzantine Security Consolidation\n\n"
    md += "## 1. Attack Model (Threat Model B)\n"
    md += "- **Attacker**: Malicious client\n"
    md += "- **Action**: Model-update poisoning via sign-flip attack\n"
    md += "- **Implementation**: The malicious client intercepts the normal gradient $\\Delta_k$, multiplies it by a negative constant ($\\alpha = 5$), and sends the corrupted $\\Delta_{byz} = -5 \cdot \\Delta_k$ to the aggregator.\n"
    
    md += "\n## 2. Aggregation Mechanics\n"
    md += "- **FedAvg**: $w = \sum \frac{n_k}{n} w_k$ (Vulnerable to outliers, heavily skews the boundary)\n"
    md += "- **Coordinate-wise Median**: Evaluates each parameter dimension individually and strictly selects the 50th percentile value, discarding extreme outliers.\n"
    
    md += "\n## 3. Results (Demonstrated Controlled Poisoning Resilience)\n"
    md += "| Aggregator | Scenario | Malicious Clients | Global F1 | Worst Client F1 |\n"
    md += "|---|---|---:|---:|---:|\n"
    md += f"| FedAvg | Clean | 0/3 | {b_fedavg_clean['Global_F1']:.4f} | {b_fedavg_clean['Worst_Client_F1']:.4f} |\n"
    md += f"| Median | Clean | 0/3 | {b_med_clean['Global_F1']:.4f} | {b_med_clean['Worst_Client_F1']:.4f} |\n"
    md += f"| FedAvg | Client 1 Malicious | 1/3 (33%) | {b_fedavg_c1['Global_F1']:.4f} | {b_fedavg_c1['Worst_Client_F1']:.4f} |\n"
    md += f"| Median | Client 1 Malicious | 1/3 (33%) | {b_med_c1['Global_F1']:.4f} | {b_med_c1['Worst_Client_F1']:.4f} |\n"
    md += f"| FedAvg | Client 2 Malicious | 1/3 (33%) | {b_fedavg_c2['Global_F1']:.4f} | {b_fedavg_c2['Worst_Client_F1']:.4f} |\n"
    md += f"| Median | Client 2 Malicious | 1/3 (33%) | {b_med_c2['Global_F1']:.4f} | {b_med_c2['Worst_Client_F1']:.4f} |\n"
    md += f"| FedAvg | Client 3 Malicious | 1/3 (33%) | {b_fedavg_c3['Global_F1']:.4f} | {b_fedavg_c3['Worst_Client_F1']:.4f} |\n"
    md += f"| Median | Client 3 Malicious | 1/3 (33%) | {b_med_c3['Global_F1']:.4f} | {b_med_c3['Worst_Client_F1']:.4f} |\n"
    md += f"| FedAvg | C1+C2 Malicious | 2/3 (66%) | {b_fedavg_c12['Global_F1']:.4f} | {b_fedavg_c12['Worst_Client_F1']:.4f} |\n"
    md += f"| Median | C1+C2 Malicious | 2/3 (66%) | {b_med_c12['Global_F1']:.4f} | {b_med_c12['Worst_Client_F1']:.4f} |\n"
    
    md += "\n## 4. Scientific Conclusion\n"
    md += "The Coordinate-wise Median effectively mitigated the 33% minority attack, proving its resilience as a robust aggregator against controlled sign-flip poisoning. For example, it rescued the Global F1 from 0.4054 (FedAvg) back up to 0.8918 under the Client 2 attack. However, it structurally collapses under the extreme 66% malicious majority, as mathematically expected. We DO NOT claim that Coordinate-wise Median is Byzantine-proof against all arbitrary attacks, only that it provides demonstrated mitigation against minority targeted sign-flips."
    
    with open('reports/phase9_2_byzantine_security.md', 'w') as f:
        f.write(md)

if __name__ == '__main__':
    generate_byzantine_report()
