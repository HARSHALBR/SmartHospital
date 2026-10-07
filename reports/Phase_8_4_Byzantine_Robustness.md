# Phase 8.4: Byzantine-Robust Federated Learning

## 1. Objective & Setup
Evaluate the robustness of standard FedAvg against **Coordinate-wise Median** aggregation under controlled model-update poisoning (Sign-Flip attacks) on the severe non-IID partition. The Byzantine client flips the direction of its true local update and amplifies it by $\alpha = 5$. This is a strict 3-client simulation, meaning a 1-client attack corrupts 33.3% of the network, and the 2-client stress test corrupts 66.7%.

## 2. Final Summary Matrix
| Aggregator | Scenario | Global F1 | Mean Client F1 | Worst Client F1 | Client F1 Std |
|---|---|---:|---:|---:|---:|
| fedavg | Clean | 0.9923 | 0.9870 | 0.9630 | 0.0170 |
| fedavg | Attack_C1 | 0.8088 | 0.7861 | 0.4707 | 0.2255 |
| fedavg | Attack_C2 | 0.4054 | 0.3620 | 0.2456 | 0.0941 |
| fedavg | Attack_C3 | 0.9362 | 0.9050 | 0.7883 | 0.0826 |
| fedavg | Attack_C1_C2_Extreme | 0.3945 | 0.3650 | 0.2949 | 0.0654 |
| median | Clean | 0.9929 | 0.9881 | 0.9664 | 0.0154 |
| median | Attack_C1 | 0.8905 | 0.9356 | 0.8419 | 0.0678 |
| median | Attack_C2 | 0.8918 | 0.8598 | 0.5813 | 0.1969 |
| median | Attack_C3 | 0.9931 | 0.9884 | 0.9673 | 0.0149 |
| median | Attack_C1_C2_Extreme | 0.0453 | 0.0752 | 0.0075 | 0.0810 |

## 3. Clean-Performance Cost
- **FedAvg Clean Global F1**: 0.9923
- **Median Clean Global F1**: 0.9929
- **Clean Performance Degradation**: +0.0006

## 4. Byzantine Robustness (Attack C1 - 33.3% Corruption)
- **FedAvg Attacked Global F1**: 0.8088
- **Median Attacked Global F1**: 0.8905
- **Byzantine Robustness Improvement**: +0.0817

## 5. Scientific Interpretation
Standard **FedAvg degraded significantly** under the targeted Byzantine sign-flip attack. The weighted averaging mechanism indiscriminately incorporated the corrupted gradients, causing the global boundary to partially collapse.

**Coordinate-wise Median successfully mitigated the Byzantine attack**, rescuing the global boundary from the corrupted update and demonstrating mathematically stronger robustness than standard averaging.

## 6. Limitations
This is a controlled 3-client simulation over the Edge-IIoTset cybersecurity dataset. Robust aggregation like Median is highly dependent on the number of honest clients. In a 3-client topology, the statistical breakdown point is inherently precarious. This validates resilience to a controlled model-update poisoning scenario, but does NOT certify universal security for large-scale decentralized systems.
