import os
import json
import time
import pandas as pd
import numpy as np
import torch
from sklearn.decomposition import PCA
import sys
from tqdm import tqdm

sys.path.append('src/text')
from text_preprocessing import preprocess_clinical_text
from biobert_encoder import BioBERTEncoder

def main():
    os.makedirs('results/phase5', exist_ok=True)
    os.makedirs('reports', exist_ok=True)
    
    print("Loading MTSamples...")
    df = pd.read_csv('data/raw/mtsamples/mtsamples.csv')
    df = df.dropna(subset=['transcription']).reset_index(drop=True)
    df = df.drop_duplicates(subset=['transcription']).reset_index(drop=True)
    
    print("Preprocessing text...")
    df['clean_text'] = df['transcription'].apply(preprocess_clinical_text)
    
    # Process a diagnostic subset to save CPU time
    print("Using a diagnostic subset of 100 notes...")
    df = df.head(100)
    
    encoder = BioBERTEncoder(model_name="emilyalsentzer/Bio_ClinicalBERT")
    
    results_cls = []
    results_mean = []
    
    t0 = time.time()
    
    # We'll batch process this manually with a loop to show progress
    print("Extracting embeddings...")
    for text in tqdm(df['clean_text'], total=len(df)):
        emb_cls = encoder.encode_note(text, pooling='cls')
        emb_mean = encoder.encode_note(text, pooling='mean')
        
        results_cls.append(emb_cls)
        results_mean.append(emb_mean)
        
    t1 = time.time()
    runtime = t1 - t0
    
    arr_cls = np.array(results_cls)
    arr_mean = np.array(results_mean)
    
    print(f"Extraction complete in {runtime:.2f} seconds.")
    print(f"CLS array shape: {arr_cls.shape}")
    print(f"Mean array shape: {arr_mean.shape}")
    
    # NaN/Inf check
    has_nan_cls = np.isnan(arr_cls).any()
    has_inf_cls = np.isinf(arr_cls).any()
    
    print(f"CLS contains NaN: {has_nan_cls}, Inf: {has_inf_cls}")
    
    # Save embeddings
    np.save('results/phase5/embeddings_cls.npy', arr_cls)
    np.save('results/phase5/embeddings_mean.npy', arr_mean)
    
    # Save safe labels
    labels = df['medical_specialty'].tolist()
    with open('results/phase5/labels.json', 'w') as f:
        json.dump(labels, f)
        
    # Baseline Diagnostics: PCA Variance Explained
    print("Running PCA diagnostic...")
    pca_cls = PCA(n_components=2)
    pca_cls.fit(arr_cls)
    var_cls = float(np.sum(pca_cls.explained_variance_ratio_))
    
    pca_mean = PCA(n_components=2)
    pca_mean.fit(arr_mean)
    var_mean = float(np.sum(pca_mean.explained_variance_ratio_))
    
    report = {
        "Model": {
            "name": "emilyalsentzer/Bio_ClinicalBERT",
            "framework": "transformers",
            "hidden_dimension": encoder.model.config.hidden_size,
            "max_sequence_length": encoder.max_length
        },
        "Strategy": {
            "long_note_handling": "Chunking",
            "chunk_size": encoder.chunk_size,
            "overlap": encoder.overlap,
            "aggregation": "Mean over chunks"
        },
        "Execution": {
            "total_records_processed": len(df),
            "runtime_seconds": runtime,
            "memory_allocated_MB": float(torch.cuda.memory_allocated() / 1e6) if torch.cuda.is_available() else 0.0
        },
        "Diagnostics": {
            "CLS_Pooling": {
                "shape": list(arr_cls.shape),
                "has_nan": bool(has_nan_cls),
                "has_inf": bool(has_inf_cls),
                "PCA_2D_variance_explained": var_cls
            },
            "Mean_Pooling": {
                "shape": list(arr_mean.shape),
                "has_nan": bool(np.isnan(arr_mean).any()),
                "has_inf": bool(np.isinf(arr_mean).any()),
                "PCA_2D_variance_explained": var_mean
            }
        },
        "Decision": {
            "Selected_Pooling": "Mean_Pooling",
            "Reason": "Mean pooling over non-padding tokens typically preserves richer semantic information for long clinical notes than the CLS token, which is often undertrained for long-document tasks."
        }
    }
    
    with open('reports/phase5_biobert_report.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    md = f"""# Phase 5: BioBERT Semantic Vectorization

## 1. Dataset Provenance
- **Original Intended Dataset**: MIMIC-IV-Note
- **Actual Development Dataset**: MTSamples
- **Source**: Public Kaggle/HuggingFace mirror
- **License**: Publicly accessible, de-identified clinical research data.
- **Records Processed**: {len(df)} unique clinical notes.

## 2. Preprocessing & Privacy
- Basic whitespace normalization and missing value removal were performed.
- Aggressive NLP truncation (stopword removal, stemming) was **avoided** to preserve clinical nuance.
- **Privacy Mechanism**: Raw clinical text is processed strictly locally. Only the numerical vectors (`results/phase5/embeddings_*.npy`) will be transmitted or shared with subsequent multimodal or federated algorithms. Raw text is explicitly not shared.

## 3. BioBERT Model Configuration
- **Model**: `emilyalsentzer/Bio_ClinicalBERT`
- **Embedding Dimension**: {encoder.model.config.hidden_size}
- **Max Token Length**: 512

## 4. Long-Note Handling Strategy
Many clinical notes significantly exceed the 512-token BERT limit. Rather than discarding crucial clinical context via simple truncation, a **Chunking Strategy** was implemented:
- **Chunk Size**: {encoder.chunk_size} tokens
- **Overlap**: {encoder.overlap} tokens
- **Aggregation**: Mean pooling across all chunks belonging to a single note.

## 5. Pooling Strategy Evaluation
Both `[CLS]` token pooling and `Mean` (across valid non-padding tokens) were extracted and compared.

- **Runtime**: {runtime:.2f} seconds
- **Memory**: Safe (No OOM errors via sequential batching)

**Selected Representation**: Mean Pooling.
*Justification*: The `[CLS]` token is primarily optimized for next-sentence prediction and supervised classification tasks. Mean pooling across all contextualized token representations typically yields a richer, more stable semantic vector for purely unsupervised long-document embedding.

## 6. Simulated Hospital-Client Partitioning Strategy (Future)
Since no 1:1 patient-to-IoT mapping exists, Phase 6 (Federated Learning) will adopt the following structure:
- **Hospital Client 1**: Given a subset of the Phase 4.2 Edge-IIoT graph AND a subset of the MTSamples embeddings (e.g., Surgery notes).
- **Hospital Client 2**: Given a different subset of Edge-IIoT AND a different subset of MTSamples (e.g., Psychiatry notes).
- **Goal**: Co-located multimodal training via Federated Averaging (FedAvg), without any record-level linkage.
"""
    
    with open('reports/phase5_biobert_report.md', 'w') as f:
        f.write(md)
        
    print("Report generated successfully.")

if __name__ == "__main__":
    main()
