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

def main():
    start_time = time.time()
    
    with open('configs/graph_config.json', 'r') as f:
        config = json.load(f)

    with open('configs/supervised_split_config.json', 'r') as f:
        prep_config = json.load(f)

    in_file = 'data/processed/edge_iiot/supervised/train.csv'
    out_base = 'graph_data/smoke_test_v2'
    os.makedirs(out_base, exist_ok=True)
    
    # Base feature configurations
    target_cols = prep_config['targets']
    graph_id_cols = prep_config['graph_identifiers']
    excluded_cols = prep_config['excluded_from_model_features']
    high_card_cols = prep_config['high_cardinality']
    temporal_cols = prep_config['temporal']
    
    # Desired Flow Identity Columns
    desired_flow_cols = ['ip.src_host', 'ip.dst_host', 'tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream']
    
    chunk_size = 25000
    max_rows = 100000
    rows_processed = 0
    window_count = 0
    peak_ram = 0.0
    
    node_mapper = NodeMapper()
    
    report = {
        "raw_records": 0,
        "unique_flow_edges": 0,
        "avg_records_per_flow": 0.0,
        "median_records_per_flow": 0.0,
        "max_records_per_flow": 0.0,
        "normal_edges": 0,
        "attack_edges": 0,
        "mixed_edges": 0,
        "binary_edge_distribution": {0: 0, 1: 0},
        "multiclass_label_distribution": {},
        "temporal_windows": 0,
        "unique_nodes": 0,
        "leakage_verification": {}
    }
    
    # We will accumulate records_per_edge across chunks just to compute median/max accurately for the report
    records_per_edge_list = []
    
    print(f"Starting V2 chunked smoke test (max rows = {max_rows}, chunk size = {chunk_size})...")
    
    for chunk_df in pd.read_csv(in_file, chunksize=chunk_size, low_memory=False):
        if rows_processed >= max_rows:
            break
            
        current_ram = get_ram_mb()
        if current_ram > peak_ram:
            peak_ram = current_ram
            
        print(f"Processing chunk {window_count+1}... (Rows: {rows_processed} - {rows_processed+len(chunk_df)})")
        chunk_df = parse_and_sort_time(chunk_df)
        
        all_cols = list(chunk_df.columns)
        
        # Verify which flow columns actually exist
        flow_cols = [c for c in desired_flow_cols if c in all_cols]
        
        # EXPLICIT LEAKAGE PREVENTION: Add all flow identity columns to non_model_cols
        # This guarantees they cannot be used as predictive features.
        non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols + flow_cols)
        
        model_features = [c for c in all_cols if c not in non_model_cols and c != 'parsed_time']
        
        # Record leakage verification once
        if window_count == 0:
            report["leakage_verification"] = {
                "flow_columns_used": flow_cols,
                "are_flow_cols_in_features": any(c in model_features for c in flow_cols),
                "are_targets_in_features": any(c in model_features for c in target_cols),
                "node_feature_dimension": len(model_features) * 2,
                "edge_feature_dimension": len(model_features)
            }
            
        # Fill missing values in flow columns so GroupBy works properly for ICMP/ARP
        chunk_df[flow_cols] = chunk_df[flow_cols].fillna(-1)
        
        # Compute stats for Task 3 report
        edge_sizes = chunk_df.groupby(flow_cols).size()
        records_per_edge_list.extend(edge_sizes.values)
        
        # Graph logic using FLOW COLS
        edge_feats = compute_edge_features(chunk_df, model_features, config.get("edge_features_aggregation", "mean"), group_cols=flow_cols)
        node_feats = compute_node_features(chunk_df, model_features, config.get("node_features_aggregation", "mean"))
        edge_labels, mixed_count = compute_edge_labels(chunk_df, group_cols=flow_cols)
        
        # Node mapping (IP -> ID)
        all_ips = set(edge_feats['ip.src_host']).union(set(edge_feats['ip.dst_host']))
        for ip in all_ips:
            node_mapper.get_id(ip)
            
        # Extract source and target for graph edges
        edge_feats['source_id'] = edge_feats['ip.src_host'].map(lambda x: node_mapper.get_id(x))
        edge_feats['target_id'] = edge_feats['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
        edge_labels['source_id'] = edge_labels['ip.src_host'].map(lambda x: node_mapper.get_id(x))
        edge_labels['target_id'] = edge_labels['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
        node_feats['node_id'] = node_feats['ip'].map(lambda x: node_mapper.get_id(x))
        
        # We don't need the rest of the flow keys in the final edge feature matrix (GraphSAGE doesn't need them as nodes are linked implicitly)
        edge_feats = edge_feats.drop(columns=flow_cols)
        edge_labels = edge_labels.drop(columns=flow_cols)
        node_feats = node_feats.drop(columns=['ip'])
        
        # Wait, if multiple flows exist between the same IP pair, how do we merge feats and labels?
        # We cannot just merge on source_id and target_id because they are not unique anymore!
        # We must merge on the index or keep a temporary flow_id.
        # Let's recreate a temporary flow_id for merging before dropping.
        chunk_df['temp_flow_id'] = chunk_df.groupby(flow_cols).ngroup()
        
        # Re-compute with temp_flow_id
        edge_feats = compute_edge_features(chunk_df, model_features, config.get("edge_features_aggregation", "mean"), group_cols=['temp_flow_id', 'ip.src_host', 'ip.dst_host'])
        edge_labels, mixed_count = compute_edge_labels(chunk_df, group_cols=['temp_flow_id', 'ip.src_host', 'ip.dst_host'])
        
        edge_feats['source_id'] = edge_feats['ip.src_host'].map(lambda x: node_mapper.get_id(x))
        edge_feats['target_id'] = edge_feats['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
        edge_labels['source_id'] = edge_labels['ip.src_host'].map(lambda x: node_mapper.get_id(x))
        edge_labels['target_id'] = edge_labels['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
        
        edge_feats = edge_feats.drop(columns=['ip.src_host', 'ip.dst_host'])
        edge_labels = edge_labels.drop(columns=['ip.src_host', 'ip.dst_host'])
        
        edges_final = pd.merge(edge_feats, edge_labels, on=['temp_flow_id', 'source_id', 'target_id'])
        edges_final = edges_final.drop(columns=['temp_flow_id'])
        
        # Track stats
        report["unique_flow_edges"] += len(edges_final)
        report["mixed_edges"] += mixed_count
        
        pure_normal = len(edges_final[edges_final['Attack_label'] == 0])
        pure_attack = len(edges_final[edges_final['Attack_label'] == 1])
        report["normal_edges"] += pure_normal
        report["attack_edges"] += pure_attack
        
        for label in edges_final['Attack_label']:
            report["binary_edge_distribution"][int(label)] = report["binary_edge_distribution"].get(int(label), 0) + 1
        for l_type in edges_final['Attack_type']:
            report["multiclass_label_distribution"][str(l_type)] = report["multiclass_label_distribution"].get(str(l_type), 0) + 1
            
        rows_processed += len(chunk_df)
        window_count += 1
        
        # Clean memory
        del chunk_df, edge_feats, node_feats, edge_labels, edges_final
        gc.collect()

    end_time = time.time()
    
    # Finalize stats
    if len(records_per_edge_list) > 0:
        report["avg_records_per_flow"] = float(np.mean(records_per_edge_list))
        report["median_records_per_flow"] = float(np.median(records_per_edge_list))
        report["max_records_per_flow"] = float(np.max(records_per_edge_list))
        
    report["raw_records"] = rows_processed
    report["temporal_windows"] = window_count
    report["unique_nodes"] = len(node_mapper.mapping)
    
    # Convert numpy types to python native
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
    with open('reports/smoke_test_v2_report.json', 'w') as f:
        json.dump(report_clean, f, indent=4)
        
    print("\n--- V2 SMOKE TEST REPORT ---")
    for k, v in report_clean.items():
        if isinstance(v, dict):
            print(f"{k}:")
            for sub_k, sub_v in v.items():
                print(f"  {sub_k}: {sub_v}")
        else:
            print(f"{k}: {v}")

if __name__ == "__main__":
    main()
