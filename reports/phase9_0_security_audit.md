# Phase 9.0 Security Audit

## 1. Existing Security & Privacy Components Discovered
- **Data Locality**: Implicit in Phase 7/8 FedAvg loop (data loaded per client ID). No strict code boundary verification yet.
- **Byzantine Robustness**: Coordinate-wise Median aggregation defending against -5x sign-flip attacks (Phase 8.4).
- **Differential Privacy**: Preliminary Gaussian perturbation of client updates with L2 clipping at C=1.0 (Phase 8.5).
- **FedProx**: Proximal regularization to limit local parameter drift (Phase 8.2).

## 2. Missing Phase 9 Components
- **Data Locality Audit**: Static and runtime tests verifying no raw data leaks to the server.
- **Secure Aggregation**: Simulation of additive/pairwise masking of client updates before server aggregation.
- **Privacy Accounting**: Formal RDP/Gaussian DP accounting to compute epsilon/delta for Phase 8.5.
- **Attack Surface Matrix**: Formal threat modeling covering membership inference, reconstruction, and curious servers.

## 3. Files & Scripts to be Reused
- experiments/train_phase8_4.py (Byzantine logic)
- experiments/train_phase8_5.py (DP logic)
- results/phase8_4/summary.csv (Byzantine metrics)
- results/phase8_5/summary.csv (DP metrics)

## 4. Proposed Phase 9 Execution Order
1. Data Locality Audit (Tests + Report)
2. Secure Aggregation Simulation (Implementation + Tests + Overhead Metrics)
3. DP Privacy Accounting Evaluation (Formal epsilon bounds if valid)
4. Attack-Surface Matrix & Privacy-Utility Matrix Compilation
5. Final Phase 9 Report Generation

## 5. Estimated Computational Cost
Low-to-Medium. Secure aggregation overhead test involves minimal training (1-2 epochs). DP accounting requires zero training. We reuse verified Byzantine/DP metrics.

## 6. Scientific Concerns
- DP Accounting: Phase 8.5 clipping (C=1.0) was strictly applied across all configurations, acting as a massive learning rate decay. DP bounds with 3 clients will likely yield trivial/infinite epsilon values.
- Secure Aggregation: Additive masking is purely a mathematical simulation here; real SecAgg requires complex cryptography (e.g. Shamir's Secret Sharing) which is out of scope.
- MTSamples: Acknowledged as a proxy, embeddings are institutional and shouldn't be claimed to defend against direct patient inference in this phase.
