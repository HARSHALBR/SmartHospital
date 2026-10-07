import os
import json
import pandas as pd
import numpy as np
from glob import glob
from collections import Counter

def check_inf_nan(df):
    nums = df.select_dtypes(include=[np.number])
    has_nan = nums.isna().any().any()
    has_inf = np.isinf(nums).any().any()
    return has_nan, has_inf

def main():
    splits = ['train', 'val', 'test']
    
    report = {
        "1_edge_label_distribution": {},
        "2_flow_statistics": {},
        "3_feature_leakage": {},
        "4_split_leakage": {},
        "5_feature_shapes": {},
        "6_class_coverage": {},
        "7_graph_sanity": {}
    }
    
    global_ips = {'train': set(), 'val': set(), 'test': set()}
    
    total_nodes = 0
    total_edges = 0
    node_features = []
    edge_features = []
    
    sanity_issues = []
    
    print("Reading Phase 4.2 graph edges...")
    for split in splits:
        split_dir = f'graph_data/phase4_2_canonical_flow/{split}'
        windows = glob(f'{split_dir}/window_*')
        
        edge_label_dist = Counter()
        attack_type_dist = Counter()
        
        num_records_list = []
        edges_in_split = 0
        nodes_in_split = 0
        
        for w in windows:
            if os.path.exists(f'{w}/edges.csv'):
                edges_df = pd.read_csv(f'{w}/edges.csv')
                edges_in_split += len(edges_df)
                
                if not edge_features:
                    edge_features = list(edges_df.columns)
                    edge_features.remove('src_ip')
                    edge_features.remove('dst_ip')
                    edge_features.remove('Attack_label')
                    edge_features.remove('Attack_type')
                    edge_features.remove('num_records')
                    
                for atk in edges_df['Attack_type']:
                    attack_type_dist[str(atk)] += 1
                for albl in edges_df['Attack_label']:
                    if albl == 0:
                        edge_label_dist['Normal'] += 1
                    else:
                        edge_label_dist['Attack'] += 1
                        
                num_records_list.extend(edges_df['num_records'].tolist())
                
                global_ips[split].update(edges_df['src_ip'])
                global_ips[split].update(edges_df['dst_ip'])
                
                has_nan, has_inf = check_inf_nan(edges_df)
                if has_nan: sanity_issues.append(f"NaN found in edges {w}")
                if has_inf: sanity_issues.append(f"Inf found in edges {w}")
                
            if os.path.exists(f'{w}/nodes.csv'):
                nodes_df = pd.read_csv(f'{w}/nodes.csv')
                nodes_in_split += len(nodes_df)
                
                if not node_features:
                    node_features = list(nodes_df.columns)
                    node_features.remove('node_id')
                    
                has_nan, has_inf = check_inf_nan(nodes_df)
                if has_nan: sanity_issues.append(f"NaN found in nodes {w}")
                if has_inf: sanity_issues.append(f"Inf found in nodes {w}")
                
        total_edges += edges_in_split
        total_nodes += nodes_in_split
        
        report["1_edge_label_distribution"][split] = {
            "Normal": edge_label_dist['Normal'],
            "Attack": edge_label_dist['Attack'],
            "Normal_Pct": edge_label_dist['Normal'] / max(1, edges_in_split),
            "Attack_types": dict(attack_type_dist)
        }
        
        num_records_list = np.array(num_records_list) if len(num_records_list) > 0 else np.array([0])
        report["2_flow_statistics"][split] = {
            "total_edges": edges_in_split,
            "packets_per_edge": {
                "mean": float(np.mean(num_records_list)),
                "median": float(np.median(num_records_list)),
                "p95": float(np.percentile(num_records_list, 95)),
                "maximum": int(np.max(num_records_list))
            }
        }
        
        report["6_class_coverage"][split] = dict(attack_type_dist)
        
    leakage_cols = [
        'Attack_label', 'Attack_type', 'ip.src_host', 'ip.dst_host', 
        'tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream', 
        'icmp.seq_le', 'frame.time', 'tcp.seq', 'tcp.ack', 'tcp.ack_raw', 
        'icmp.checksum', 'tcp.checksum'
    ]
    
    edge_leak_present = [c for c in leakage_cols if c in edge_features]
    node_leak_present = [c for c in leakage_cols if c in node_features]
    
    report["3_feature_leakage"] = {
        "node_features": node_features,
        "edge_features": edge_features,
        "leakage_present": len(edge_leak_present) > 0 or len(node_leak_present) > 0,
        "leaked_columns": {"edges": edge_leak_present, "nodes": node_leak_present}
    }
    
    report["4_split_leakage"] = {
        "ip_endpoint_overlap": {
            "train_val": len(global_ips['train'].intersection(global_ips['val'])),
            "train_test": len(global_ips['train'].intersection(global_ips['test'])),
            "val_test": len(global_ips['val'].intersection(global_ips['test']))
        }
    }
    
    report["5_feature_shapes"] = {
        "node_feature_dimension": len(node_features),
        "edge_feature_dimension": len(edge_features),
        "total_nodes": total_nodes,
        "total_edges": total_edges
    }
    
    report["7_graph_sanity"] = {
        "has_nans": any("NaN" in s for s in sanity_issues),
        "has_infs": any("Inf" in s for s in sanity_issues),
        "issues": sanity_issues[:10],
        "is_sane": len(sanity_issues) == 0
    }
    
    with open('reports/phase4_2_validation.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    print("Validation complete.")

if __name__ == "__main__":
    main()
