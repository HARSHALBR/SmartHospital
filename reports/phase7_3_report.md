# Phase 7.3: Fair Centralized vs Federated Evaluation

## 1. Objective & Experimental Design
The objective is to establish a mathematically fair comparison between Centralized and Federated (FedAvg) training under strictly identical optimization budgets (10 global rounds/epochs). The non-IID Phase 6.2 hospital-client data partitions and validated static Bio_ClinicalBERT representations were preserved.

## 2. Centralized vs Federated Comparison
| Model | F1 | Precision | Recall | PR-AUC | ROC-AUC |
|---|---|---|---|---|---|
| Centralized_IoT | 0.9931 | 0.9865 | 0.9997 | 0.9919 | 0.9905 |
| Centralized_Multimodal | 0.9932 | 0.9865 | 1.0000 | 0.9908 | 0.9869 |
| Federated_IoT | 0.9930 | 0.9863 | 0.9998 | 0.9898 | 0.9870 |
| Federated_Multimodal | 0.9917 | 0.9836 | 1.0000 | 0.9942 | 0.9913 |

### Accuracy Trade-off Analysis
- **Federated IoT vs Centralized IoT F1 $\Delta$**: -0.0000
- **Federated Multimodal vs Centralized Multimodal F1 $\Delta$**: -0.0015

The Federated models achieved near-parity with the Centralized models. The mathematical aggregation of FedAvg successfully modeled the global packet anomaly distribution without requiring direct access to the raw datasets, demonstrating an incredibly efficient optimization path for this non-IID IoT data.

### Multimodal vs IoT-only Comparison
- **Centralized Multimodal vs IoT F1 $\Delta$**: +0.0001
- **Federated Multimodal vs IoT F1 $\Delta$**: -0.0013

Consistent with Phase 6.2, after the removal of the deterministic clinical-specialty/attack-type confounding shortcut, the clinical embeddings do not provide a causal or consistent packet-level anomaly indicator. They function as static parameter biases.

## 3. Communication & Computational Overhead
### Communication Cost (FedAvg, 10 Rounds, 3 Clients)
| Model | Trainable Parameters | Parameter Size (MB) | Server to Client (MB) | Client to Server (MB) | Total Communication (MB) |
|---|---|---|---|---|---|
| Federated_IoT | 4225 | 0.0161 | 0.4835 | 0.4835 | 0.9670 |
| Federated_Multimodal | 135553 | 0.5171 | 15.5128 | 15.5128 | 31.0256 |

### Computational Cost (CPU Wall-clock Time)
| Model | Training Time (Seconds) |
|---|---|
| Centralized_IoT | 114.78 |
| Centralized_Multimodal | 288.53 |
| Federated_IoT | 114.02 |
| Federated_Multimodal | 235.74 |

## 4. Privacy & Data Locality Boundary
In the Centralized experiments, raw Edge-IIoTset edge features and labels were artificially pooled into a single memory buffer. In the Federated experiments, all raw datasets remained isolated. The server only calculated $w = \sum \frac{n_k}{n} w_k$. **Crucial Limitation**: Standard FedAvg provides data locality but does **NOT** provide formal differential privacy. Weight updates remain vulnerable to inference attacks without secure aggregation mechanisms.
