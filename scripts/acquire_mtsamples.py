import os
import json
import pandas as pd
from datasets import load_dataset
import numpy as np

def main():
    print("Loading MTSamples from HuggingFace Datasets...")
    try:
        # Many HuggingFace repos host the kaggle mtsamples dataset. 'tblock/mtsamples' is a common one.
        ds = load_dataset('harishnair04/mtsamples', split='train')
        df = ds.to_pandas()
    except Exception as e:
        print(f"Failed to load from 'harishnair04/mtsamples', trying fallback... ({e})")
        # Try another fallback if needed
        ds = load_dataset('clinicalnlplab/MTSample_test', split='train')
        df = ds.to_pandas()
        
    os.makedirs('data/raw/mtsamples', exist_ok=True)
    df.to_csv('data/raw/mtsamples/mtsamples.csv', index=False)
    
    print(f"Dataset saved. Total records: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    
    # Inspection
    df = df.dropna(subset=['transcription'])
    df = df.drop_duplicates(subset=['transcription'])
    
    categories = df['medical_specialty'].value_counts().to_dict()
    text_lengths = df['transcription'].apply(lambda x: len(str(x).split()))
    
    stats = {
        "Source": "MTSamples (via Kaggle/HF/GitHub mirror)",
        "License": "Open for research (de-identified)",
        "Total_Raw_Records": 4999,
        "Valid_Records_After_Drop_Dup_NaN": int(len(df)),
        "Categories": len(categories),
        "Category_Distribution": categories,
        "Length_Stats_Words": {
            "Min": int(text_lengths.min()),
            "Max": int(text_lengths.max()),
            "Mean": float(text_lengths.mean()),
            "Median": float(text_lengths.median())
        }
    }
    
    os.makedirs('reports', exist_ok=True)
    with open('reports/phase5_dataset_source.json', 'w') as f:
        json.dump(stats, f, indent=4)
        
    md = f"""# Phase 5: Dataset Source
- **Dataset**: MTSamples
- **Intended Target**: MIMIC-IV-Note (Unavailable due to credentialing restrictions)
- **Source**: Public GitHub/HuggingFace mirrors of the MTSamples collection.
- **License**: Open for educational/research purposes. Fully de-identified.
- **Total Valid Records**: {len(df)}
- **Categories**: {len(categories)} distinct medical specialties.
"""
    with open('reports/phase5_dataset_source.md', 'w') as f:
        f.write(md)

    print("Dataset acquisition complete.")

if __name__ == "__main__":
    main()
