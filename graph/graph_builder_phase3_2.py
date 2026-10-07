import os
import json
import pandas as pd
import numpy as np
import time

def parse_and_sort_time(df):
    if 'frame.time' in df.columns:
        try:
            temp_time = df['frame.time'].astype(str).str[:19]
            df['parsed_time'] = pd.to_datetime(temp_time, errors='coerce')
        except:
            df['parsed_time'] = pd.NaT
    return df

def get_proposed_flow_id(row):
    protocol = 'OTHER'
    
    if pd.notna(row.get('tcp.srcport')) and row.get('tcp.srcport') != -1:
        protocol = 'TCP'
        return (protocol, row.get('ip.src_host'), row.get('ip.dst_host'), row.get('tcp.srcport', -1.0), row.get('tcp.dstport', -1.0))
    elif pd.notna(row.get('udp.port')) and row.get('udp.port') != -1:
        protocol = 'UDP'
        return (protocol, row.get('ip.src_host'), row.get('ip.dst_host'), row.get('udp.port', -1.0), row.get('udp.stream', -1.0))
    elif pd.notna(row.get('icmp.seq_le')) and row.get('icmp.seq_le') != -1:
        protocol = 'ICMP'
        return (protocol, row.get('ip.src_host'), row.get('ip.dst_host'))
    
    return (protocol, row.get('ip.src_host'), row.get('ip.dst_host'))

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

def build_graph(df, window_id, split_out_dir, node_features_cols):
    edges = []
    nodes_info = {}
    
    df['proposed_flow_id'] = df.apply(get_proposed_flow_id, axis=1)
    grouped = df.groupby('proposed_flow_id')
    
    for flow_id, group in grouped:
        src_ip = flow_id[1]
        dst_ip = flow_id[2]
        
        attack_label = int(group['Attack_label'].max())
        attack_type = compute_multiclass_label(group['Attack_type'].astype(str))
        num_records = int(len(group))
        
        edge_feats = group[node_features_cols].mean().to_dict()
        edge_feats['src_ip'] = src_ip
        edge_feats['dst_ip'] = dst_ip
        edge_feats['Attack_label'] = attack_label
        edge_feats['Attack_type'] = attack_type
        edge_feats['num_records'] = num_records
        
        edges.append(edge_feats)
        
        for ip in [src_ip, dst_ip]:
            if ip not in nodes_info:
                nodes_info[ip] = []
            nodes_info[ip].append(group[node_features_cols].mean())
            
    edges_df = pd.DataFrame(edges)
    
    nodes_data = []
    for ip, feats_list in nodes_info.items():
        node_feats = pd.concat(feats_list, axis=1).mean(axis=1).to_dict()
        node_feats['node_id'] = ip
        nodes_data.append(node_feats)
    nodes_df = pd.DataFrame(nodes_data)
    
    window_dir = os.path.join(split_out_dir, f"window_{window_id:04d}")
    os.makedirs(window_dir, exist_ok=True)
    
    edges_df.to_csv(os.path.join(window_dir, 'edges.csv'), index=False)
    nodes_df.to_csv(os.path.join(window_dir, 'nodes.csv'), index=False)
    
    return len(edges_df), len(nodes_df)

def main():
    splits = ['train', 'val', 'test']
    in_base = 'data/processed/edge_iiot/phase3_2'
    out_base = 'graph_data/phase3_2'
    
    report = {
        "total_graph_windows": 0,
        "total_flow_edges": 0,
        "edges_per_split": {"train": 0, "val": 0, "test": 0}
    }
    
    # 10s window size
    window_duration_seconds = 10
    chunk_size = 500000 # Memory optimization: load in chunks, but we MUST sort by time first if we want true windows
    
    for split in splits:
        in_file = f'{in_base}/{split}.csv'
        if not os.path.exists(in_file):
            print(f"File {in_file} not found. Did you run the splitter?")
            continue
            
        split_out_dir = f'{out_base}/{split}'
        os.makedirs(split_out_dir, exist_ok=True)
        
        print(f"Processing split: {split}")
        df = pd.read_csv(in_file, low_memory=False)
        df = parse_and_sort_time(df)
        
        if df['parsed_time'].isna().all():
            print("No valid timestamps found.")
            df['proposed_window'] = 0
        else:
            min_time = df['parsed_time'].min()
            df['proposed_window'] = (df['parsed_time'] - min_time).dt.total_seconds() // window_duration_seconds
            df['proposed_window'] = df['proposed_window'].fillna(0).astype(int)
        
        # Sort by window to process safely
        df = df.sort_values('proposed_window').reset_index(drop=True)
        
        leakage_cols = [
            'Attack_label', 'Attack_type', 'ip.src_host', 'ip.dst_host', 
            'tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream', 
            'icmp.seq_le', 'frame.time', 'parsed_time', 'proposed_window'
        ]
        
        all_numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [c for c in all_numeric_cols if c not in leakage_cols]
        
        windows = df['proposed_window'].unique()
        print(f"Found {len(windows)} temporal windows in {split} split.")
        
        for w_id in windows:
            w_df = df[df['proposed_window'] == w_id]
            edges_count, nodes_count = build_graph(w_df, w_id, split_out_dir, feature_cols)
            
            report["total_graph_windows"] += 1
            report["total_flow_edges"] += edges_count
            report["edges_per_split"][split] += edges_count
            
    print("Graph construction complete.")
    print(report)

if __name__ == "__main__":
    main()
