# Phase 8.2: FedProx for Severe Non-IID Hospital Clients

## 1. Objective & Experimental Design
This phase evaluates whether the FedProx algorithm (which adds a proximal penalty $\frac{\mu}{2} ||w - w_{global}||^2$ to the local objective) can mitigate the catastrophic divergence and local performance deterioration observed in the worst-case (Severe) non-IID hospital client distribution from Phase 8.1. We evaluated standard FedAvg ($\mu=0$) against FedProx with $\mu \in \{0.001, 0.01, 0.1\}$.

## 2. Final Summary Table (Validation-Selected Round)
| Algorithm | $\mu$ | Global F1 | Global PR-AUC | Mean Client F1 | Worst Client F1 | Client F1 Std | Mean Divergence |
|---|---|---|---|---|---|---|---|
| FedAvg | 0.0 | 0.9927 | 0.9894 | 0.9878 | 0.9653 | 0.0159 | 2.3441 |
| FedProx | 0.001 | 0.9928 | 0.9905 | 0.9879 | 0.9656 | 0.0158 | 1.3672 |
| FedProx | 0.01 | 0.9929 | 0.9884 | 0.9881 | 0.9661 | 0.0155 | 0.8017 |
| FedProx | 0.1 | 0.9915 | 0.9874 | 0.9856 | 0.9587 | 0.0190 | 0.4030 |

## 3. Robustness Interpretation (FedAvg vs Best FedProx)
- **Best $\mu$ Selection**: 0.01
- **$\Delta$ Global F1**: +0.0001
- **$\Delta$ Worst Client F1**: +0.0008
- **$\Delta$ Client F1 Variance**: -0.0004
- **$\Delta$ Client Divergence**: -1.5424

FedProx provided **no meaningful improvement** over FedAvg for this specific IoT dataset. The proximal penalty successfully restricted $L_2$ divergence (preventing extreme parameter drift), but this mathematical constraint did not translate into a functional recovery of Worst-Client F1. The underlying class starvation remains the dominant failure mode.

## 4. Computational Cost
| Algorithm | $\mu$ | Training Time (Seconds) |
|---|---|---|
| FedAvg | 0.0 | 124.03 |
| FedProx | 0.001 | 136.12 |
| FedProx | 0.01 | 134.72 |
| FedProx | 0.1 | 170.70 |

The inclusion of the proximal term requires traversing the parameter graph to calculate $||w - w_{global}||^2$ at every local batch, increasing sequential CPU time accordingly.
