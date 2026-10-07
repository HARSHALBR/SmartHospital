# Phase 4.1 Data Split Analysis

## 1. Analysis of the Phase 3.2 Coarse Split
In Phase 3.2, the split was performed based on `SrcIP-DstIP-Protocol`. Because ports were excluded, ALL traffic between two IPs over a specific protocol collapsed into a single identity. One such pair contained virtually all background Normal IIoT traffic, acting as a single massive 'flow group' that got entirely assigned to the Test set. This completely skewed the Test split (which received almost all Normal traffic) vs the Train split (which received most DDoS traffic).

## 2. Split Strategy Results
### Split_A_Phase3_2_Coarse
- Train: Normal=0.6% | Attack=99.4%
- Val  : Normal=89.8% | Attack=10.2%
- Test : Normal=98.0% | Attack=2.0%
- Identical Flow Overlap (Train/Test): 0
- IP Endpoint Overlap (Train/Test): 5

### Split_B_Canonical_Flow
- Train: Normal=73.8% | Attack=26.2%
- Val  : Normal=69.5% | Attack=30.5%
- Test : Normal=70.2% | Attack=29.8%
- Identical Flow Overlap (Train/Test): 0
- IP Endpoint Overlap (Train/Test): 265

### Split_C_IID_Row_Level
- Train: Normal=72.8% | Attack=27.2%
- Val  : Normal=72.8% | Attack=27.2%
- Test : Normal=72.8% | Attack=27.2%
- Identical Flow Overlap (Train/Test): 59210
- IP Endpoint Overlap (Train/Test): 300

## 3. Scientific Interpretation
- **IID Row Level (Split C)**: Perfect class balance, but massive target leakage because the exact same flow identity is present in both Train and Test. Does not answer if the model generalizes to new flows.
- **Coarse IP-Protocol Split (Split A)**: 0 flow leakage, but ruins class distribution due to huge macro-flows. Answers if the model generalizes to entirely unseen host pairs.
- **Canonical Flow Identity (Split B)**: Stratifies based on exact port-aware flows. Maintains 0 train/test overlap of communication streams, while hopefully allowing the model to see Normal flows distributed correctly across splits.

## 4. Proposed Experiment Structure
**Primary Evaluation**: Stratified Canonical Flow-Group Split (Split B). This prevents identically repeated communication streams from being memorized, while mathematically attempting to balance classes across splits. This allows evaluation on strictly unseen logical sessions while maintaining structural integrity.
