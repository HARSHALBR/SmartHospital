import os
import json
import pandas as pd
import numpy as np
import gc
from graph_utils import parse_and_sort_time, NodeMapper
from graph_features import compute_edge_features, compute_node_features
from graph_labels import compute_edge_labels

def main():
    with open('configs/graph_config.json', 'r') as f:
        config = json.load(f)

    with open('configs/supervised_split_config.json', 'r') as f:
        prep_config = json.load(f)

    out_base = 'graph_data/supervised'
    in_base = 'data/processed/edge_iiot/supervised'
    
    splits = ['train', 'val', 'test']
    
    node_mapper = NodeMapper()
    
    # Exclude targets, graph identifiers, excluded, and high card from model features
    target_cols = prep_config['targets']
    graph_id_cols = prep_config['graph_identifiers']
    excluded_cols = prep_config['excluded_from_model_features']
    high_card_cols = prep_config['high_cardinality']
    temporal_cols = prep_config['temporal']
    non_model_cols = set(target_cols + graph_id_cols + excluded_cols + high_card_cols + temporal_cols)
    
    report = {
        "num_windows": 0,
        "total_nodes_seen": 0,
        "total_edges_created": 0,
        "nodes_per_window": [],
        "edges_per_window": [],
        "records_per_window": [],
        "mixed_label_edges_total": 0,
        "binary_label_dist": {0: 0, 1: 0},
        "multiclass_label_dist": {},
        "node_feature_dim": 0,
        "edge_feature_dim": 0
    }

    records_per_window = config.get("records_per_window", 100000)

    for split in splits:
        print(f"Processing split: {split}")
        split_in = os.path.join(in_base, f"{split}.csv")
        split_out = os.path.join(out_base, split)
        os.makedirs(split_out, exist_ok=True)
        
        df = pd.read_csv(split_in, low_memory=False)
        
        all_cols = list(df.columns)
        model_features = [c for c in all_cols if c not in non_model_cols and c != 'parsed_time']
        report["edge_feature_dim"] = len(model_features)
        report["node_feature_dim"] = len(model_features) * 2 # In and Out

        # 1. Enforce chronological ordering within the split
        df = parse_and_sort_time(df)
        
        # 2. Windowing
        num_records = len(df)
        num_windows_split = (num_records // records_per_window) + (1 if num_records % records_per_window != 0 else 0)
        
        for w in range(num_windows_split):
            start_idx = w * records_per_window
            end_idx = min(start_idx + records_per_window, num_records)
            df_win = df.iloc[start_idx:end_idx]
            
            win_dir = os.path.join(split_out, f"window_{w:03d}")
            os.makedirs(win_dir, exist_ok=True)
            
            # 3. Features & Labels
            edge_feats = compute_edge_features(df_win, model_features, config.get("edge_features_aggregation", "mean"))
            node_feats = compute_node_features(df_win, model_features, config.get("node_features_aggregation", "mean"))
            edge_labels, mixed_count = compute_edge_labels(df_win)
            
            # Update mappings
            all_ips = set(edge_feats['ip.src_host']).union(set(edge_feats['ip.dst_host']))
            for ip in all_ips:
                node_mapper.get_id(ip)
                
            # Replace IPs with IDs
            edge_feats['source_id'] = edge_feats['ip.src_host'].map(lambda x: node_mapper.get_id(x))
            edge_feats['target_id'] = edge_feats['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
            edge_labels['source_id'] = edge_labels['ip.src_host'].map(lambda x: node_mapper.get_id(x))
            edge_labels['target_id'] = edge_labels['ip.dst_host'].map(lambda x: node_mapper.get_id(x))
            node_feats['node_id'] = node_feats['ip'].map(lambda x: node_mapper.get_id(x))
            
            # Drop raw IPs
            edge_feats = edge_feats.drop(columns=['ip.src_host', 'ip.dst_host'])
            edge_labels = edge_labels.drop(columns=['ip.src_host', 'ip.dst_host'])
            node_feats = node_feats.drop(columns=['ip'])
            
            # Combine edge features and labels
            edges_final = pd.merge(edge_feats, edge_labels, on=['source_id', 'target_id'])
            
            # Save
            nodes_path = os.path.join(win_dir, "nodes.csv")
            edges_path = os.path.join(win_dir, "edges.csv")
            
            # Reorder columns so node_id, source_id, target_id are first
            node_cols = ['node_id'] + [c for c in node_feats.columns if c != 'node_id']
            node_feats[node_cols].to_csv(nodes_path, index=False)
            
            edge_cols = ['source_id', 'target_id', 'Attack_label', 'Attack_type'] + [c for c in edges_final.columns if c not in ['source_id', 'target_id', 'Attack_label', 'Attack_type']]
            edges_final[edge_cols].to_csv(edges_path, index=False)
            
            # Update reporting stats
            report["num_windows"] += 1
            report["nodes_per_window"].append(len(node_feats))
            report["edges_per_window"].append(len(edges_final))
            report["records_per_window"].append(len(df_win))
            report["mixed_label_edges_total"] += mixed_count
            report["total_edges_created"] += len(edges_final)
            
            for label in edges_final['Attack_label']:
                report["binary_label_dist"][label] = report["binary_label_dist"].get(label, 0) + 1
            for l_type in edges_final['Attack_type']:
                report["multiclass_label_dist"][l_type] = report["multiclass_label_dist"].get(l_type, 0) + 1
                
        del df
        gc.collect()

    node_mapper.save('graph_data/node_mapping.json')
    report["total_nodes_seen"] = len(node_mapper.mapping)
    
    # Calculate averages
    report["avg_nodes_per_window"] = sum(report["nodes_per_window"]) / max(1, len(report["nodes_per_window"]))
    report["avg_edges_per_window"] = sum(report["edges_per_window"]) / max(1, len(report["edges_per_window"]))
    
    report["leakage_concerns"] = "Row-level stratification in Phase 2.1 causes related packets to scatter across splits. Temporal sorting inside each split partially reconstructs timeline fragments, but it does NOT solve flow-level leakage. Edge features (and node features) in Val/Test may contain aggregated statistics from flows that were also partially present in Train. We explicitly document this limitation."
    report["graph_format"] = "Nodes/Edges CSV per Temporal Window. IP strings replaced by deterministic integer IDs."
    
    # Convert numpy types to python native for JSON
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
    
    clean_report = convert_types(report)
    
    os.makedirs('reports', exist_ok=True)
    with open('reports/graph_construction_report.json', 'w') as f:
        json.dump(clean_report, f, indent=4)
        
    with open('reports/graph_construction_report.txt', 'w') as f:
        f.write("PHASE 3: GRAPH CONSTRUCTION REPORT\n")
        f.write("==================================\n")
        for k, v in report.items():
            if isinstance(v, list) and len(v) > 10:
                f.write(f"{k}: [List of {len(v)} items...]\n")
            elif isinstance(v, dict):
                f.write(f"{k}:\n")
                for k2, v2 in v.items():
                    f.write(f"  {k2}: {v2}\n")
            else:
                f.write(f"{k}: {v}\n")

    print("Graph construction complete!")

if __name__ == "__main__":
    main()
