# Phase 5: BioBERT Semantic Vectorization

## 1. Dataset Provenance
- **Original Intended Dataset**: MIMIC-IV-Note
- **Actual Development Dataset**: MTSamples
- **Source**: Public Kaggle/HuggingFace mirror
- **License**: Publicly accessible, de-identified clinical research data.
- **Records Processed**: 100 unique clinical notes.

## 2. Preprocessing & Privacy
- Basic whitespace normalization and missing value removal were performed.
- Aggressive NLP truncation (stopword removal, stemming) was **avoided** to preserve clinical nuance.
- **Privacy Mechanism**: Raw clinical text is processed strictly locally. Only the numerical vectors (`results/phase5/embeddings_*.npy`) will be transmitted or shared with subsequent multimodal or federated algorithms. Raw text is explicitly not shared.

## 3. BioBERT Model Configuration
- **Model**: `emilyalsentzer/Bio_ClinicalBERT`
- **Embedding Dimension**: 768
- **Max Token Length**: 512

## 4. Long-Note Handling Strategy
Many clinical notes significantly exceed the 512-token BERT limit. Rather than discarding crucial clinical context via simple truncation, a **Chunking Strategy** was implemented:
- **Chunk Size**: 510 tokens
- **Overlap**: 50 tokens
- **Aggregation**: Mean pooling across all chunks belonging to a single note.

## 5. Pooling Strategy Evaluation
Both `[CLS]` token pooling and `Mean` (across valid non-padding tokens) were extracted and compared.

- **Runtime**: 294.33 seconds
- **Memory**: Safe (No OOM errors via sequential batching)

**Selected Representation**: Mean Pooling.
*Justification*: The `[CLS]` token is primarily optimized for next-sentence prediction and supervised classification tasks. Mean pooling across all contextualized token representations typically yields a richer, more stable semantic vector for purely unsupervised long-document embedding.

## 6. Simulated Hospital-Client Partitioning Strategy (Future)
Since no 1:1 patient-to-IoT mapping exists, Phase 6 (Federated Learning) will adopt the following structure:
- **Hospital Client 1**: Given a subset of the Phase 4.2 Edge-IIoT graph AND a subset of the MTSamples embeddings (e.g., Surgery notes).
- **Hospital Client 2**: Given a different subset of Edge-IIoT AND a different subset of MTSamples (e.g., Psychiatry notes).
- **Goal**: Co-located multimodal training via Federated Averaging (FedAvg), without any record-level linkage.
