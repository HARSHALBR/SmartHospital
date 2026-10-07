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

def get_dir_size(path):
    total = 0
    for dirpath, _, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total += os.path.getsize(fp)
    return total / 1024 / 1024  # Size in MB

def main():
    start_time = time.time()
    
    with open('configs/graph_config.json', 'r') as f:
        config = json.load(f)

    with open('configs/supervised_split_config.json', 'r') as f:
        prep_config = json.load(f)

    in_file = 'data/processed/edge_iiot/supervised/train.csv'
    out_base = 'graph_data/smoke_test'
    os.makedirs(out_base, exist_ok=True)
    
    # Feature configurations
    target_cols = prep_config['targets']
    graph_id_cols = prep_config['graph_identifiers']
    excluded_cols = prep_config['excluded_from_model_features']
    high_card_cols = prep_config['high_cardinality']
    temporal_cols = prep_config['temporal']
    non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols)
    
    chunk_size = 25000
    max_rows = 100000
    rows_processed = 0
    window_count = 0
    peak_ram = 0.0
    
    node_mapper = NodeMapper()
    
    report = {
        "rows_processed": 0,
        "chunk_size": chunk_size,
        "processing_time_seconds": 0,
        "peak_ram_mb": 0.0,
        "num_windows": 0,
        "total_unique_nodes": 0,
        "total_edges": 0,
        "node_feature_dimension": 0,
        "edge_feature_dimension": 0,
        "binary_label_distribution": {0: 0, 1: 0},
        "multiclass_label_distribution": {},
        "mixed_label_edges": 0,
        "output_size_on_disk_mb": 0.0
    }
    
    print(f"Starting chunked smoke test (max rows = {max_rows}, chunk size = {chunk_size})...")
    
    # Iteratively read and process chunks
    for chunk_df in pd.read_csv(in_file, chunksize=chunk_size, low_memory=False):
        if rows_processed >= max_rows:
            break
            
        current_ram = get_ram_mb()
        if current_ram > peak_ram:
            peak_ram = current_ram
            
        print(f"Processing chunk {window_count+1}... (Rows: {rows_processed} - {rows_processed+len(chunk_df)})")
        
        # Chronological parsing per chunk (Memory efficient approximation of temporal window)
        chunk_df = parse_and_sort_time(chunk_df)
        
        all_cols = list(chunk_df.columns)
        model_features = [c for c in all_cols if c not in non_model_cols and c != 'parsed_time']
        
        if report["edge_feature_dimension"] == 0:
            report["edge_feature_dimension"] = len(model_features)
            report["node_feature_dimension"] = len(model_features) * 2
            
        # Graph logic
        edge_feats = compute_edge_features(chunk_df, model_features, config.get("edge_features_aggregation", "mean"))
        node_feats = compute_node_features(chunk_df, model_features, config.get("node_features_aggregation", "mean"))
        edge_labels, mixed_count = compute_edge_labels(chunk_df)
        
        # Mappings
        all_ips = set(edge_feats['ip.src_host']).union(set(edge_feats['ip.dst_host']))
        for ip in all_ips:
            node_mapper.get_id(ip)
            
        edge_feats['source_id'] = edge_feats['ip.src_host'].map(lambda x: node_mapper.get_id(x))
        edge_feats['target_id'] = edge_feats['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
        edge_labels['source_id'] = edge_labels['ip.src_host'].map(lambda x: node_mapper.get_id(x))
        edge_labels['target_id'] = edge_labels['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
        node_feats['node_id'] = node_feats['ip'].map(lambda x: node_mapper.get_id(x))
        
        edge_feats = edge_feats.drop(columns=['ip.src_host', 'ip.dst_host'])
        edge_labels = edge_labels.drop(columns=['ip.src_host', 'ip.dst_host'])
        node_feats = node_feats.drop(columns=['ip'])
        
        edges_final = pd.merge(edge_feats, edge_labels, on=['source_id', 'target_id'])
        
        # Save output
        win_dir = os.path.join(out_base, f"window_{window_count:03d}")
        os.makedirs(win_dir, exist_ok=True)
        
        node_cols = ['node_id'] + [c for c in node_feats.columns if c != 'node_id']
        node_feats[node_cols].to_csv(os.path.join(win_dir, "nodes.csv"), index=False)
        
        edge_cols = ['source_id', 'target_id', 'Attack_label', 'Attack_type'] + [c for c in edges_final.columns if c not in ['source_id', 'target_id', 'Attack_label', 'Attack_type']]
        edges_final[edge_cols].to_csv(os.path.join(win_dir, "edges.csv"), index=False)
        
        # Track stats
        report["total_edges"] += len(edges_final)
        report["mixed_label_edges"] += mixed_count
        
        for label in edges_final['Attack_label']:
            report["binary_label_distribution"][int(label)] = report["binary_label_distribution"].get(int(label), 0) + 1
        for l_type in edges_final['Attack_type']:
            report["multiclass_label_distribution"][str(l_type)] = report["multiclass_label_distribution"].get(str(l_type), 0) + 1
            
        rows_processed += len(chunk_df)
        window_count += 1
        
        # Clean memory
        del chunk_df, edge_feats, node_feats, edge_labels, edges_final
        gc.collect()

    end_time = time.time()
    
    node_mapper.save(os.path.join(out_base, 'smoke_node_mapping.json'))
    
    # Finalize report
    current_ram = get_ram_mb()
    if current_ram > peak_ram:
        peak_ram = current_ram
        
    report["rows_processed"] = rows_processed
    report["num_windows"] = window_count
    report["total_unique_nodes"] = len(node_mapper.mapping)
    report["processing_time_seconds"] = round(end_time - start_time, 2)
    report["peak_ram_mb"] = round(peak_ram, 2)
    report["output_size_on_disk_mb"] = round(get_dir_size(out_base), 2)
    
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
    with open('reports/smoke_test_report.json', 'w') as f:
        json.dump(report_clean, f, indent=4)
        
    print("\n--- SMOKE TEST REPORT ---")
    for k, v in report_clean.items():
        if isinstance(v, dict):
            print(f"{k}:")
            for sub_k, sub_v in v.items():
                print(f"  {sub_k}: {sub_v}")
        else:
            print(f"{k}: {v}")

    print("\nValidating Smoke Test Graphs...")
    # Validation
    valid = True
    win0_path = os.path.join(out_base, "window_000")
    if os.path.exists(win0_path):
        test_nodes = pd.read_csv(os.path.join(win0_path, "nodes.csv"))
        test_edges = pd.read_csv(os.path.join(win0_path, "edges.csv"))
        
        if 'ip' in test_nodes.columns or 'ip.src_host' in test_nodes.columns:
            print("ERROR: IP leak in nodes.")
            valid = False
            
        if 'Attack_label' in test_nodes.columns:
            print("ERROR: Target leak in nodes.")
            valid = False
            
        if test_nodes.isna().sum().sum() > 0 or test_edges.isna().sum().sum() > 0:
            print("ERROR: NaN found in features.")
            valid = False
            
        if 'source_id' not in test_edges.columns or 'target_id' not in test_edges.columns:
            print("ERROR: Invalid edge IDs.")
            valid = False
            
        if valid:
            print("SUCCESS: Smoke test graph loaded back perfectly. No leakage, no NaNs, valid IDs.")
            
if __name__ == "__main__":
    main()
