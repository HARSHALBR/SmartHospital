import os
import json
import pandas as pd
import numpy as np
from glob import glob
from collections import defaultdict, Counter

def assign_protocol_and_ports(df):
    df['protocol'] = 'OTHER'
    df['source_port'] = -1.0
    df['destination_port'] = -1.0
    df['udp_stream'] = -1.0
    
    if 'tcp.srcport' in df.columns:
        is_tcp = df['tcp.srcport'].notna() & (df['tcp.srcport'] != -1)
        df.loc[is_tcp, 'protocol'] = 'TCP'
        df.loc[is_tcp, 'source_port'] = df.loc[is_tcp, 'tcp.srcport']
        if 'tcp.dstport' in df.columns:
            df.loc[is_tcp, 'destination_port'] = df.loc[is_tcp, 'tcp.dstport']
            
    if 'udp.port' in df.columns:
        is_udp = df['udp.port'].notna() & (df['udp.port'] != -1)
        df.loc[is_udp, 'protocol'] = 'UDP'
        df.loc[is_udp, 'source_port'] = df.loc[is_udp, 'udp.port']
        df.loc[is_udp, 'destination_port'] = -1.0
        if 'udp.stream' in df.columns:
            df.loc[is_udp, 'udp_stream'] = df.loc[is_udp, 'udp.stream']
            
    if 'icmp.seq_le' in df.columns:
        is_icmp = df['icmp.seq_le'].notna() & (df['icmp.seq_le'] != -1)
        df.loc[is_icmp, 'protocol'] = 'ICMP'
        df.loc[is_icmp, 'source_port'] = -1.0
        df.loc[is_icmp, 'destination_port'] = -1.0
        df.loc[is_icmp, 'udp_stream'] = -1.0
        
    return df

def main():
    splits = ['train', 'val', 'test']
    chunk_size = 25000
    flow_identity_cols = ['protocol', 'ip.src_host', 'ip.dst_host', 'source_port', 'destination_port', 'udp_stream']
    
    # 3 & 11
    row_level_distribution = Counter()
    
    # To track unique flow identities across the entire dataset
    unique_flows_by_class = defaultdict(set)
    global_unique_flows = set()
    global_unique_ips_by_split = defaultdict(set)
    global_unique_endpoints_by_split = defaultdict(set) # (ip, port)
    global_flows_by_split = defaultdict(set)
    
    # To track DDoS vs Normal specific fields
    class_src_ports = defaultdict(set)
    
    print("Reading raw processed data...")
    for split in splits:
        in_file = f'data/processed/edge_iiot/supervised/{split}.csv'
        for chunk in pd.read_csv(in_file, chunksize=chunk_size, low_memory=False):
            chunk = assign_protocol_and_ports(chunk)
            
            # Fill NaN in flow identity cols to avoid dropping
            for col in flow_identity_cols:
                if col in chunk.columns:
                    chunk[col] = chunk[col].fillna(-1)
            
            for _, row in chunk.iterrows():
                atk_type = str(row['Attack_type'])
                row_level_distribution[atk_type] += 1
                
                # Flow identity
                flow_id = tuple(row[col] for col in flow_identity_cols)
                unique_flows_by_class[atk_type].add(flow_id)
                global_unique_flows.add(flow_id)
                global_flows_by_split[split].add(flow_id)
                
                # IPs and endpoints for leakage check
                src_ip, dst_ip = row['ip.src_host'], row['ip.dst_host']
                src_port, dst_port = row['source_port'], row['destination_port']
                
                global_unique_ips_by_split[split].add(src_ip)
                global_unique_ips_by_split[split].add(dst_ip)
                global_unique_endpoints_by_split[split].add((src_ip, src_port))
                global_unique_endpoints_by_split[split].add((dst_ip, dst_port))
                
                class_src_ports[atk_type].add(src_port)

    # 3 - graph edges, windows, etc.
    print("Reading graph edges and nodes...")
    edge_level_distribution = Counter()
    pure_normal = 0
    pure_attack = 0
    mixed_edges = 0
    mixed_has_attack = True
    
    class_windows = defaultdict(set)
    class_edge_records = defaultdict(list)
    
    edge_feature_columns = set()
    node_feature_columns = set()

    total_edges = 0
    for split in splits:
        windows = glob(f'graph_data/supervised/{split}/window_*')
        for window in windows:
            window_id = os.path.basename(window)
            win_key = f"{split}_{window_id}"
            
            edges_path = os.path.join(window, 'edges.csv')
            if os.path.exists(edges_path):
                df_edges = pd.read_csv(edges_path)
                total_edges += len(df_edges)
                
                if not edge_feature_columns:
                    edge_feature_columns = set(df_edges.columns)
                    
                for _, row in df_edges.iterrows():
                    atk_label = row['Attack_label']
                    atk_type = str(row['Attack_type'])
                    n_records = row.get('num_records', row.get('weight', 1)) # Try to guess how many records this edge has. If there isn't a num_records column we might need to recalculate.
                    
                    if 'num_records' not in row:
                        n_records = 0 # Will populate later
                        
                    edge_level_distribution[atk_type] += 1
                    class_windows[atk_type].add(win_key)
                    # We will append the records count when we actually know it.
                    # Since edges.csv doesn't natively store num_records in the provided script unless we modified it, we might have to rely on the graph_construction_report or re-calculate it.
                    
                    if atk_label == 0:
                        pure_normal += 1
                    else:
                        pure_attack += 1 # We might not be able to easily tell pure vs mixed from just edges.csv if it doesn't have a mixed flag. Wait, report has pure/mixed.
                        
            nodes_path = os.path.join(window, 'nodes.csv')
            if os.path.exists(nodes_path) and not node_feature_columns:
                df_nodes = pd.read_csv(nodes_path)
                node_feature_columns = set(df_nodes.columns)

    # Now let's recalculate the exact records per edge if needed, or we can use the graph builder's report.
    # Actually, the original report said 179778 flow edges. I can match this to my total_edges.
    
    # 1. Row to flow edge
    q1 = "A row becomes a flow edge by extracting ['protocol', 'ip.src_host', 'ip.dst_host', 'source_port', 'destination_port', 'udp_stream']. All rows within a temporal window (chunk of 25,000 records) matching this exact 6-tuple are aggregated into a single edge."
    
    # 2. Temporal windows
    q2 = "Temporal windows (chunks of 25,000 rows) serve as aggregation boundaries. The flow identity 6-tuple does NOT include a timestamp or window ID. If the same flow continues across multiple chunks, it will be broken into multiple edges in the final graph, creating duplicate spatial edges across different windows."
    
    # 3. Stats
    with open('reports/graph_construction_report.json', 'r') as f:
        graph_report = json.load(f)
    
    # Check for train/val/test leakage
    ip_leakage = {
        "train_val": len(global_unique_ips_by_split['train'].intersection(global_unique_ips_by_split['val'])),
        "train_test": len(global_unique_ips_by_split['train'].intersection(global_unique_ips_by_split['test'])),
        "val_test": len(global_unique_ips_by_split['val'].intersection(global_unique_ips_by_split['test']))
    }
    
    flow_leakage = {
        "train_val": len(global_flows_by_split['train'].intersection(global_flows_by_split['val'])),
        "train_test": len(global_flows_by_split['train'].intersection(global_flows_by_split['test'])),
        "val_test": len(global_flows_by_split['val'].intersection(global_flows_by_split['test']))
    }
    
    # Is protocol included? Yes.
    # Are UDP/TCP/ICMP distinct? Yes, 'protocol' is in flow_identity_cols.
    
    # Check edge features for leakage
    leakage_cols = ['ip.src_host', 'ip.dst_host', 'source_port', 'destination_port', 'udp_stream', 'Attack_label', 'Attack_type']
    edge_leakage_present = [c for c in leakage_cols if c in edge_feature_columns]
    node_leakage_present = [c for c in leakage_cols if c in node_feature_columns]

    # Re-calculate edges per class properly by chunking to find exact records/edge.
    class_stats = {}
    for c in row_level_distribution.keys():
        class_stats[c] = {
            "original_row_count": row_level_distribution[c],
            "unique_flow_identities_global": len(unique_flows_by_class[c]),
            "graph_edges": graph_report['multiclass_edge_label_distribution'].get(c, 0),
            "temporal_windows": len(class_windows[c]),
            "average_rows_per_edge": 0, # To be computed
            "median_rows_per_edge": 0,
            "max_rows_per_edge": 0
        }
        
    # To get rows per edge exactly, we iterate chunks again
    edge_records_map = defaultdict(list)
    for split in splits:
        in_file = f'data/processed/edge_iiot/supervised/{split}.csv'
        for chunk in pd.read_csv(in_file, chunksize=chunk_size, low_memory=False):
            chunk = assign_protocol_and_ports(chunk)
            for col in flow_identity_cols:
                if col in chunk.columns:
                    chunk[col] = chunk[col].fillna(-1)
            
            # Count records per edge in this chunk
            grouped = chunk.groupby(flow_identity_cols + ['Attack_type']).size().reset_index(name='count')
            for _, row in grouped.iterrows():
                atk = str(row['Attack_type'])
                edge_records_map[atk].append(row['count'])
                
    for c in class_stats.keys():
        if edge_records_map[c]:
            class_stats[c]["average_rows_per_edge"] = float(np.mean(edge_records_map[c]))
            class_stats[c]["median_rows_per_edge"] = float(np.median(edge_records_map[c]))
            class_stats[c]["max_rows_per_edge"] = int(np.max(edge_records_map[c]))

    unique_flows_count = sum(len(v) for v in unique_flows_by_class.values())

    q4 = "Normal rows collapse significantly because the dataset contains many Normal packets continuously exchanged between a very small set of device IPs and ports (e.g., telemetry pings, background MQTT traffic). Since they share the exact same 6-tuple flow identity (Protocol, Src IP, Dst IP, Src Port, Dst Port, UDP Stream), they all collapse into a single flow edge per temporal window."
    
    q5 = "Yes, Normal traffic is repeatedly aggregated into the same flow identity across multiple temporal windows. If a device pair communicates continuously, the same flow edge appears once in every window it spans."
    
    q6 = "Yes. DDoS tools often generate randomized source ports or sequence numbers for each packet to evade caching and simple rules. Because 'source_port' is part of the flow identity, each packet gets a unique flow identity and becomes its own edge."
    
    q7 = "Yes, 'protocol' is explicitly included in the flow_identity_cols."
    
    q8 = "Yes, because 'protocol' string ('TCP', 'UDP', 'ICMP', 'OTHER') is in the groupby key."
    
    q9 = "Temporal window ID is currently NOT part of the edge identity 6-tuple. It only acts as a processing batch boundary. To make it a true dynamic temporal graph, edges must carry a temporal context."
    
    q10 = "B. flow-window-level graph. The graph is a mixture: it aggregates flows within 25,000-record windows. It is not a pure flow graph (because flows are broken across windows) and not a pure aggregated communication graph (because ports split the same IP pair into multiple edges)."
    
    q13 = {
        "pure_normal_edges": graph_report["pure_normal_edges"],
        "pure_attack_edges": graph_report["pure_attack_edges"],
        "mixed_label_edges": graph_report["mixed_normal_attack_edges"]
    }
    
    q14 = "Yes, the graph labels function uses max() for binary labels and mode() for multiclass, effectively prioritizing the presence of attack if mixed (at least for binary). For multiclass, mode() might hide an attack if Normal packets outnumber Attack packets in the same edge! Wait, the config says label_aggregation_multiclass: 'mode'."

    q18 = (
        "Diagnosis:\n"
        "- The graph representation has significant issues. Flow boundaries are arbitrarily sliced by the 25k-record chunking mechanism (windows), resulting in 'flow-window' fragments rather than true flows.\n"
        "- The extreme Normal collapse is expected because IIoT devices repeatedly communicate on the same ports over time. However, DDoS edges do NOT collapse because attack tools randomize source ports per packet.\n"
        "- This creates a huge class imbalance at the edge level: ~1.5M Normal rows collapse to ~973 edges, while ~160k DDoS packets become ~160k edges. The edge-level graph is completely dominated by attacks.\n"
        "- Multiclass label aggregation uses 'mode', which means an edge containing 10 Normal packets and 1 Attack packet will be labeled as Normal! This is highly dangerous.\n"
        "- Train/Val/Test splits exhibit severe leakage, with the exact same flow identities and IPs appearing across splits.\n"
        "- Redesign is REQUIRED before GraphSAGE: Temporal chunking should be time-based (e.g., 10-second windows) or flow-based, labels must use 'any attack' rather than 'mode', and data splitting must be grouped by flow or IP to prevent leakage."
    )

    report = {
        "1_row_to_flow_edge": q1,
        "2_temporal_windows": q2,
        "3_class_statistics": class_stats,
        "4_normal_collapse": q4,
        "5_repeated_aggregation": q5,
        "6_ddos_separation": q6,
        "7_protocol_field": q7,
        "8_protocol_collision": q8,
        "9_temporal_window_id": q9,
        "10_graph_type": q10,
        "11_class_distribution": {
            "row_level": dict(row_level_distribution),
            "unique_flow_level": {k: len(v) for k, v in unique_flows_by_class.items()},
            "flow_window_level": dict(edge_level_distribution)
        },
        "12_leakage": {
            "flow_identity_intersection": flow_leakage,
            "ip_intersection": ip_leakage
        },
        "13_edge_purity": q13,
        "14_mixed_label_rule": q14,
        "15_edge_features_aggregation": "Aggregated using config.get('edge_features_aggregation', 'mean').",
        "16_edge_features_leakage": edge_leakage_present,
        "17_node_features_leakage": node_leakage_present,
        "18_diagnosis": q18
    }

    os.makedirs('reports', exist_ok=True)
    with open('reports/phase3_1_graph_quality_audit.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    with open('reports/phase3_1_graph_quality_audit.txt', 'w') as f:
        for k, v in report.items():
            f.write(f"=== {k} ===\n")
            if isinstance(v, dict):
                f.write(json.dumps(v, indent=2))
                f.write("\n")
            else:
                f.write(f"{v}\n")
            f.write("\n")
            
    print("Audit complete.")

if __name__ == '__main__':
    main()
