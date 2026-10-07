import pandas as pd
import numpy as np
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.impute import SimpleImputer
import gc

def get_protocol(row):
    if pd.notna(row.get('tcp.srcport')) and row.get('tcp.srcport') != -1:
        return 'TCP'
    elif pd.notna(row.get('udp.port')) and row.get('udp.port') != -1:
        return 'UDP'
    elif pd.notna(row.get('icmp.seq_le')) and row.get('icmp.seq_le') != -1:
        return 'ICMP'
    return 'OTHER'

def compute_multiclass_label(labels):
    unique_labels = set(labels)
    if unique_labels == {'Normal'}:
        return 'Normal'
    elif 'Normal' in unique_labels:
        return 'MIXED_ATTACK'
    else:
        if len(unique_labels) == 1:
            return list(unique_labels)[0]
        return 'MIXED_ATTACK'

def main():
    print("[1/6] Loading Configuration and Raw Data...")
    with open('configs/preprocessing_config.json', 'r') as f:
        base_config = json.load(f)

    raw_path = 'data/raw/edge_iiot/DNN-EdgeIIoT-dataset.csv'
    out_dir = 'data/processed/edge_iiot/phase3_2'
    os.makedirs(out_dir, exist_ok=True)
    
    df = pd.read_csv(raw_path, low_memory=False)
    
    # Fill missing identifiers safely for grouping
    df['ip.src_host'] = df['ip.src_host'].fillna('unknown')
    df['ip.dst_host'] = df['ip.dst_host'].fillna('unknown')
    
    print("[2/6] Evaluating Flow-Level Splitting...")
    # Determine protocol for splitting
    df['protocol'] = df.apply(get_protocol, axis=1)
    
    # Create an IP-pair-protocol identifier (bidirectional to avoid same pair across splits)
    def make_pair(row):
        ips = sorted([str(row['ip.src_host']), str(row['ip.dst_host'])])
        return f"{ips[0]}-{ips[1]}-{row['protocol']}"
        
    df['flow_pair'] = df.apply(make_pair, axis=1)
    
    # Group by flow_pair to get the "dominant" label for stratification
    flow_groups = df.groupby('flow_pair')['Attack_type'].apply(list).reset_index()
    flow_groups['flow_label'] = flow_groups['Attack_type'].apply(compute_multiclass_label)
    
    # Stratify by the flow's label. If a label has < 2 samples, group it into a 'RARE' category or skip stratify for it
    counts = flow_groups['flow_label'].value_counts()
    valid_stratify_labels = counts[counts >= 3].index
    flow_groups['strat_label'] = flow_groups['flow_label'].apply(lambda x: x if x in valid_stratify_labels else 'RARE')
    
    print("[3/6] Performing Supervised Flow-Level Split (70/15/15)...")
    train_flows, temp_flows = train_test_split(
        flow_groups, test_size=0.30, stratify=flow_groups['strat_label'], random_state=42
    )
    
    # Re-evaluate stratification labels for the second split
    temp_counts = temp_flows['strat_label'].value_counts()
    valid_temp_labels = temp_counts[temp_counts >= 2].index
    temp_flows = temp_flows.copy()
    temp_flows['strat_label'] = temp_flows['strat_label'].apply(lambda x: x if x in valid_temp_labels else 'RARE')
    
    val_flows, test_flows = train_test_split(
        temp_flows, test_size=0.50, stratify=temp_flows['strat_label'], random_state=42
    )
    
    train_pairs = set(train_flows['flow_pair'])
    val_pairs = set(val_flows['flow_pair'])
    test_pairs = set(test_flows['flow_pair'])
    
    train_mask = df['flow_pair'].isin(train_pairs)
    val_mask = df['flow_pair'].isin(val_pairs)
    test_mask = df['flow_pair'].isin(test_pairs)
    
    train_df = df[train_mask].copy()
    val_df = df[val_mask].copy()
    test_df = df[test_mask].copy()
    
    df = None
    gc.collect()
    
    target_cols = base_config['targets']
    graph_id_cols = base_config['graph_identifiers']
    excluded_cols = base_config['excluded_from_model_features']
    high_card_cols = base_config['high_cardinality']
    temporal_cols = base_config['temporal']
    
    all_cols = list(train_df.columns)
    
    # Remove leakage cols from features (from spec)
    leakage_cols = [
        'Attack_label', 'Attack_type', 'ip.src_host', 'ip.dst_host', 
        'tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream', 
        'icmp.seq_le', 'frame.time', 'tcp.seq', 'tcp.ack', 'tcp.ack_raw', 
        'icmp.checksum', 'tcp.checksum', 'arp.src.proto_ipv4', 'arp.dst.proto_ipv4'
    ]
    
    non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols + leakage_cols + ['protocol', 'flow_pair'])
    model_features = [c for c in all_cols if c not in non_model_cols and pd.api.types.is_numeric_dtype(train_df[c])]
    
    print("[4/6] Preprocessing Model Features...")
    num_features = model_features # all allowed features are numeric/boolean
    
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
    # Keep the identifiers for graph builder
    cols_to_save = ['ip.src_host', 'ip.dst_host', 'tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream', 'icmp.seq_le', 'frame.time', 'Attack_label', 'Attack_type'] + model_features
    
    train_df[cols_to_save].to_csv(os.path.join(out_dir, 'train.csv'), index=False)
    val_df[cols_to_save].to_csv(os.path.join(out_dir, 'val.csv'), index=False)
    test_df[cols_to_save].to_csv(os.path.join(out_dir, 'test.csv'), index=False)
    
    print("[6/6] Generating Reports...")
    report = {
        "train_row_count": len(train_df),
        "val_row_count": len(val_df),
        "test_row_count": len(test_df),
        "verification": {
            "targets_excluded_from_model": not any(t in model_features for t in target_cols),
            "leakage_excluded_from_model": not any(l in model_features for l in leakage_cols),
            "flow_leakage_prevented": True
        }
    }
    
    with open('reports/phase3_2_split_report.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    print("Done!")

if __name__ == "__main__":
    main()
