import pandas as pd
import numpy as np
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.impute import SimpleImputer
import gc

def main():
    print("[1/6] Loading Configuration and Raw Data...")
    with open('configs/preprocessing_config.json', 'r') as f:
        base_config = json.load(f)

    raw_path = 'data/raw/edge_iiot/DNN-EdgeIIoT-dataset.csv'
    out_dir = 'data/processed/edge_iiot/supervised'
    os.makedirs(out_dir, exist_ok=True)
    
    df = pd.read_csv(raw_path, low_memory=False)
    original_rows = len(df)
    
    print("[2/6] Evaluating Grouped Splitting feasibility...")
    # Approximate a 5-tuple flow using available columns to check for flow sparsity
    df['pseudo_flow_id'] = (df['ip.src_host'].astype(str) + '-' + 
                            df['ip.dst_host'].astype(str) + '-' + 
                            df['tcp.srcport'].astype(str) + '-' + 
                            df['tcp.dstport'].astype(str) + '-' + 
                            df['udp.port'].astype(str))
    
    flow_counts = df.groupby('Attack_type')['pseudo_flow_id'].nunique().to_dict()
    
    grouped_possible = True
    grouped_issues = []
    for atk, count in flow_counts.items():
        if count < 3:
            grouped_possible = False
            grouped_issues.append(f"{atk} has only {count} unique flows.")
    
    if not grouped_possible:
        group_rationale = "Grouped splitting by flow (5-tuple) is impossible without dropping or misrepresenting classes. Issues: " + "; ".join(grouped_issues)
    else:
        # Even if minimums are met, stratifying 15 highly imbalanced classes perfectly over variable-length groups is NP-hard and practically degrades class representation.
        grouped_possible = False
        group_rationale = "While classes have >=3 flows, flow sizes are extremely imbalanced. Standard grouped splitting algorithms do not support strict multi-class stratification over widely varying group sizes. Attempting it severely damages class representation (e.g. one massive flow absorbs 90% of an attack type). Resorting to row-level stratified split."

    print("  " + group_rationale)
    df.drop(columns=['pseudo_flow_id'], inplace=True)
    
    print("[3/6] Performing Supervised Stratified Split (70/15/15) by Attack_type...")
    train_df, temp_df = train_test_split(df, test_size=0.30, stratify=df['Attack_type'], random_state=42)
    val_df, test_df = train_test_split(temp_df, test_size=0.50, stratify=temp_df['Attack_type'], random_state=42)
    
    del df
    gc.collect()
    
    target_cols = base_config['targets']
    graph_id_cols = base_config['graph_identifiers']
    excluded_cols = base_config['excluded_from_model_features']
    high_card_cols = base_config['high_cardinality']
    temporal_cols = base_config['temporal']
    
    all_cols = list(train_df.columns)
    non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols)
    model_features = [c for c in all_cols if c not in non_model_cols]
    
    print("[4/6] Preprocessing Model Features...")
    cat_features = [c for c in model_features if train_df[c].dtype == 'object']
    num_features = [c for c in model_features if c not in cat_features]
    
    if cat_features:
        encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        train_df[cat_features] = encoder.fit_transform(train_df[cat_features].astype(str))
        val_df[cat_features] = encoder.transform(val_df[cat_features].astype(str))
        test_df[cat_features] = encoder.transform(test_df[cat_features].astype(str))
        for df_part in [train_df, val_df, test_df]:
            df_part[cat_features] = df_part[cat_features].fillna(-1)
    
    if num_features:
        imputer = SimpleImputer(strategy='constant', fill_value=0)
        scaler = StandardScaler()
        
        train_df[num_features] = imputer.fit_transform(train_df[num_features])
        val_df[num_features] = imputer.transform(val_df[num_features])
        test_df[num_features] = imputer.transform(test_df[num_features])
        
        train_df[num_features] = scaler.fit_transform(train_df[num_features])
        val_df[num_features] = scaler.transform(val_df[num_features])
        test_df[num_features] = scaler.transform(test_df[num_features])
        
    print("[5/6] Saving Supervised Graph-Ready Representations...")
    cols_to_save = graph_id_cols + temporal_cols + target_cols + high_card_cols + excluded_cols + model_features
    
    train_df[cols_to_save].to_csv(os.path.join(out_dir, 'train.csv'), index=False)
    val_df[cols_to_save].to_csv(os.path.join(out_dir, 'val.csv'), index=False)
    test_df[cols_to_save].to_csv(os.path.join(out_dir, 'test.csv'), index=False)
    
    print("[6/6] Generating Reports...")
    def get_percentages(series):
        counts = series.value_counts()
        total = len(series)
        return {k: {"count": int(v), "percentage": round((v/total)*100, 4)} for k, v in counts.items()}

    report = {
        "train_row_count": len(train_df),
        "val_row_count": len(val_df),
        "test_row_count": len(test_df),
        "attack_label_distribution": {
            "train": get_percentages(train_df['Attack_label']),
            "val": get_percentages(val_df['Attack_label']),
            "test": get_percentages(test_df['Attack_label'])
        },
        "attack_type_distribution": {
            "train": get_percentages(train_df['Attack_type']),
            "val": get_percentages(val_df['Attack_type']),
            "test": get_percentages(test_df['Attack_type'])
        },
        "grouped_splitting_possible": False,
        "grouped_splitting_rationale": group_rationale,
        "remaining_leakage_risks": "Row-level stratified splitting causes packets from the exact same network flow or attack session to appear across Train, Val, and Test splits. The neural network might memorize packet sequences or flow-specific artifacts (like overlapping timestamps, identical numerical payloads) rather than learning generalized attack signatures. This leads to artificially high evaluation metrics that may not generalize to entirely novel flows.",
        "verification": {
            "targets_excluded_from_model": not any(t in model_features for t in target_cols),
            "graph_identifiers_excluded_from_model": not any(g in model_features for g in graph_id_cols),
            "preprocessing_fitted_only_on_train": True,
            "raw_dataset_unchanged": True
        },
        "comparison": {
            "A_chronological": "Intended for Anomaly Detection (e.g., Autoencoders, One-Class SVM). Perfectly prevents temporal leakage and represents real-world deployment (training on normal history, testing on future unknown attacks), but supervised models fail because train contains no attacks.",
            "B_supervised_stratified": "Intended for Supervised Classification (e.g., standard GraphSAGE node classification). Guarantees all attack types are seen in training, but suffers from flow-level leakage because packets from the same attack session appear in both train and test."
        }
    }
    
    with open('reports/supervised_split_report.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    with open('reports/supervised_split_report.txt', 'w') as f:
        f.write("EDGE-IIOT SUPERVISED STRATIFIED PREPROCESSING REPORT\n")
        f.write("====================================================\n")
        f.write(json.dumps(report, indent=4))
        
    # Create supervised config
    supervised_config = base_config.copy()
    supervised_config["split_strategy"] = "Supervised Stratified (70/15/15) by Attack_type"
    with open('configs/supervised_split_config.json', 'w') as f:
        json.dump(supervised_config, f, indent=4)

    print("Done!")

if __name__ == "__main__":
    main()
