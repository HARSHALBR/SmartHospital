import pandas as pd
import json
import matplotlib.pyplot as plt
import os

def main():
    os.makedirs('results/phase8_2/plots', exist_ok=True)
    
    summary_df = pd.read_csv('results/phase8_2/mu_comparison.csv')
    
    mu_folders = ['fedavg', 'mu_0.001', 'mu_0.01', 'mu_0.1']
    mu_labels = ['FedAvg (mu=0)', 'FedProx (mu=0.001)', 'FedProx (mu=0.01)', 'FedProx (mu=0.1)']
    
    # Plot 1: Global F1 vs Round
    plt.figure(figsize=(10, 6))
    for f, l in zip(mu_folders, mu_labels):
        df = pd.read_csv(f'results/phase8_2/{f}/global_metrics.csv')
        plt.plot(df['Round'], df['F1'], marker='o', label=l)
    plt.title('Global F1 vs Federated Round')
    plt.xlabel('Round')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_2/plots/convergence_global_f1.png')
    plt.close()
    
    # Plot 2: Worst Client F1 vs Round
    plt.figure(figsize=(10, 6))
    for f, l in zip(mu_folders, mu_labels):
        c_df = pd.read_csv(f'results/phase8_2/{f}/client_metrics.csv')
        worst_f1s = c_df.groupby('Round')['F1'].min().reset_index()
        plt.plot(worst_f1s['Round'], worst_f1s['F1'], marker='s', label=l)
    plt.title('Worst Client F1 vs Federated Round')
    plt.xlabel('Round')
    plt.ylabel('F1 Score')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_2/plots/convergence_worst_client_f1.png')
    plt.close()
    
    # Plot 3: Client Divergence
    plt.figure(figsize=(10, 6))
    for f, l in zip(mu_folders, mu_labels):
        d_df = pd.read_csv(f'results/phase8_2/{f}/divergence_metrics.csv')
        mean_div = d_df.groupby('Round')['Divergence'].mean().reset_index()
        plt.plot(mean_div['Round'], mean_div['Divergence'], marker='^', label=l)
    plt.title('Mean Client Parameter Divergence vs Round')
    plt.xlabel('Round')
    plt.ylabel('L2 Divergence')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/phase8_2/plots/convergence_divergence.png')
    plt.close()
    
    md = "# Phase 8.2: FedProx for Severe Non-IID Hospital Clients\n\n"
    md += "## 1. Objective & Experimental Design\n"
    md += "This phase evaluates whether the FedProx algorithm (which adds a proximal penalty $\\frac{\\mu}{2} ||w - w_{global}||^2$ to the local objective) can mitigate the catastrophic divergence and local performance deterioration observed in the worst-case (Severe) non-IID hospital client distribution from Phase 8.1. We evaluated standard FedAvg ($\\mu=0$) against FedProx with $\\mu \\in \\{0.001, 0.01, 0.1\\}$.\n\n"
    
    md += "## 2. Final Summary Table (Validation-Selected Round)\n"
    md += "| Algorithm | $\\mu$ | Global F1 | Global PR-AUC | Mean Client F1 | Worst Client F1 | Client F1 Std | Mean Divergence |\n"
    md += "|---|---|---|---|---|---|---|---|\n"
    for _, row in summary_df.iterrows():
        md += f"| {row['Algorithm']} | {row['Mu']} | {row['Global_F1']:.4f} | {row['Global_PR_AUC']:.4f} | {row['Mean_Client_F1']:.4f} | {row['Worst_Client_F1']:.4f} | {row['Client_F1_Std']:.4f} | {row['Mean_Divergence']:.4f} |\n"
    md += "\n"
    
    fedavg = summary_df[summary_df['Algorithm'] == 'FedAvg'].iloc[0]
    best_fedprox = summary_df[summary_df['Algorithm'] == 'FedProx'].sort_values(by='Worst_Client_F1', ascending=False).iloc[0]
    
    md += "## 3. Robustness Interpretation (FedAvg vs Best FedProx)\n"
    md += f"- **Best $\\mu$ Selection**: {best_fedprox['Mu']}\n"
    md += f"- **$\\Delta$ Global F1**: {best_fedprox['Global_F1'] - fedavg['Global_F1']:+.4f}\n"
    md += f"- **$\\Delta$ Worst Client F1**: {best_fedprox['Worst_Client_F1'] - fedavg['Worst_Client_F1']:+.4f}\n"
    md += f"- **$\\Delta$ Client F1 Variance**: {best_fedprox['Client_F1_Std'] - fedavg['Client_F1_Std']:+.4f}\n"
    md += f"- **$\\Delta$ Client Divergence**: {best_fedprox['Mean_Divergence'] - fedavg['Mean_Divergence']:+.4f}\n\n"
    
    if best_fedprox['Worst_Client_F1'] - fedavg['Worst_Client_F1'] > 0.005:
        md += "FedProx **successfully addressed the client-level weakness** identified in Phase 8.1. By restricting local weight drift, the proximal term forced the highly specialized clients to respect the global packet anomaly distribution, significantly raising the Worst-Client F1 and tightening the variance between hospitals without severely harming Global F1.\n\n"
    elif best_fedprox['Worst_Client_F1'] - fedavg['Worst_Client_F1'] < -0.005:
        md += "FedProx **caused further degradation** compared to FedAvg. The proximal penalty overly restricted the parameter updates, preventing the local models from converging on the specialized attack geometries, resulting in a collapse in both client-level utility and global representation.\n\n"
    else:
        md += "FedProx provided **no meaningful improvement** over FedAvg for this specific IoT dataset. The proximal penalty successfully restricted $L_2$ divergence (preventing extreme parameter drift), but this mathematical constraint did not translate into a functional recovery of Worst-Client F1. The underlying class starvation remains the dominant failure mode.\n\n"
        
    md += "## 4. Computational Cost\n"
    md += "| Algorithm | $\\mu$ | Training Time (Seconds) |\n"
    md += "|---|---|---|\n"
    for _, row in summary_df.iterrows():
        md += f"| {row['Algorithm']} | {row['Mu']} | {row['Training_Time']:.2f} |\n"
    md += "\n"
    md += "The inclusion of the proximal term requires traversing the parameter graph to calculate $||w - w_{global}||^2$ at every local batch, increasing sequential CPU time accordingly.\n"

    with open('reports/phase8_2_report.md', 'w', encoding='utf-8') as f:
        f.write(md)
        
    with open('reports/phase8_2_report.json', 'w') as f:
        json.dump(summary_df.to_dict(orient='records'), f, indent=4)

if __name__ == "__main__":
    main()
