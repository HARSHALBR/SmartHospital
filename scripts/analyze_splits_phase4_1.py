import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from collections import Counter

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

def get_binary_label(multi):
    return "Normal" if multi == "Normal" else "Attack"

def analyze_split(name, train_df, val_df, test_df):
    stats = {}
    for split_name, df in zip(['Train', 'Val', 'Test'], [train_df, val_df, test_df]):
        total_rows = len(df)
        binary_counts = df['binary_label'].value_counts()
        atk_types = df['Attack_type'].unique().tolist()
        
        normal_pct = binary_counts.get('Normal', 0) / max(total_rows, 1)
        attack_pct = binary_counts.get('Attack', 0) / max(total_rows, 1)
        
        unique_flows = set(df['flow_id'])
        unique_ips = set(df['ip.src_host']).union(set(df['ip.dst_host']))
        
        if df['parsed_time'].isna().all():
            t_min, t_max = "None", "None"
        else:
            t_min = df['parsed_time'].min()
            t_max = df['parsed_time'].max()
            
        stats[split_name] = {
            "Total_Rows": int(total_rows),
            "Normal_Pct": float(normal_pct),
            "Attack_Pct": float(attack_pct),
            "Unique_Flows": len(unique_flows),
            "Unique_IPs": len(unique_ips),
            "Attack_Type_Coverage": len(atk_types),
            "Time_Min": str(t_min),
            "Time_Max": str(t_max),
            "flow_set": unique_flows,
            "ip_set": unique_ips
        }
        
    # Intersections
    f_train, f_val, f_test = stats['Train']['flow_set'], stats['Val']['flow_set'], stats['Test']['flow_set']
    stats['Overlap'] = {
        "Flow_Train_Val": len(f_train.intersection(f_val)),
        "Flow_Train_Test": len(f_train.intersection(f_test)),
        "Flow_Val_Test": len(f_val.intersection(f_test)),
        "IP_Train_Val": len(stats['Train']['ip_set'].intersection(stats['Val']['ip_set'])),
        "IP_Train_Test": len(stats['Train']['ip_set'].intersection(stats['Test']['ip_set']))
    }
    
    for s in ['Train', 'Val', 'Test']:
        del stats[s]['flow_set']
        del stats[s]['ip_set']
        
    return stats

def main():
    print("Loading raw dataset...")
    df = pd.read_csv('data/raw/edge_iiot/DNN-EdgeIIoT-dataset.csv', low_memory=False)
    
    # Essential columns only to save memory
    cols = ['ip.src_host', 'ip.dst_host', 'tcp.srcport', 'tcp.dstport', 'udp.port', 'udp.stream', 'icmp.seq_le', 'frame.time', 'Attack_label', 'Attack_type']
    df = df[cols].copy()
    
    df['ip.src_host'] = df['ip.src_host'].fillna('unknown')
    df['ip.dst_host'] = df['ip.dst_host'].fillna('unknown')
    df['flow_id'] = df.apply(get_proposed_flow_id, axis=1)
    
    df['parsed_time'] = pd.to_datetime(df['frame.time'].astype(str).str[:19], errors='coerce')
    df['binary_label'] = df['Attack_type'].apply(lambda x: 'Normal' if x == 'Normal' else 'Attack')
    
    print("Total records:", len(df))
    print("Total unique flows:", df['flow_id'].nunique())
    
    report = {}
    
    # -------------------------------------------------------------------------
    # A. Current Coarse Split (Phase 3.2 logic)
    # -------------------------------------------------------------------------
    print("Simulating Split A (Coarse IP-Protocol pair)...")
    def get_protocol(row):
        if pd.notna(row.get('tcp.srcport')) and row.get('tcp.srcport') != -1: return 'TCP'
        elif pd.notna(row.get('udp.port')) and row.get('udp.port') != -1: return 'UDP'
        elif pd.notna(row.get('icmp.seq_le')) and row.get('icmp.seq_le') != -1: return 'ICMP'
        return 'OTHER'
    
    df['protocol'] = df.apply(get_protocol, axis=1)
    def make_pair(row):
        ips = sorted([str(row['ip.src_host']), str(row['ip.dst_host'])])
        return f"{ips[0]}-{ips[1]}-{row['protocol']}"
    df['coarse_pair'] = df.apply(make_pair, axis=1)
    
    coarse_groups = df.groupby('coarse_pair')['Attack_type'].apply(list).reset_index()
    coarse_groups['flow_label'] = coarse_groups['Attack_type'].apply(compute_multiclass_label)
    counts = coarse_groups['flow_label'].value_counts()
    valid_labels = counts[counts >= 3].index
    coarse_groups['strat_label'] = coarse_groups['flow_label'].apply(lambda x: x if x in valid_labels else 'RARE')
    
    tr, te = train_test_split(coarse_groups, test_size=0.30, stratify=coarse_groups['strat_label'], random_state=42)
    # fix stratification for second split
    te = te.copy()
    te_c = te['strat_label'].value_counts()
    v_l = te_c[te_c >= 2].index
    te['strat_label'] = te['strat_label'].apply(lambda x: x if x in v_l else 'RARE')
    va, te = train_test_split(te, test_size=0.50, stratify=te['strat_label'], random_state=42)
    
    tr_mask = df['coarse_pair'].isin(set(tr['coarse_pair']))
    va_mask = df['coarse_pair'].isin(set(va['coarse_pair']))
    te_mask = df['coarse_pair'].isin(set(te['coarse_pair']))
    report['Split_A_Phase3_2_Coarse'] = analyze_split('Split_A', df[tr_mask], df[va_mask], df[te_mask])
    
    # -------------------------------------------------------------------------
    # B. Stratified Flow-Group Split (Exact canonical flow id)
    # -------------------------------------------------------------------------
    print("Simulating Split B (Canonical Flow Identity)...")
    exact_groups = df.groupby('flow_id')['Attack_type'].apply(list).reset_index()
    exact_groups['flow_label'] = exact_groups['Attack_type'].apply(compute_multiclass_label)
    
    counts = exact_groups['flow_label'].value_counts()
    valid_labels = counts[counts >= 3].index
    exact_groups['strat_label'] = exact_groups['flow_label'].apply(lambda x: x if x in valid_labels else 'RARE')
    
    tr, te = train_test_split(exact_groups, test_size=0.30, stratify=exact_groups['strat_label'], random_state=42)
    te = te.copy()
    te_c = te['strat_label'].value_counts()
    v_l = te_c[te_c >= 2].index
    te['strat_label'] = te['strat_label'].apply(lambda x: x if x in v_l else 'RARE')
    va, te = train_test_split(te, test_size=0.50, stratify=te['strat_label'], random_state=42)
    
    tr_mask = df['flow_id'].isin(set(tr['flow_id']))
    va_mask = df['flow_id'].isin(set(va['flow_id']))
    te_mask = df['flow_id'].isin(set(te['flow_id']))
    report['Split_B_Canonical_Flow'] = analyze_split('Split_B', df[tr_mask], df[va_mask], df[te_mask])
    
    # -------------------------------------------------------------------------
    # D. Row-level stratified (IID) to show baseline distribution
    # -------------------------------------------------------------------------
    print("Simulating Split C (IID Row Level)...")
    tr, te = train_test_split(df, test_size=0.30, stratify=df['Attack_type'], random_state=42)
    va, te = train_test_split(te, test_size=0.50, stratify=te['Attack_type'], random_state=42)
    report['Split_C_IID_Row_Level'] = analyze_split('Split_C', tr, va, te)
    
    # Output
    with open('reports/phase4_1_split_analysis.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    # Write MD Report
    with open('reports/phase4_1_split_analysis.md', 'w') as f:
        f.write("# Phase 4.1 Data Split Analysis\n\n")
        f.write("## 1. Analysis of the Phase 3.2 Coarse Split\n")
        f.write("In Phase 3.2, the split was performed based on `SrcIP-DstIP-Protocol`. ")
        f.write("Because ports were excluded, ALL traffic between two IPs over a specific protocol collapsed into a single identity. ")
        f.write("One such pair contained virtually all background Normal IIoT traffic, acting as a single massive 'flow group' that got entirely assigned to the Test set. ")
        f.write("This completely skewed the Test split (which received almost all Normal traffic) vs the Train split (which received most DDoS traffic).\n\n")
        
        f.write("## 2. Split Strategy Results\n")
        for k, v in report.items():
            f.write(f"### {k}\n")
            f.write(f"- Train: Normal={v['Train']['Normal_Pct']:.1%} | Attack={v['Train']['Attack_Pct']:.1%}\n")
            f.write(f"- Val  : Normal={v['Val']['Normal_Pct']:.1%} | Attack={v['Val']['Attack_Pct']:.1%}\n")
            f.write(f"- Test : Normal={v['Test']['Normal_Pct']:.1%} | Attack={v['Test']['Attack_Pct']:.1%}\n")
            f.write(f"- Identical Flow Overlap (Train/Test): {v['Overlap']['Flow_Train_Test']}\n")
            f.write(f"- IP Endpoint Overlap (Train/Test): {v['Overlap']['IP_Train_Test']}\n\n")
            
        f.write("## 3. Scientific Interpretation\n")
        f.write("- **IID Row Level (Split C)**: Perfect class balance, but massive target leakage because the exact same flow identity is present in both Train and Test. Does not answer if the model generalizes to new flows.\n")
        f.write("- **Coarse IP-Protocol Split (Split A)**: 0 flow leakage, but ruins class distribution due to huge macro-flows. Answers if the model generalizes to entirely unseen host pairs.\n")
        f.write("- **Canonical Flow Identity (Split B)**: Stratifies based on exact port-aware flows. Maintains 0 train/test overlap of communication streams, while hopefully allowing the model to see Normal flows distributed correctly across splits.\n\n")
        
        f.write("## 4. Proposed Experiment Structure\n")
        f.write("**Primary Evaluation**: Stratified Canonical Flow-Group Split (Split B). This prevents identically repeated communication streams from being memorized, while mathematically attempting to balance classes across splits. This allows evaluation on strictly unseen logical sessions while maintaining structural integrity.\n")
        
    print("Done!")

if __name__ == "__main__":
    main()
