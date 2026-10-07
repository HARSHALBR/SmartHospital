import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.impute import SimpleImputer
import gc

def get_proposed_flow_id(row):
    protocol = 'OTHER'
    if pd.notna(row.get('tcp.srcport')) and row.get('tcp.srcport') != -1:
        protocol = 'TCP'
        return f"TCP-{row.get('ip.src_host')}-{row.get('ip.dst_host')}-{row.get('tcp.srcport', -1.0)}-{row.get('tcp.dstport', -1.0)}"
    elif pd.notna(row.get('udp.port')) and row.get('udp.port') != -1:
        protocol = 'UDP'
        return f"UDP-{row.get('ip.src_host')}-{row.get('ip.dst_host')}-{row.get('udp.port', -1.0)}-{row.get('udp.stream', -1.0)}"
    elif pd.notna(row.get('icmp.seq_le')) and row.get('icmp.seq_le') != -1:
        protocol = 'ICMP'
        return f"ICMP-{row.get('ip.src_host')}-{row.get('ip.dst_host')}"
    return f"OTHER-{row.get('ip.src_host')}-{row.get('ip.dst_host')}"

def compute_multiclass_label(labels):
    unique_labels = set(labels)
    if unique_labels == {'Normal'}: return 'Normal'
    elif 'Normal' in unique_labels: return 'MIXED_ATTACK'
    else:
        if len(unique_labels) == 1: return list(unique_labels)[0]
        return 'MIXED_ATTACK'

def main():
    print("[1] Loading raw dataset...")
    df = pd.read_csv('data/raw/edge_iiot/DNN-EdgeIIoT-dataset.csv', low_memory=False)
    
    with open('configs/preprocessing_config.json', 'r') as f:
        base_config = json.load(f)
        
    df['ip.src_host'] = df['ip.src_host'].fillna('unknown')
    df['ip.dst_host'] = df['ip.dst_host'].fillna('unknown')
    
    print("[2] Computing canonical flow identity...")
    df['flow_id'] = df.apply(get_proposed_flow_id, axis=1)
    
    print("[3] Performing Canonical Flow-Group Splitting...")
    exact_groups = df.groupby('flow_id')['Attack_type'].apply(list).reset_index()
    exact_groups['flow_label'] = exact_groups['Attack_type'].apply(compute_multiclass_label)
    
    counts = exact_groups['flow_label'].value_counts()
    valid_labels = counts[counts >= 3].index
    exact_groups['strat_label'] = exact_groups['flow_label'].apply(lambda x: x if x in valid_labels else 'RARE')
    
    tr_flows, te_flows = train_test_split(exact_groups, test_size=0.30, stratify=exact_groups['strat_label'], random_state=42)
    te_flows = te_flows.copy()
    te_c = te_flows['strat_label'].value_counts()
    v_l = te_c[te_c >= 2].index
    te_flows['strat_label'] = te_flows['strat_label'].apply(lambda x: x if x in v_l else 'RARE')
    va_flows, te_flows = train_test_split(te_flows, test_size=0.50, stratify=te_flows['strat_label'], random_state=42)
    
    train_flow_set = set(tr_flows['flow_id'])
    val_flow_set = set(va_flows['flow_id'])
    test_flow_set = set(te_flows['flow_id'])
    
    def get_split(flow_id):
        if flow_id in train_flow_set: return 'train'
        if flow_id in val_flow_set: return 'val'
        return 'test'
        
    df['split'] = df['flow_id'].apply(get_split)
    
    # Feature selection & scaling
    print("[4] Selecting features and scaling...")
    target_cols = base_config['targets']
    graph_id_cols = base_config['graph_identifiers']
    excluded_cols = base_config['excluded_from_model_features']
    high_card_cols = base_config['high_cardinality']
    temporal_cols = base_config['temporal']
    
    leakage_cols = [
        'Attack_label', 'Attack_type', 'ip.src_host', 'ip.dst_host', 
        'tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream', 
        'icmp.seq_le', 'frame.time', 'tcp.seq', 'tcp.ack', 'tcp.ack_raw', 
        'icmp.checksum', 'tcp.checksum', 'arp.src.proto_ipv4', 'arp.dst.proto_ipv4',
        'flow_id', 'split', 'parsed_time', 'window_id'
    ]
    
    non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols + leakage_cols)
    model_features = [c for c in df.columns if c not in non_model_cols and pd.api.types.is_numeric_dtype(df[c])]
    
    imputer = SimpleImputer(strategy='constant', fill_value=0)
    scaler = StandardScaler()
    
    # Impute and scale on Train, apply to Val/Test
    train_mask = df['split'] == 'train'
    df[model_features] = imputer.fit_transform(df[model_features])
    scaler.fit(df[train_mask][model_features])
    df[model_features] = scaler.transform(df[model_features])
    
    print("[5] Temporal Windowing...")
    df['parsed_time'] = pd.to_datetime(df['frame.time'].astype(str).str[:19], errors='coerce')
    min_time = df['parsed_time'].min()
    df['window_id'] = ((df['parsed_time'] - min_time).dt.total_seconds() // 10).fillna(0).astype(int)
    
    # Pre-verify feature absence
    print("Exact Edge/Node features:", model_features)
    for leak in ['Attack_label', 'Attack_type', 'ip.src_host', 'ip.dst_host', 'tcp.seq', 'frame.time']:
        assert leak not in model_features, f"Leakage detected: {leak}"
        
    print("[6] Building Phase 4.2 Graphs...")
    out_base = 'graph_data/phase4_2_canonical_flow'
    for sp in ['train', 'val', 'test']:
        os.makedirs(f'{out_base}/{sp}', exist_ok=True)
        
    # Process windows
    df = df.sort_values('window_id').reset_index(drop=True)
    
    # Group by (split, window_id, flow_id) to construct edges efficiently
    grouped = df.groupby(['split', 'window_id', 'flow_id'])
    
    window_data = {}
    
    # Fast iteration
    for (split, wid, fid), group in grouped:
        if split not in window_data:
            window_data[split] = {}
        if wid not in window_data[split]:
            window_data[split][wid] = {'edges': [], 'nodes': {}}
            
        src_ip = group['ip.src_host'].iloc[0]
        dst_ip = group['ip.dst_host'].iloc[0]
        
        attack_label = int(group['Attack_label'].max())
        attack_type = compute_multiclass_label(group['Attack_type'].astype(str))
        num_records = len(group)
        
        edge_feats = group[model_features].mean().to_dict()
        edge_feats['src_ip'] = src_ip
        edge_feats['dst_ip'] = dst_ip
        edge_feats['Attack_label'] = attack_label
        edge_feats['Attack_type'] = attack_type
        edge_feats['num_records'] = num_records
        
        window_data[split][wid]['edges'].append(edge_feats)
        
        for ip in [src_ip, dst_ip]:
            if ip not in window_data[split][wid]['nodes']:
                window_data[split][wid]['nodes'][ip] = []
            window_data[split][wid]['nodes'][ip].append(group[model_features].mean())
            
    # Write to disk
    for split, w_dict in window_data.items():
        for wid, data in w_dict.items():
            w_dir = os.path.join(out_base, split, f"window_{wid:04d}")
            os.makedirs(w_dir, exist_ok=True)
            
            edges_df = pd.DataFrame(data['edges'])
            
            nodes_list = []
            for ip, feats in data['nodes'].items():
                node_feats = pd.concat(feats, axis=1).mean(axis=1).to_dict()
                node_feats['node_id'] = ip
                nodes_list.append(node_feats)
                
            nodes_df = pd.DataFrame(nodes_list)
            
            edges_df.to_csv(os.path.join(w_dir, 'edges.csv'), index=False)
            nodes_df.to_csv(os.path.join(w_dir, 'nodes.csv'), index=False)
            
    print("Graph 4.2 construction complete.")

if __name__ == "__main__":
    main()
