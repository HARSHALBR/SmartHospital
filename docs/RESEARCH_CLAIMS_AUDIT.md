# Research Claims Audit

This document strictly audits the scientific claims presented in the Research Demonstration Platform against the empirical evidence recorded in the Phase 1–9 locked artifacts.

| Claim | Evidence Source | Status | Notes |
| :--- | :--- | :--- | :--- |
| **EdgeMLP outperformed GraphSAGE** | `results/phase4_2` | **Supported** | Structural oversmoothing hindered GNNs on this specific temporal window configuration. |
| **FedAvg comparable to centralized** | `results/phase7_3` | **Supported** | Global FedAvg F1 matched the centralized oracle. |
| **Non-IID degrades worst-client** | `results/phase8_1` | **Supported** | JSD curve directly maps to Client 3 F1 decay. |
| **FedProx drastically improves F1** | `results/phase8_2` | **NOT supported** | Reduced structural model drift ($L_2$), but F1 improvement was marginal. |
| **Clinical embeddings improve packet detection** | `results/phase6_2` | **NOT supported** | Multimodal fusion failed to exceed the IoT-only baseline. |
| **Coordinate-wise Median mitigates tested minority sign-flip** | `results/phase8_4` | **Supported** | F1 recovered to baseline when $1/3$ clients attacked. |
| **Median protects against all Byzantine attacks** | No evidence | **NOT supported** | Attack simulation empirically proves failure when $2/3$ clients collude. |
| **Formal $\epsilon$-$\delta$ DP guarantee** | `results/phase9` | **NOT established** | The 3-client topology mathematically fails formal DP bound equations. |
| **Secure aggregation is production-grade** | No evidence | **NOT supported** | It was evaluated as a lightweight conceptual/research simulation only. |
| **HIPAA Compliant System** | No evidence | **NOT supported** | Data is synthetic/proxy; no production security frameworks applied. |
