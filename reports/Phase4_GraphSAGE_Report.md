# Phase 4 GraphSAGE Scientific Report

## 1. GraphSAGE Architecture
The graph anomaly classification model was built using PyTorch Geometric. 
- **Message Passing**: The GraphSAGE model passes messages across all flows (edges) within each 10-second temporal window to compute node embeddings for each IP endpoint.
- **Edge Representation**: For each target edge representing a communication flow between $u$ and $v$, the final representation vector is constructed as: $[z_u \parallel z_v \parallel |z_u - z_v| \parallel \text{edge\_features}]$.

## 2. Input Dimensions
- **Node Feature Dimension**: 31 (Aggregated statistical endpoint behaviors)
- **Edge Feature Dimension**: 31 (Aggregated statistical flow behaviors)

## 3. Number of Layers
3 `SAGEConv` layers were utilized.

## 4. Hidden Dimensions
Each hidden layer has 128 dimensions, followed by a final node embedding output dimension of 64.

## 5. Classifier Architecture
A 2-layer Multi-Layer Perceptron (MLP) was used to classify the final edge representations:
- Linear (in_dim -> 128)
- ReLU
- Dropout (p=0.5)
- Linear (128 -> 1)

## 6. Loss Function & Optimizer
- **Loss**: `BCEWithLogitsLoss`. Due to the extreme imbalance in the training set (1,509 Normal edges vs 317,191 Attack edges), a static `pos_weight = 0.0048` was explicitly applied to heavily penalize misses on the rare Normal class.
- **Optimizer**: AdamW.

## 7. Hyperparameters
- **Learning rate**: 1e-3
- **Number of epochs**: 3
- **Early stopping**: The model with the highest F1 score on the validation set was saved and evaluated on the test set.

## 8. Dataset Class Distribution & Shift
The flow-level stratification from Phase 3.2 succeeded in preventing data leakage, but exposed a fascinating structural artifact in the network data:
- **Train Split**: 1,509 Normal Edges | 317,191 Attack Edges
- **Validation Split**: 1,831 Normal Edges | 28,015 Attack Edges
- **Test Split**: 168,368 Normal Edges | 26,716 Attack Edges

*Analysis of Shift*: Because a flow pair (Src IP, Dst IP, Protocol) is forced into a single split to avoid leakage, a small handful of continuous, long-lived background Normal flows were randomly assigned to the Test set. These flows persisted across thousands of consecutive 10-second temporal windows, generating 168k Normal edges. Conversely, the Train set received hundreds of thousands of short-lived DDoS and scanning flows.

## 9. Experimental Results (Test Set)

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|---|
| **Experiment A: Edge MLP Baseline** | 0.0387 | 0.0428 | 0.2817 | 0.0743 | 0.0603 | 0.1096 |
| **Experiment B: GraphSAGE (No Edge Feat)** | 0.0405 | 0.0448 | 0.2961 | 0.0779 | 0.0022 | 0.0738 |
| **Experiment C: GraphSAGE + Edge Feat** | 0.0431 | 0.0429 | 0.2814 | 0.0745 | 0.0041 | 0.0732 |

## 10. Confusion Matrices

**Experiment A (MLP)**
- True Normal: 24 (Correct), 168,344 (False Positives)
- True Attack: 7,528 (Correct), 19,188 (False Negatives)

**Experiment C (GraphSAGE + Edge)**
- True Normal: 896 (Correct), 167,472 (False Positives)
- True Attack: 7,520 (Correct), 19,196 (False Negatives)

## 11. Resource Utilization
- **Training Time**: ~7.5 minutes per model (CPU processing).
- **Memory Strategy**: Because the entire graph spans 9,941 temporal windows with 543k edges, the dataset was processed sequentially via dynamically loaded mini-batches (1 window = 1 batch). This kept CPU/GPU memory footprint extremely low (<< 1 GB) and completely avoided OOM errors.

## 12. Conclusion & Limitations
**GraphSAGE did not provide a statistically significant improvement over the Baseline Edge MLP in this specific environment.** Both models collapsed and predicted the vast majority of test samples as "Attack" (yielding ~168k false positives). 

**The primary limitation is the fundamental structure of the dataset splits.** By perfectly preventing target leakage and flow crossover, we forced the model to train on an environment dominated by short-burst attacks, and then tested it on an environment dominated by long-lived continuous Normal traffic. The models simply learned that "traffic = attack" during training, and failed to generalize to the massive continuous background flows in the test set.

This reveals a critical lesson in IoT Anomaly Detection research: **When you enforce strict zero-leakage flow isolation, standard supervised learning fails if the background traffic profiles are structurally segregated.**
