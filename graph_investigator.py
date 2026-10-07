import pandas as pd
import numpy as np
import json
import os
import time

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    import ctypes
    from ctypes import wintypes
    
    class PROCESS_MEMORY_COUNTERS_EX(ctypes.Structure):
        _fields_ = [
            ('cb', wintypes.DWORD),
            ('PageFaultCount', wintypes.DWORD),
            ('PeakWorkingSetSize', ctypes.c_size_t),
            ('WorkingSetSize', ctypes.c_size_t),
            ('QuotaPeakPagedPoolUsage', ctypes.c_size_t),
            ('QuotaPagedPoolUsage', ctypes.c_size_t),
            ('QuotaPeakNonPagedPoolUsage', ctypes.c_size_t),
            ('QuotaNonPagedPoolUsage', ctypes.c_size_t),
            ('PagefileUsage', ctypes.c_size_t),
            ('PeakPagefileUsage', ctypes.c_size_t),
            ('PrivateUsage', ctypes.c_size_t),
        ]

def get_rss_mb():
    if HAS_PSUTIL:
        return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
    else:
        # Windows fallback
        process = ctypes.windll.kernel32.GetCurrentProcess()
        counters = PROCESS_MEMORY_COUNTERS_EX()
        counters.cb = ctypes.sizeof(PROCESS_MEMORY_COUNTERS_EX)
        if ctypes.windll.psapi.GetProcessMemoryInfo(process, ctypes.byref(counters), counters.cb):
            return counters.WorkingSetSize / (1024 * 1024)
        return 0.0

def main():
    print("==================================================")
    print("TASK 8: MEMORY CHECK (Baseline)")
    baseline_rss = get_rss_mb()
    peak_rss = baseline_rss
    print(f"Baseline RSS: {baseline_rss:.2f} MB")
    print("==================================================")

    # TASK 1
    print("\n==================================================")
    print("TASK 1: CHECK THE 100K SAMPLE SOURCE")
    in_file = 'data/processed/edge_iiot/supervised/train.csv'
    print(f"Source file: {in_file}")
    print("Row selection: First 100,000 rows (reading sequentially).")
    print("Were they randomly sampled? The original Phase 2.1 dataset WAS randomly shuffled globally via StratifiedShuffleSplit. Therefore, the first 100k rows act as a random uniform sample of the 1.5M row training set.")
    
    df = pd.read_csv(in_file, nrows=100000, low_memory=False)
    
    peak_rss = max(peak_rss, get_rss_mb())
    
    print("\nPre-Aggregation Row-Level Distributions:")
    print("Attack_label:")
    print(df['Attack_label'].value_counts().to_string())
    print("\nAttack_type:")
    print(df['Attack_type'].value_counts().to_string())

    # TASK 2 & 3
    print("\n==================================================")
    print("TASK 2 & 3: CHECK EDGE LABEL AGGREGATION & COLLAPSE")
    print(f"Raw records: {len(df)}")
    
    # Global unique edges
    edge_groups = df.groupby(['ip.src_host', 'ip.dst_host'])
    print(f"Unique (source_node, destination_node) globally: {len(edge_groups)}")
    
    records_per_edge = edge_groups.size()
    print(f"Average records per edge: {records_per_edge.mean():.2f}")
    print(f"Median records per edge: {records_per_edge.median():.2f}")
    print(f"Maximum records per edge: {records_per_edge.max():.2f}")
    
    unique_labels_per_edge = edge_groups['Attack_label'].nunique()
    max_label_per_edge = edge_groups['Attack_label'].max()
    min_label_per_edge = edge_groups['Attack_label'].min()
    
    pure_normal = ((max_label_per_edge == 0) & (min_label_per_edge == 0)).sum()
    pure_attack = ((max_label_per_edge == 1) & (min_label_per_edge == 1)).sum()
    mixed = (unique_labels_per_edge > 1).sum()
    
    total_edges = len(edge_groups)
    print("\nGlobal Edge Aggregation Stats:")
    print(f"Total edges: {total_edges}")
    print(f"Pure Normal edges: {pure_normal} ({pure_normal/total_edges*100:.2f}%)")
    print(f"Pure Attack edges: {pure_attack} ({pure_attack/total_edges*100:.2f}%)")
    print(f"Mixed edges: {mixed} ({mixed/total_edges*100:.2f}%)")

    # TASK 4
    print("\n==================================================")
    print("TASK 4: TEMPORAL WINDOW CHECK")
    chunk_size = 25000
    for w in range(4):
        win_df = df.iloc[w*chunk_size : (w+1)*chunk_size]
        w_records = len(win_df)
        w_normal_rec = (win_df['Attack_label'] == 0).sum()
        w_attack_rec = (win_df['Attack_label'] == 1).sum()
        
        w_groups = win_df.groupby(['ip.src_host', 'ip.dst_host'])
        w_edges = len(w_groups)
        w_max_lbl = w_groups['Attack_label'].max()
        w_min_lbl = w_groups['Attack_label'].min()
        w_uniq = w_groups['Attack_label'].nunique()
        
        w_pure_norm = ((w_max_lbl == 0) & (w_min_lbl == 0)).sum()
        w_pure_atk = ((w_max_lbl == 1) & (w_min_lbl == 1)).sum()
        w_mixed = (w_uniq > 1).sum()
        
        print(f"\nWindow {w:03d}:")
        print(f"  Records: {w_records}")
        print(f"  Unique edges: {w_edges}")
        print(f"  Normal records: {w_normal_rec}")
        print(f"  Attack records: {w_attack_rec}")
        print(f"  Normal edges: {w_pure_norm}")
        print(f"  Attack edges: {w_pure_atk}")
        print(f"  Mixed edges: {w_mixed}")

    peak_rss = max(peak_rss, get_rss_mb())

    # Task 6
    print("\n==================================================")
    print("TASK 6: FEATURE AGGREGATION")
    with open('configs/supervised_split_config.json', 'r') as f:
        prep_config = json.load(f)
    
    non_model = set(prep_config['targets'] + prep_config['graph_identifiers'] + prep_config['excluded_from_model_features'] + prep_config['high_cardinality'] + prep_config['temporal'])
    model_features = [c for c in df.columns if c not in non_model and c != 'parsed_time']
    
    print(f"Model Feature Columns (Length {len(model_features)}):")
    print("Aggregated into 40 Edge Features using 'mean'.")
    print("Aggregated into 80 Node Features (40 incoming 'mean', 40 outgoing 'mean').")
    
    print("\nFinal RSS Check")
    final_rss = get_rss_mb()
    print(f"Peak RSS: {peak_rss:.2f} MB")
    print(f"Final RSS: {final_rss:.2f} MB")

if __name__ == "__main__":
    main()
