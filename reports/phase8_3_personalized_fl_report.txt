# Phase 8.3: Personalized Federated Learning under Severe Non-IID

## 1. Objective & Motivation
Phase 8.1 showed that under Severe non-IID partitions, worst-client performance drops and client-variance increases. Phase 8.2 proved that restricting weight drift (FedProx) did not successfully recover local utility. The objective of Phase 8.3 is to determine if **Local Personalization** (fine-tuning the global FedAvg model purely on local data without server transmission) can improve worst-client F1 without harming global anomaly detection.

## 2. Methodology & Experimental Setup
- **Data Partition**: Exactly the Severe non-IID split from Phase 8.1.
- **Baseline**: Standard FedAvg over 10 communication rounds (1 local epoch per round).
- **Personalization**: Head-only fine-tuning (freezing layer 0, training the output projection head). The optimal number of local personalization epochs $E \in \{1, 3, 5\}$ was strictly selected using local **validation** subsets.
- **Fairness**: Personalized models are only evaluated on their respective client's held-out test data. Global F1 represents the aggregation of all isolated personalized test results.

**Validation-Selected Hyperparameters**: Optimal local personalization epochs = **5**.

## 3. Global & Aggregate Robustness Metrics
| Metric | FedAvg | Personalized FL | $\Delta$ |
|---|---:|---:|---:|
| Global F1 | 0.9923 | 0.9928 | +0.0005 |
| Mean Client F1 | 0.9870 | 0.9878 | +0.0008 |
| Worst Client F1 | 0.9630 | 0.9653 | +0.0024 |
| Client F1 Std | 0.0170 | 0.0159 | -0.0011 |
| Global Precision | 0.9848 | 0.9872 | +0.0024 |
| Global Recall | 1.0000 | 0.9985 | -0.0015 |
| Global PR-AUC | 0.9890 | 0.9878 | -0.0012 |
| Global ROC-AUC | 0.9869 | 0.9836 | -0.0033 |

## 4. Per-Client Performance Metrics
| Client | FedAvg F1 | Personalized F1 | Improvement |
|---|---:|---:|---:|
| Client 1.0 | 0.9981 | 0.9981 | +0.0000 |
| Client 2.0 | 0.9630 | 0.9653 | +0.0024 |
| Client 3.0 | 1.0000 | 1.0000 | +0.0000 |

## 5. Client Parameter Drift
| Client | $L_2$ Divergence ($||w_{pers} - w_{global}||_2$) |
|---|---:|
| Client 1.0 | 2.8718 |
| Client 2.0 | 3.4114 |
| Client 3.0 | 3.3855 |

## 6. Scientific Interpretation
Personalized FL provided **no meaningful recovery** for the worst-case client. The local fine-tuning merely caused the classifier head to mathematically overfit the skewed distribution, failing to extract fundamentally better boundaries. Severe data-starvation dominates the performance ceiling, which cannot be patched purely by localized gradient descent.

## 7. Limitations & Recommendations
The primary limitation is that head-only personalization on a shallow EdgeMLP provides limited degrees of freedom for structural boundary warping. Future steps should evaluate whether architectural changes (like adding depth) or data-level augmentation (like synthetic oversampling) resolve the structural starvation that personalization could not fix.
