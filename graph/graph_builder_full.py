import os
import json
import time
import gc
import pandas as pd
import numpy as np

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

from graph_utils import parse_and_sort_time, NodeMapper
from graph_features import compute_edge_features, compute_node_features
from graph_labels import compute_edge_labels

def get_ram_mb():
    if HAS_PSUTIL:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024
    return 0.0

def assign_protocol_and_ports(df):
    """
    Explicitly adds flow protocol and ports to the DataFrame.
    """
    df['protocol'] = 'OTHER'
    df['source_port'] = -1.0
    df['destination_port'] = -1.0
    df['udp_stream'] = -1.0
    
    # TCP
    if 'tcp.srcport' in df.columns:
        is_tcp = df['tcp.srcport'].notna() & (df['tcp.srcport'] != -1)
        df.loc[is_tcp, 'protocol'] = 'TCP'
        df.loc[is_tcp, 'source_port'] = df.loc[is_tcp, 'tcp.srcport']
        if 'tcp.dstport' in df.columns:
            df.loc[is_tcp, 'destination_port'] = df.loc[is_tcp, 'tcp.dstport']
            
    # UDP
    if 'udp.port' in df.columns:
        is_udp = df['udp.port'].notna() & (df['udp.port'] != -1)
        df.loc[is_udp, 'protocol'] = 'UDP'
        df.loc[is_udp, 'source_port'] = df.loc[is_udp, 'udp.port']
        df.loc[is_udp, 'destination_port'] = -1.0
        
        if 'udp.stream' in df.columns:
            df.loc[is_udp, 'udp_stream'] = df.loc[is_udp, 'udp.stream']
            
    # ICMP
    if 'icmp.seq_le' in df.columns:
        is_icmp = df['icmp.seq_le'].notna() & (df['icmp.seq_le'] != -1)
        df.loc[is_icmp, 'protocol'] = 'ICMP'
        df.loc[is_icmp, 'source_port'] = -1.0
        df.loc[is_icmp, 'destination_port'] = -1.0
        df.loc[is_icmp, 'udp_stream'] = -1.0
        
    return df

def main():
    start_time = time.time()
    
    with open('configs/graph_config.json', 'r') as f:
        config = json.load(f)

    with open('configs/supervised_split_config.json', 'r') as f:
        prep_config = json.load(f)

    splits = ['train', 'val', 'test']
    out_base = 'graph_data/supervised'
    
    target_cols = prep_config['targets']
    graph_id_cols = prep_config['graph_identifiers']
    excluded_cols = prep_config['excluded_from_model_features']
    high_card_cols = prep_config['high_cardinality']
    temporal_cols = prep_config['temporal']
    
    chunk_size = 25000
    peak_ram = 0.0
    
    node_mapper = NodeMapper()
    
    report = {
        "raw_records_processed": 0,
        "total_graph_windows": 0,
        "total_unique_nodes": 0,
        "total_flow_edges": 0,
        "avg_records_per_edge": 0.0,
        "median_records_per_edge": 0.0,
        "max_records_per_edge": 0.0,
        "node_feature_dimension": 0,
        "edge_feature_dimension": 0,
        "binary_edge_label_distribution": {"0": 0, "1": 0},
        "multiclass_edge_label_distribution": {},
        "pure_normal_edges": 0,
        "pure_attack_edges": 0,
        "mixed_normal_attack_edges": 0,
        "edges_per_split": {"train": 0, "val": 0, "test": 0},
        "nodes_per_split": {"train": 0, "val": 0, "test": 0},
        "windows_per_split": {"train": 0, "val": 0, "test": 0},
        "disk_size_bytes": 0,
        "peak_process_memory_mb": 0.0,
        "edge_level_class_distribution_per_split": {
            "train": {},
            "val": {},
            "test": {}
        }
    }
    
    records_per_edge_list = []
    
    # Pre-defined flow identity structure
    flow_identity_cols = ['protocol', 'ip.src_host', 'ip.dst_host', 'source_port', 'destination_port', 'udp_stream']
    
    for split in splits:
        in_file = f'data/processed/edge_iiot/supervised/{split}.csv'
        split_out_dir = f'{out_base}/{split}'
        os.makedirs(split_out_dir, exist_ok=True)
        
        print(f"Processing split: {split}")
        
        window_count = 0
        nodes_in_split = set()
        
        for chunk_df in pd.read_csv(in_file, chunksize=chunk_size, low_memory=False):
            current_ram = get_ram_mb()
            if current_ram > peak_ram:
                peak_ram = current_ram
                
            window_dir = f"{split_out_dir}/window_{window_count:03d}"
            
            # Checkpoint check
            if os.path.exists(f"{window_dir}/edges.csv") and os.path.exists(f"{window_dir}/nodes.csv"):
                print(f"Skipping already processed window {window_count} for {split}")
                
                edges_df = pd.read_csv(f"{window_dir}/edges.csv")
                nodes_df = pd.read_csv(f"{window_dir}/nodes.csv")
                
                edges_in_window = len(edges_df)
                report["total_flow_edges"] += edges_in_window
                report["edges_per_split"][split] += edges_in_window
                
                pure_normal = len(edges_df[edges_df['Attack_label'] == 0])
                pure_attack = len(edges_df[edges_df['Attack_label'] == 1])
                report["pure_normal_edges"] += pure_normal
                report["pure_attack_edges"] += pure_attack
                
                for label in edges_df['Attack_label']:
                    report["binary_edge_label_distribution"][str(int(label))] = report["binary_edge_label_distribution"].get(str(int(label)), 0) + 1
                for l_type in edges_df['Attack_type']:
                    l_str = str(l_type)
                    report["multiclass_edge_label_distribution"][l_str] = report["multiclass_edge_label_distribution"].get(l_str, 0) + 1
                    report["edge_level_class_distribution_per_split"][split][l_str] = report["edge_level_class_distribution_per_split"][split].get(l_str, 0) + 1
                
                report["raw_records_processed"] += chunk_size
                report["windows_per_split"][split] += 1
                report["total_graph_windows"] += 1
                
                for n in nodes_df['node_id']:
                    nodes_in_split.add(n)
                
                window_count += 1
                continue

            os.makedirs(window_dir, exist_ok=True)
            
            chunk_df = parse_and_sort_time(chunk_df)
            chunk_df = assign_protocol_and_ports(chunk_df)
            
            all_cols = list(chunk_df.columns)
            
            # Legacy leakage columns - these used to be model features
            legacy_leakage = ['tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream']
            existing_legacy = [c for c in legacy_leakage if c in all_cols]
            
            non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols + flow_identity_cols + existing_legacy)
            
            model_features = [c for c in all_cols if c not in non_model_cols and c != 'parsed_time']
            
            if report["node_feature_dimension"] == 0:
                report["node_feature_dimension"] = len(model_features) * 2
                report["edge_feature_dimension"] = len(model_features)
                
            edge_sizes = chunk_df.groupby(flow_identity_cols).size()
            records_per_edge_list.extend(edge_sizes.values)
            
            chunk_df['temp_flow_id'] = chunk_df.groupby(flow_identity_cols).ngroup()
            
            group_keys = ['temp_flow_id', 'ip.src_host', 'ip.dst_host']
            
            edge_feats = compute_edge_features(chunk_df, model_features, config.get("edge_features_aggregation", "mean"), group_cols=group_keys)
            node_feats = compute_node_features(chunk_df, model_features, config.get("node_features_aggregation", "mean"))
            edge_labels, mixed_count = compute_edge_labels(chunk_df, group_cols=group_keys)
            
            all_ips = set(edge_feats['ip.src_host']).union(set(edge_feats['ip.dst_host']))
            for ip in all_ips:
                node_id = node_mapper.get_id(ip)
                nodes_in_split.add(node_id)
                
            edge_feats['source_id'] = edge_feats['ip.src_host'].map(lambda x: node_mapper.get_id(x))
            edge_feats['target_id'] = edge_feats['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
            edge_labels['source_id'] = edge_labels['ip.src_host'].map(lambda x: node_mapper.get_id(x))
            edge_labels['target_id'] = edge_labels['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
            node_feats['node_id'] = node_feats['ip'].map(lambda x: node_mapper.get_id(x))
            
            edge_feats = edge_feats.drop(columns=['ip.src_host', 'ip.dst_host'])
            edge_labels = edge_labels.drop(columns=['ip.src_host', 'ip.dst_host'])
            node_feats = node_feats.drop(columns=['ip'])
            
            edges_final = pd.merge(edge_feats, edge_labels, on=['temp_flow_id', 'source_id', 'target_id'])
            edges_final = edges_final.drop(columns=['temp_flow_id'])
            
            edges_final.to_csv(f"{window_dir}/edges.csv", index=False)
            node_feats.to_csv(f"{window_dir}/nodes.csv", index=False)
            
            edges_in_window = len(edges_final)
            report["total_flow_edges"] += edges_in_window
            report["mixed_normal_attack_edges"] += mixed_count
            report["edges_per_split"][split] += edges_in_window
            
            pure_normal = len(edges_final[edges_final['Attack_label'] == 0])
            pure_attack = len(edges_final[edges_final['Attack_label'] == 1])
            report["pure_normal_edges"] += pure_normal
            report["pure_attack_edges"] += pure_attack
            
            for label in edges_final['Attack_label']:
                report["binary_edge_label_distribution"][str(int(label))] = report["binary_edge_label_distribution"].get(str(int(label)), 0) + 1
            for l_type in edges_final['Attack_type']:
                l_str = str(l_type)
                report["multiclass_edge_label_distribution"][l_str] = report["multiclass_edge_label_distribution"].get(l_str, 0) + 1
                report["edge_level_class_distribution_per_split"][split][l_str] = report["edge_level_class_distribution_per_split"][split].get(l_str, 0) + 1
                
            report["raw_records_processed"] += len(chunk_df)
            report["windows_per_split"][split] += 1
            report["total_graph_windows"] += 1
            
            window_count += 1
            
            del chunk_df, edge_feats, node_feats, edge_labels, edges_final
            gc.collect()
            
        report["nodes_per_split"][split] = len(nodes_in_split)
        
    os.makedirs('graph_data', exist_ok=True)
    node_mapper.save('graph_data/node_mapping.json')
    
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(out_base):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            total_size += os.path.getsize(fp)
    report["disk_size_bytes"] = total_size
    report["peak_process_memory_mb"] = peak_ram
    report["total_unique_nodes"] = len(node_mapper.mapping)
    
    if len(records_per_edge_list) > 0:
        report["avg_records_per_edge"] = float(np.mean(records_per_edge_list))
        report["median_records_per_edge"] = float(np.median(records_per_edge_list))
        report["max_records_per_edge"] = float(np.max(records_per_edge_list))
        
    def convert_types(obj):
        if isinstance(obj, dict):
            return {str(k): convert_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_types(i) for i in obj]
        elif isinstance(obj, (np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.float64, np.float32)):
            return float(obj)
        return obj

    report_clean = convert_types(report)
        
    os.makedirs('reports', exist_ok=True)
    with open('reports/graph_construction_report.json', 'w') as f:
        json.dump(report_clean, f, indent=4)
        
    with open('reports/graph_construction_report.txt', 'w') as f:
        f.write("=== PHASE 3 GRAPH CONSTRUCTION REPORT ===\n\n")
        f.write("TERMINOLOGY DOCUMENTATION:\n")
        f.write("Ports are used as flow/topology identifiers and are currently excluded from the neural feature vector to prevent the model from relying excessively on endpoint-specific communication patterns.\n\n")
        
        f.write("METRICS:\n")
        for k, v in report_clean.items():
            if not isinstance(v, dict):
                f.write(f"{k}: {v}\n")
        
        f.write("\nBINARY DISTRIBUTION:\n")
        for k, v in report_clean["binary_edge_label_distribution"].items():
            f.write(f"  {k}: {v}\n")
            
        f.write("\nMULTICLASS DISTRIBUTION:\n")
        for k, v in report_clean["multiclass_edge_label_distribution"].items():
            f.write(f"  {k}: {v}\n")
            
        f.write("\nEDGE DISTRIBUTION PER SPLIT:\n")
        for split, d in report_clean["edge_level_class_distribution_per_split"].items():
            f.write(f"  {split}:\n")
            for k, v in d.items():
                f.write(f"    {k}: {v}\n")
                
        f.write("\nNOTE: The final edge-level class distribution will naturally differ from the raw row-level distribution because multiple packets belonging to the same flow are collapsed into a single edge.\n")

if __name__ == "__main__":
    main()
