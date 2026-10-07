# Phase 7.2: Federated Multimodal Learning (FedAvg)

## 1. Objective & Architecture
The objective is to extend the IoT-only FedAvg baseline to full Multimodal (IoT + Clinical) FedAvg, preserving the 3 non-IID clients without allowing clinical representations or graph features to be centralized. We used the Phase 6.2 multimodal architecture: mapping the 31-dimensional IoT features and 768-dimensional Bio_ClinicalBERT vectors through separate 128-dimensional projection heads, then concatenating them before final anomaly prediction.

## 2. FedAvg Configuration
- **Clients**: 3
- **Global Rounds**: 10
- **Local Epochs per Round**: 1
- **Local Batch Size**: 256
- **Aggregation Strategy**: `FedAvg` (weighted by local sample counts)

## 3. Client Distributions & Data-Locality Boundary
Data mapping (Phase 6.2 identical assignment):
- **Client 1** (Surgery): ~64% Attack (mostly DDoS_ICMP/TCP).
- **Client 2** (Consult / Cardiovascular): ~51% Attack (mostly Port_Scanning, Password, Backdoor).
- **Client 3** (Psychiatry / Misc): ~99% Attack (mostly Injection, XSS).

**Privacy Boundary**: The server mathematically aggregates local model weight updates. No IoT features, flow metadata, timestamps, IP addresses, clinical notes, or Bio_ClinicalBERT embeddings were centralized.

## 4. Final Global Results (Best Round Test Set)
- **Best Round**: 10.0
- **F1**: 0.9916
- **Recall**: 1.0000
- **Precision**: 0.9833
- **PR-AUC**: 0.9945
- **ROC-AUC**: 0.9919

## 5. IoT-Only (Phase 7.1) vs Multimodal (Phase 7.2) Comparison
Both phases strictly used 10 rounds, 1 local epoch/round, and learning rate 1e-3.

| Metric | Phase 7.1 (IoT-Only) | Phase 7.2 (Multimodal) | Delta |
|---|---|---|---|
| **F1** | 0.9926 | 0.9916 | -0.0010 |
| **Recall** | 1.0000 | 1.0000 | +0.0000 |
| **Precision** | 0.9853 | 0.9833 | -0.0020 |
| **PR-AUC** | 0.9899 | 0.9945 | +0.0045 |
| **ROC-AUC** | 0.9871 | 0.9919 | +0.0048 |

### Interpretation:
The inclusion of clinical embeddings did **not** meaningfully improve packet-level anomaly detection under the deconfounded non-IID federated setting. The static clinical embeddings functionally acted as uniform client-level biases rather than dynamic threat signals, matching the theoretical limitations discovered during Phase 6.2.

## 6. Per-Client Observations (Phase 7.2 Best Round)
| Client | F1 | Recall | Precision |
|---|---|---|---|
| Client 1.0 | 0.9971 | 1.0000 | 0.9943 |
| Client 2.0 | 0.9738 | 0.9837 | 0.9641 |
| Client 3.0 | 1.0000 | 1.0000 | 1.0000 |

## 7. Limitations
FedAvg provides data locality but does **NOT** itself provide formal differential privacy or immunity from model-update inference attacks. Advanced mechanisms like Secure Aggregation or Differential Privacy are required to fully obscure the weight updates. Furthermore, static hospital-level notes do not hold 1:1 correspondences with individual Edge IIoT sensor faults.
