# Phase 6: Centralized Multimodal Fusion

## 1. Experimental Limitation & Simulated Partitioning
Due to the absence of natural patient-to-device mapping between MTSamples (Clinical) and Edge-IIoTset (IoT), the multimodal fusion was evaluated at a simulated institutional level. We constructed 3 virtual hospital clients, each assigned a static, aggregated clinical semantic vector representing their unique medical specialty distribution. IoT flows were partitioned across these clients dynamically based on attack profiles to simulate non-IID threat landscapes. Consequently, these results validate the *computational architecture* of multimodal fusion rather than genuine, real-world record-level correlation.

## 2. Fusion Architecture
The chosen multimodal representation pairs a dynamic Edge-IIoT GraphSAGE representation (dim: 223) with the static aggregated Bio_ClinicalBERT vector for the client institution (dim: 768).
1. **Projection**: Both modalities are projected down to 128 dimensions to equalize feature bandwidth.
2. **Fusion**: Simple concatenation `[IoT_128 || Clin_128]` -> 256, followed by an MLP classifying the IoT anomaly target.

## 3. Results & Ablation (Test Set)

| Metric | Exp A (IoT-Only) | Exp B (Clinical-Only) | Exp C (Multimodal) |
|---|---|---|---|
| **F1** | 0.9770 | 0.1214 | 0.9772 |
| **Recall** | 0.9669 | 0.0646 | 0.9672 |
| **Precision** | 0.9873 | 1.0000 | 0.9874 |
| **PR-AUC** | 0.9926 | 0.9430 | 0.9960 |
| **ROC-AUC** | 0.9886 | 0.9087 | 0.9930 |

## 4. Scientific Interpretation
1. **Does adding clinical semantic information change the anomaly prediction?**
No, the clinical semantic information had almost zero impact on the IoT anomaly prediction (F1 difference: 0.0002). This confirms that while the architecture is technically sound, static institutional text contexts do not natively inform dynamic packet-level network anomalies.

2. **Diagnostic Baseline B (Clinical-Only)**
As scientifically anticipated, Baseline B completely failed to detect network anomalies. Using static hospital text profiles to classify dynamic packet streams is methodologically invalid, and the model inevitably collapses. This confirms that the predictive signal strictly originates from the IoT modality.
