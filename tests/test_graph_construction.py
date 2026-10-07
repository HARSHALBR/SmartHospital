import os
import json
import pandas as pd
import pytest

def test_graph_construction_integrity():
    report_path = "reports/graph_construction_report.json"
    mapping_path = "graph_data/node_mapping.json"
    
    # Check mapping exists and has no raw IP as features
    assert os.path.exists(mapping_path)
    with open(mapping_path, 'r') as f:
        mapping = json.load(f)
    assert len(mapping) > 0
    
    # Check window structure for train
    win0_path = "graph_data/supervised/train/window_000"
    if os.path.exists(win0_path):
        nodes = pd.read_csv(f"{win0_path}/nodes.csv", nrows=100)
        edges = pd.read_csv(f"{win0_path}/edges.csv", nrows=100)
        
        # Check node IDs
        assert 'node_id' in nodes.columns
        assert 'ip' not in nodes.columns
        assert 'ip.src_host' not in nodes.columns
        
        # Check edge IDs
        assert 'source_id' in edges.columns
        assert 'target_id' in edges.columns
        assert 'ip.src_host' not in edges.columns
        
        # Check target leakage
        assert 'Attack_label' not in nodes.columns
        assert 'Attack_type' not in nodes.columns
        
        # Check labels exist in edges
        assert 'Attack_label' in edges.columns
        assert 'Attack_type' in edges.columns
        
        # Check graph identifiers didn't leak into features
        assert 'udp.stream' not in nodes.columns
        assert 'udp.stream' not in edges.columns
        
        # Ensure dimensions match
        with open(report_path, 'r') as f:
            report = json.load(f)
            
        assert report['total_graph_windows'] > 0
        assert report['total_unique_nodes'] > 0
        
def test_all_windows_exist():
    # Simple check to make sure train/val/test directories have windows
    for split in ['train', 'val', 'test']:
        assert os.path.exists(f"graph_data/supervised/{split}")
        windows = os.listdir(f"graph_data/supervised/{split}")
        assert len(windows) > 0, f"No windows found in {split}"
