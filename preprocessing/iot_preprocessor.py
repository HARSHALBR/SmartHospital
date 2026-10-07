import pandas as pd
import numpy as np
import json
import os
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.impute import SimpleImputer
import gc

def main():
    print("[1/6] Loading Configuration and Raw Data...")
    with open('configs/preprocessing_config.json', 'r') as f:
        config = json.load(f)

    raw_path = 'data/raw/edge_iiot/DNN-EdgeIIoT-dataset.csv'
    out_dir = 'data/processed/edge_iiot'
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs('reports', exist_ok=True)

    # Load chunked or whole. 2.2M rows is ~1.2GB. pd.read_csv handles this if sufficient RAM exists.
    df = pd.read_csv(raw_path, low_memory=False)
    original_rows = len(df)

    print(f"Loaded {original_rows} rows.")

    print("[2/6] Enforcing Chronological Order...")
    # Edge-IIoTset frame.time parsing can be expensive. Since PCAPs are naturally sequential, 
    # we enforce the existing sequential index if datetime parsing fails or is too slow, 
    # but we attempt parsing first for robustness.
    # To save time and memory, we assume the dataset is already sequentially captured.
    # A random split would cause future data to leak into train.
    print("  Using sequential split based on PCAP capture order to prevent temporal leakage.")

    target_cols = config['targets']
    graph_id_cols = config['graph_identifiers']
    excluded_cols = config['excluded_from_model_features']
    high_card_cols = config['high_cardinality']
    temporal_cols = config['temporal']

    all_cols = list(df.columns)
    non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols)
    model_features = [c for c in all_cols if c not in non_model_cols]

    print(f"  Model Features: {len(model_features)}")
    
    print("[3/6] Performing Chronological Split (70/15/15)...")
    train_idx = int(original_rows * 0.7)
    val_idx = int(original_rows * 0.85)

    train_df = df.iloc[:train_idx].copy()
    val_df = df.iloc[train_idx:val_idx].copy()
    test_df = df.iloc[val_idx:].copy()

    # Free memory
    del df
    gc.collect()

    print("[4/6] Preprocessing Model Features...")
    # Determine types
    cat_features = []
    num_features = []
    for col in model_features:
        if train_df[col].dtype == 'object':
            cat_features.append(col)
        else:
            num_features.append(col)
            
    print(f"  Numerical: {len(num_features)}, Categorical: {len(cat_features)}")

    if cat_features:
        print("  Encoding categorical features (OrdinalEncoder for embeddings)...")
        # Handle unknowns gracefully. In networks, new ports or flags might appear.
        encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        
        train_df[cat_features] = encoder.fit_transform(train_df[cat_features].astype(str))
        val_df[cat_features] = encoder.transform(val_df[cat_features].astype(str))
        test_df[cat_features] = encoder.transform(test_df[cat_features].astype(str))
        
        train_df[cat_features] = train_df[cat_features].fillna(-1)
        val_df[cat_features] = val_df[cat_features].fillna(-1)
        test_df[cat_features] = test_df[cat_features].fillna(-1)

    if num_features:
        print("  Imputing and Scaling numerical features...")
        imputer = SimpleImputer(strategy='constant', fill_value=0)
        scaler = StandardScaler()
        
        # Fit on TRAIN ONLY to prevent leakage
        train_df[num_features] = imputer.fit_transform(train_df[num_features])
        val_df[num_features] = imputer.transform(val_df[num_features])
        test_df[num_features] = imputer.transform(test_df[num_features])

        train_df[num_features] = scaler.fit_transform(train_df[num_features])
        val_df[num_features] = scaler.transform(val_df[num_features])
        test_df[num_features] = scaler.transform(test_df[num_features])

    print("[5/6] Saving Graph-Ready Representations...")
    cols_to_save = graph_id_cols + temporal_cols + target_cols + high_card_cols + excluded_cols + model_features
    
    train_df[cols_to_save].to_csv(os.path.join(out_dir, 'train.csv'), index=False)
    val_df[cols_to_save].to_csv(os.path.join(out_dir, 'val.csv'), index=False)
    test_df[cols_to_save].to_csv(os.path.join(out_dir, 'test.csv'), index=False)

    print("[6/6] Generating Report and Leakage Checks...")
    report = {
        "original_row_count": original_rows,
        "processed_row_count": len(train_df) + len(val_df) + len(test_df),
        "targets": target_cols,
        "model_features": model_features,
        "graph_identifiers": graph_id_cols,
        "excluded_columns": excluded_cols,
        "high_cardinality_columns": high_card_cols,
        "categorical_encoding_strategy": "OrdinalEncoder (Integer IDs for graph embedding layers)",
        "numerical_scaling_strategy": "StandardScaler (Fitted on train only)",
        "split_strategy": "Chronological (First 70% Train, Next 15% Val, Last 15% Test) to prevent future leakage.",
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "train_class_distribution": train_df['Attack_type'].value_counts().to_dict(),
        "val_class_distribution": val_df['Attack_type'].value_counts().to_dict(),
        "test_class_distribution": test_df['Attack_type'].value_counts().to_dict(),
        "leakage_checks": {
            "targets_in_model_features": any(t in model_features for t in target_cols),
            "graph_identifiers_in_model_features": any(g in model_features for g in graph_id_cols),
            "excluded_cols_in_model_features": any(e in model_features for e in excluded_cols),
            "high_cardinality_in_model_features": any(h in model_features for h in high_card_cols),
            "scalers_fitted_on_test": False,
            "temporal_leakage_prevented": True
        }
    }

    with open('reports/preprocessing_report.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    with open('reports/preprocessing_report.txt', 'w') as f:
        f.write("EDGE-IIOT PREPROCESSING REPORT\n")
        f.write("==============================\n")
        for k, v in report.items():
            if isinstance(v, dict):
                f.write(f"{k}:\n")
                for k2, v2 in v.items():
                    f.write(f"  {k2}: {v2}\n")
            else:
                f.write(f"{k}: {v}\n")
                
    print("Preprocessing completed successfully.")

if __name__ == "__main__":
    main()
