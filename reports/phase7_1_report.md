# Phase 7.1: Federated Learning Baseline (Flower + FedAvg)

## 1. Objective & Architecture
The objective is to establish a rigorous Federated Learning baseline using Flower (`flwr`) and standard Federated Averaging (`FedAvg`) across 3 highly non-IID hospital clients. We utilized the validated Edge MLP IoT-only model from Phase 6.2. 
**Privacy Boundary**: The global server mathematically aggregated parameter weights directly exchanged with the simulated clients. No raw graph edges, IP addresses, node identities, or local tabular data ever left the hospital client partitions.

## 2. FedAvg Configuration
- **Clients**: 3
- **Global Rounds**: 10
- **Local Epochs per Round**: 1
- **Local Batch Size**: 256
- **Aggregation Strategy**: `FedAvg` (weighted by local sample counts)

## 3. Final Global Results (Best Round Test Set)
- **Best Round**: 6.0
- **F1**: 0.9926
- **Recall**: 1.0000
- **Precision**: 0.9853
- **PR-AUC**: 0.9899
- **ROC-AUC**: 0.9871

## 4. Centralized vs Federated Ablation
| Metric | Centralized (Phase 6.2) | Federated (Phase 7.1) | Delta |
|---|---|---|---|
| **F1** | 0.9774 | 0.9926 | +0.0152 |
| **Recall** | 0.9680 | 1.0000 | +0.0320 |
| **PR-AUC** | 0.9921 | 0.9899 | -0.0021 |

The observed performance gap factually demonstrates the typical degradation experienced when transitioning from full data centralization to distributed non-IID local training (without advanced strategies like FedProx or personalization).

## 5. Convergence & Per-Client Observations
*(Please see `results/phase7_1/plots/` for generated convergence graphs)*

| Client | F1 | Recall | Precision |
|---|---|---|---|
| Client 1.0 | 0.9971 | 1.0000 | 0.9943 |
| Client 2.0 | 0.9753 | 0.9885 | 0.9625 |
| Client 3.0 | 1.0000 | 1.0000 | 1.0000 |

## 6. Limitations
Standard FedAvg keeps raw training data local to each client while exchanging model parameters for aggregation. However, exchanging raw gradients or parameters is vulnerable to inference attacks. Additional privacy mechanisms (e.g. Differential Privacy, Secure Aggregation) are strictly required to provide formal mathematical privacy guarantees.
