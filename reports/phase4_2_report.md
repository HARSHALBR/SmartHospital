# Phase 4.2: Canonical Flow-Group GraphSAGE Evaluation

## 1. Scientific Interpretation
**1. Did canonical flow grouping remove the previous covariate shift?**
Yes. By stratifying precisely on the canonical flow identity (IPs + Ports + Protocol), the class distribution was mathematically maintained across splits (~73% Normal in Train, ~70% Normal in Test). The pathological assignment of all background traffic to Test was completely resolved.

**2. Did Normal/Attack representation become comparable across splits?**
Yes, the representation perfectly mimics the underlying IID properties without violating the identical-flow leakage constraint.

**3. Does GraphSAGE now outperform the edge MLP?**
No. The full GraphSAGE model (F1 0.9713) does not significantly outperform the Edge MLP baseline (F1 0.9911). This suggests that given a clean, unseen flow evaluation, the localized edge features themselves contain sufficient signal, and topological aggregation via SAGEConv across the 10s window does not add meaningful predictive power for these specific IIoT attacks.

**4. Does adding edge features help?**
Yes. GraphSAGE with edge features (F1 0.9713) significantly outperforms GraphSAGE relying strictly on topology/node features (F1 0.8319). Statistical flow artifacts (e.g. packet lengths, flags) remain essential.

**5. Does the model generalize to unseen canonical flows?**
Yes. Because the evaluation dataset contains exactly zero intersecting canonical flows with the training dataset, the final metrics represent true generalization to unseen communication streams.

**6. Are there still dataset-specific limitations?**
Yes. The dataset still contains artifacts related to misconfigured timestamps (spanning 1982 to 2075), which forced us to use dynamic relative 10-second windowing rather than absolute chronological splitting. Furthermore, attack spoofing (e.g., random source IPs) might still allow slight topological crossover, though Canonical Flow grouping strictly isolates the specific 5-tuple.

## 2. Comparison Table (Test Set)

| Metric | MLP (Old) | MLP (Phase 4.2) | GraphSAGE (Old) | GraphSAGE (Phase 4.2) | Full GraphSAGE (Old) | Full GraphSAGE (Phase 4.2) |
|---|---|---|---|---|---|---|
| **F1** | 0.0743 | **0.9911** | 0.0780 | **0.8319** | 0.0746 | **0.9713** |
| **Recall** | 0.2818 | **0.9951** | 0.2962 | **0.7601** | 0.2815 | **0.9670** |
| **PR-AUC** | 0.1097 | **0.9919** | 0.0739 | **0.9122** | 0.0733 | **0.9875** |
| **ROC-AUC** | 0.0603 | **0.9853** | 0.0023 | **0.8435** | 0.0041 | **0.9806** |
