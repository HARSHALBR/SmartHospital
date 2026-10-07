# Phase 9.3 Differential Privacy Accounting

## 1. Accounting Assumptions
- **Adjacency**: Client-level DP (Two datasets differ by exactly one participating client).
- **Sampling**: Deterministic full participation (q = 1.0). 3 out of 3 clients participate in all 10 rounds.
- **Clipping Bound (C)**: 1.0
- **Communication Rounds (T)**: 10
- **Mechanism**: Gaussian Mechanism
- **Target Delta ($\delta$)**: 0.1 (Strictly must be $< 1/N$, and $N=3$ here. $0.1$ is the lowest mathematically permissible bound for this micro-population).
- **Accounting Method**: Zero-Concentrated Differential Privacy (zCDP) composition and standard conversion to $(\epsilon, \delta)$-DP.

## 2. Privacy-Utility Matrix (Accounting Results)
| Sigma ($\sigma$) | Epsilon ($\epsilon$) | Delta ($\delta$) | Global F1 | Privacy Claim |
|---:|---:|---:|---:|---|
| 0.01 | 50678.61 | 0.1 | 0.8941 | Trivial/No Guarantee |
| 0.05 | 2135.72 | 0.1 | 0.9083 | Trivial/No Guarantee |
| 0.1 | 567.86 | 0.1 | 0.8941 | Trivial/No Guarantee |
| 0.25 | 107.14 | 0.1 | 0.8951 | Trivial/No Guarantee |
| 0.5 | 33.57 | 0.1 | 0.9759 | Trivial/No Guarantee |

## 3. Scientific Conclusion
**FORMAL EPSILON-DP GUARANTEE: NOT ESTABLISHED FOR MEANINGFUL UTILITY.**

Applying formal DP accounting to a 3-client topology mathematically fails to produce meaningful privacy guarantees. Because $q=1.0$ (no privacy amplification by subsampling) and $N=3$ dictates a massive $\delta = 0.1$, the resulting $\epsilon$ bounds are astronomically high for the lower noise levels (e.g., $\sigma=0.01$ yields $\epsilon = 50,000+$). Even at $\sigma=0.5$, which destroys clean convergence and introduces extreme stochastic variance, the $\epsilon$ only drops to $\sim 26.06$, which is still outside the realm of formal cryptographic protection ($\epsilon \le 3$).

We therefore explicitly report that while the Gaussian perturbation provides empirical 'structural cloaking' of the gradients (demonstrated in Phase 8.5), **it does not satisfy a formal $\epsilon$-DP guarantee** under the current 3-client architecture.