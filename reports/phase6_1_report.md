# Phase 6.1: Full Clinical Embedding + Multimodal Validation

## 1. Client Partition Statistics
| Client | Category Profile | Valid Notes |
|---|---|---|
| Client_1 | Surgery | 979 |
| Client_2 | Consult / Cardiovascular | 81 |
| Client_3 | Psychiatry / Misc | 1297 |

Every client successfully received a non-empty clinical representation, completely eliminating the need for a global-mean fallback.

## 2. Experimental Setup
- **Clinical Representation**: Mean aggregation of full Bio_ClinicalBERT chunk embeddings (dim 768) per simulated client.
- **IoT Representation**: Static GraphSAGE canonical edge representations (dim 223).
- **Multimodal Architecture**: Dual projection to 128 dimensions followed by concatenation and MLP classification.

## 3. Global Results (Test Set)

| Metric | IoT-Only | Clinical-Only | Multimodal |
|---|---|---|---|
| **F1** | 0.9768 | 0.8854 | 0.9923 |
| **Recall** | 0.9681 | 0.7944 | 0.9979 |
| **Precision** | 0.9856 | 1.0000 | 0.9867 |
| **PR-AUC** | 0.9920 | 0.9364 | 0.9984 |
| **ROC-AUC** | 0.9876 | 0.8960 | 0.9975 |

## 4. Client-Specific Performance (Multimodal vs IoT)

| Client | Edges | IoT Attack % | IoT-Only F1 | Multimodal F1 | ΔF1 |
|---|---|---|---|---|---|
| Client_1 | 40378 | 100.0% | 0.9782 | 1.0000 | +0.0218 |
| Client_2 | 3576 | 100.0% | 0.9997 | 0.9997 | +0.0000 |
| Client_3 | 37136 | 30.6% | 0.9652 | 0.9634 | -0.0018 |

## 5. Scientific Interpretation & Ablation
The clinical modality did not provide substantial additional predictive information for the current packet-level IoT anomaly target under the simulated institution-level fusion design. The absolute difference in F1 was +0.0155, indicating that the anomaly detection capability derives entirely from the dynamic IoT edge features. Adding aggregated, static clinical notes acts as neutral contextual padding for packet-level attacks.
