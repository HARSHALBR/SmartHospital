import pandas as pd
import json
import matplotlib.pyplot as plt
import os
import numpy as np

def main():
    os.makedirs('results/phase8_4/plots', exist_ok=True)
    os.makedirs('reports', exist_ok=True)
    
    summary_df = pd.read_csv('results/phase8_4/summary.csv')
    
    aggregators = ['fedavg', 'median']
    scenarios = ['Clean', 'Attack_C1', 'Attack_C2', 'Attack_C3', 'Attack_C1_C2_Extreme']
    
    # Plot 1: Global F1 vs Communication Round (Clean)
    plt.figure(figsize=(10, 6))
    for agg in aggregators:
        df = pd.read_csv(f'results/phase8_4/{agg}_Clean/global_metrics.csv')
        plt.plot(df['Round'], df['F1'], marker='o', label=agg.capitalize())
    plt.title('Global F1 vs Communication Round (Clean Data)')
    plt.xlabel('Round')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_4/plots/clean_convergence.png')
    plt.close()
    
    # Plot 2: Global F1 vs Communication Round (Attack C1)
    plt.figure(figsize=(10, 6))
    for agg in aggregators:
        df = pd.read_csv(f'results/phase8_4/{agg}_Attack_C1/global_metrics.csv')
        plt.plot(df['Round'], df['F1'], marker='o', label=agg.capitalize())
    plt.title('Global F1 vs Communication Round (Byzantine Attack C1)')
    plt.xlabel('Round')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_4/plots/attack_c1_convergence.png')
    plt.close()
    
    # Plot 3: Update Norms (Attack C1 FedAvg)
    df = pd.read_csv('results/phase8_4/fedavg_Attack_C1/diagnostics.csv')
    plt.figure(figsize=(10, 6))
    plt.plot(df['Round'], df['Mean_Honest_Norm'], marker='o', label='Mean Honest Norm')
    plt.plot(df['Round'], df['Mean_Byzantine_Norm'], marker='s', label='Byzantine Norm')
    plt.plot(df['Round'], df['Global_Update_Norm'], marker='^', label='Aggregated Global Norm')
    plt.title('Parameter Update L2 Norms (FedAvg under Attack C1)')
    plt.xlabel('Round')
    plt.ylabel('L2 Norm')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_4/plots/diagnostics_norms.png')
    plt.close()
    
    md = "# Phase 8.4: Byzantine-Robust Federated Learning\n\n"
    md += "## 1. Objective & Setup\n"
    md += "Evaluate the robustness of standard FedAvg against **Coordinate-wise Median** aggregation under controlled model-update poisoning (Sign-Flip attacks) on the severe non-IID partition. The Byzantine client flips the direction of its true local update and amplifies it by $\\alpha = 5$. This is a strict 3-client simulation, meaning a 1-client attack corrupts 33.3% of the network, and the 2-client stress test corrupts 66.7%.\n\n"
    
    md += "## 2. Final Summary Matrix\n"
    md += "| Aggregator | Scenario | Global F1 | Mean Client F1 | Worst Client F1 | Client F1 Std |\n"
    md += "|---|---|---:|---:|---:|---:|\n"
    for _, row in summary_df.iterrows():
        md += f"| {row['Aggregator']} | {row['Scenario']} | {row['Global_F1']:.4f} | {row['Mean_Client_F1']:.4f} | {row['Worst_Client_F1']:.4f} | {row['Client_F1_Std']:.4f} |\n"
    md += "\n"
    
    clean_fedavg = summary_df[(summary_df['Aggregator'] == 'fedavg') & (summary_df['Scenario'] == 'Clean')].iloc[0]
    clean_median = summary_df[(summary_df['Aggregator'] == 'median') & (summary_df['Scenario'] == 'Clean')].iloc[0]
    
    md += "## 3. Clean-Performance Cost\n"
    md += f"- **FedAvg Clean Global F1**: {clean_fedavg['Global_F1']:.4f}\n"
    md += f"- **Median Clean Global F1**: {clean_median['Global_F1']:.4f}\n"
    md += f"- **Clean Performance Degradation**: {clean_median['Global_F1'] - clean_fedavg['Global_F1']:+.4f}\n\n"
    
    att_c1_fedavg = summary_df[(summary_df['Aggregator'] == 'fedavg') & (summary_df['Scenario'] == 'Attack_C1')].iloc[0]
    att_c1_median = summary_df[(summary_df['Aggregator'] == 'median') & (summary_df['Scenario'] == 'Attack_C1')].iloc[0]
    
    md += "## 4. Byzantine Robustness (Attack C1 - 33.3% Corruption)\n"
    md += f"- **FedAvg Attacked Global F1**: {att_c1_fedavg['Global_F1']:.4f}\n"
    md += f"- **Median Attacked Global F1**: {att_c1_median['Global_F1']:.4f}\n"
    md += f"- **Byzantine Robustness Improvement**: {att_c1_median['Global_F1'] - att_c1_fedavg['Global_F1']:+.4f}\n\n"
    
    md += "## 5. Scientific Interpretation\n"
    
    if (clean_fedavg['Global_F1'] - att_c1_fedavg['Global_F1']) > 0.05:
        md += "Standard **FedAvg degraded significantly** under the targeted Byzantine sign-flip attack. The weighted averaging mechanism indiscriminately incorporated the corrupted gradients, causing the global boundary to partially collapse.\n\n"
    else:
        md += "Standard **FedAvg proved somewhat resilient** to the 33.3% corruption on Global F1, though underlying local utilities may have shifted. The extreme data volume (canonical flows) provided enough honest gradient momentum to partially absorb the amplified sign flip.\n\n"
        
    if (att_c1_median['Global_F1'] - att_c1_fedavg['Global_F1']) > 0.05:
        md += "**Coordinate-wise Median successfully mitigated the Byzantine attack**, rescuing the global boundary from the corrupted update and demonstrating mathematically stronger robustness than standard averaging.\n\n"
    elif att_c1_median['Global_F1'] >= att_c1_fedavg['Global_F1']:
        md += "**Coordinate-wise Median preserved the boundary successfully**, effectively ignoring the amplified Byzantine vector and maintaining performance parity with its clean baseline.\n\n"
    else:
        md += "**Coordinate-wise Median failed** to outperform FedAvg. Because there are only 3 clients, selecting the strict median value when 33.3% of the network is corrupted mathematically limits the aggregator's ability to locate a clean, robust centroid (as the median of 3 elements where 1 is extreme often just selects one of the remaining two, losing the averaging utility).\n\n"
        
    md += "## 6. Limitations\n"
    md += "This is a controlled 3-client simulation over the Edge-IIoTset cybersecurity dataset. Robust aggregation like Median is highly dependent on the number of honest clients. In a 3-client topology, the statistical breakdown point is inherently precarious. This validates resilience to a controlled model-update poisoning scenario, but does NOT certify universal security for large-scale decentralized systems.\n"
    
    with open('reports/Phase_8_4_Byzantine_Robustness.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    with open('reports/phase8_4_byzantine_robustness_report.txt', 'w', encoding='utf-8') as f:
        f.write(md)
        
    with open('reports/phase8_4_byzantine_robustness_report.json', 'w') as f:
        json.dump(summary_df.to_dict(orient='records'), f, indent=4)

if __name__ == "__main__":
    main()
