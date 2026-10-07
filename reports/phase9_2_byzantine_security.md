# Phase 9.2: Byzantine Security Consolidation

## 1. Attack Model (Threat Model B)
- **Attacker**: Malicious client
- **Action**: Model-update poisoning via sign-flip attack
- **Implementation**: The malicious client intercepts the normal gradient $\Delta_k$, multiplies it by a negative constant ($\alpha = 5$), and sends the corrupted $\Delta_{byz} = -5 \cdot \Delta_k$ to the aggregator.

## 2. Aggregation Mechanics
- **FedAvg**: $w = \sum rac{n_k}{n} w_k$ (Vulnerable to outliers, heavily skews the boundary)
- **Coordinate-wise Median**: Evaluates each parameter dimension individually and strictly selects the 50th percentile value, discarding extreme outliers.

## 3. Results (Demonstrated Controlled Poisoning Resilience)
| Aggregator | Scenario | Malicious Clients | Global F1 | Worst Client F1 |
|---|---|---:|---:|---:|
| FedAvg | Clean | 0/3 | 0.9923 | 0.9630 |
| Median | Clean | 0/3 | 0.9929 | 0.9664 |
| FedAvg | Client 1 Malicious | 1/3 (33%) | 0.8088 | 0.4707 |
| Median | Client 1 Malicious | 1/3 (33%) | 0.8905 | 0.8419 |
| FedAvg | Client 2 Malicious | 1/3 (33%) | 0.4054 | 0.2456 |
| Median | Client 2 Malicious | 1/3 (33%) | 0.8918 | 0.5813 |
| FedAvg | Client 3 Malicious | 1/3 (33%) | 0.9362 | 0.7883 |
| Median | Client 3 Malicious | 1/3 (33%) | 0.9931 | 0.9673 |
| FedAvg | C1+C2 Malicious | 2/3 (66%) | 0.3945 | 0.2949 |
| Median | C1+C2 Malicious | 2/3 (66%) | 0.0453 | 0.0075 |

## 4. Scientific Conclusion
The Coordinate-wise Median effectively mitigated the 33% minority attack, proving its resilience as a robust aggregator against controlled sign-flip poisoning. For example, it rescued the Global F1 from 0.4054 (FedAvg) back up to 0.8918 under the Client 2 attack. However, it structurally collapses under the extreme 66% malicious majority, as mathematically expected. We DO NOT claim that Coordinate-wise Median is Byzantine-proof against all arbitrary attacks, only that it provides demonstrated mitigation against minority targeted sign-flips.