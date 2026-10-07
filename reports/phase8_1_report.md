# Phase 8.1: Controlled Non-IID Severity Analysis

## 1. Objective & Experimental Design
This phase systematically measures the robustness of standard FedAvg under progressively worsening client data heterogeneity. We implemented four controlled data partitions: IID, Mild, Moderate, and Severe, using deterministic hashing to route the canonical IoT graphs while preserving total data limits and keeping model hyperparameters strictly identical (10 rounds, 1 local epoch, EdgeMLP).

## 2. Statistical Heterogeneity (Jensen-Shannon Divergence)
We quantify the skew of each severity level using the Jensen-Shannon Divergence (JSD) between the client attack distributions and the global distribution.

| Severity | Client 1 JSD | Client 2 JSD | Client 3 JSD | Mean JSD |
|---|---|---|---|---|
| Iid | 0.0741 | 0.0364 | 0.1564 | 0.0890 |
| Mild | 0.0663 | 0.0580 | 0.2154 | 0.1132 |
| Moderate | 0.0409 | 0.0757 | 0.2378 | 0.1181 |
| Severe | 0.0503 | 0.1595 | 0.2937 | 0.1678 |

## 3. Final Summary Table (Performance across Severities)
| Severity | Mean JSD | Global F1 | Global PR-AUC | Mean Client F1 | Worst Client F1 | Client F1 Std |
|---|---|---|---|---|---|---|
| Iid | 0.0890 | 0.9931 | 0.9909 | 0.9931 | 0.9840 | 0.0067 |
| Mild | 0.1132 | 0.9931 | 0.9911 | 0.9938 | 0.9849 | 0.0064 |
| Moderate | 0.1181 | 0.9930 | 0.9904 | 0.9914 | 0.9767 | 0.0105 |
| Severe | 0.1678 | 0.9923 | 0.9896 | 0.9870 | 0.9630 | 0.0170 |

## 4. Robustness Interpretation
- **Global F1 Degradation (IID → Severe)**: -0.0008
- **Worst-Client F1 Degradation (IID → Severe)**: -0.0210

FedAvg demonstrated **high robustness** under the tested heterogeneity range. Both Global F1 and Worst-Client F1 remained remarkably stable despite the severe skewing of local attack distributions. The shared representation proved resilient to local label imbalances over 10 communication rounds.

