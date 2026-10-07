import os
import json
import time
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from sklearn.decomposition import PCA
import sys
from tqdm import tqdm

sys.path.append('src/text')
from text_preprocessing import preprocess_clinical_text
from biobert_encoder import BioBERTEncoder

class ChunkDataset(Dataset):
    def __init__(self, chunks):
        self.chunks = chunks
        
    def __len__(self):
        return len(self.chunks)
        
    def __getitem__(self, idx):
        return torch.tensor(self.chunks[idx], dtype=torch.long)

def collate_chunks(batch):
    # Padding to max length in batch
    max_len = max(len(c) for c in batch)
    padded = []
    masks = []
    for c in batch:
        pad_len = max_len - len(c)
        padded.append(torch.cat([c, torch.zeros(pad_len, dtype=torch.long)]))
        masks.append(torch.cat([torch.ones(len(c), dtype=torch.long), torch.zeros(pad_len, dtype=torch.long)]))
    return torch.stack(padded), torch.stack(masks)

def main():
    os.makedirs('results/phase6_1', exist_ok=True)
    os.makedirs('reports', exist_ok=True)
    
    print("Loading MTSamples...")
    df = pd.read_csv('data/raw/mtsamples/mtsamples.csv')
    df = df.dropna(subset=['transcription']).reset_index(drop=True)
    df = df.drop_duplicates(subset=['transcription']).reset_index(drop=True)
    
    print(f"Total notes to process: {len(df)}")
    
    print("Preprocessing text...")
    df['clean_text'] = df['transcription'].apply(preprocess_clinical_text)
    
    encoder = BioBERTEncoder(model_name="emilyalsentzer/Bio_ClinicalBERT")
    
    print("Tokenizing and chunking all notes...")
    note_to_chunk_indices = []
    all_chunks = []
    
    t0 = time.time()
    
    for text in tqdm(df['clean_text']):
        if not text.strip():
            note_to_chunk_indices.append([])
            continue
            
        tokens = encoder.tokenizer(text, truncation=False, return_tensors="pt", add_special_tokens=True)
        input_ids = tokens['input_ids'][0].tolist()
        
        if len(input_ids) <= encoder.max_length:
            chunks = [input_ids]
        else:
            chunks = encoder.chunk_tokens(input_ids)
            
        start_idx = len(all_chunks)
        all_chunks.extend(chunks)
        end_idx = len(all_chunks)
        note_to_chunk_indices.append(list(range(start_idx, end_idx)))
        
    print(f"Generated {len(all_chunks)} total chunks from {len(df)} notes.")
    
    # Optimize for CPU
    torch.set_num_threads(8)
    
    chunk_dataset = ChunkDataset(all_chunks)
    loader = DataLoader(chunk_dataset, batch_size=4, shuffle=False, collate_fn=collate_chunks, num_workers=0)
    
    chunk_embeddings = []
    print("Extracting chunk embeddings via batched CPU inference...")
    
    with torch.no_grad():
        for batch_ids, batch_mask in tqdm(loader):
            batch_ids = batch_ids.to(encoder.device)
            batch_mask = batch_mask.to(encoder.device)
            
            outputs = encoder.model(input_ids=batch_ids, attention_mask=batch_mask)
            
            # Mean pooling over valid tokens for each item in batch
            for i in range(len(batch_ids)):
                valid_len = batch_mask[i].sum().item()
                # Exclude CLS (0) and SEP (valid_len-1)
                slice_len = max(1, valid_len - 2)
                if slice_len > 0:
                    emb = outputs.last_hidden_state[i, 1:1+slice_len, :].mean(dim=0).cpu().numpy()
                else:
                    emb = outputs.last_hidden_state[i, 0, :].cpu().numpy() # fallback to CLS
                chunk_embeddings.append(emb)
                
    print("Aggregating chunks back into note embeddings...")
    final_embeddings = []
    empty_emb = np.zeros(encoder.model.config.hidden_size, dtype=np.float32)
    
    for indices in note_to_chunk_indices:
        if not indices:
            final_embeddings.append(empty_emb)
        else:
            note_embs = [chunk_embeddings[i] for i in indices]
            final_embeddings.append(np.mean(note_embs, axis=0))
            
    final_embeddings = np.array(final_embeddings)
    runtime = time.time() - t0
    
    print(f"Extraction complete in {runtime:.2f} seconds.")
    print(f"Final array shape: {final_embeddings.shape}")
    
    np.save('results/phase6_1/embeddings_mean.npy', final_embeddings)
    
    labels = df['medical_specialty'].tolist()
    with open('results/phase6_1/labels.json', 'w') as f:
        json.dump(labels, f)
        
    print("Execution complete. (Batched implementation saved)")

if __name__ == "__main__":
    main()
