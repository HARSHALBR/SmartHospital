import pytest
import pandas as pd
import json
import os

def check_split_integrity(config_path, train_path, report_path):
    assert os.path.exists(config_path), f"Config file {config_path} missing"
    with open(config_path, "r") as f:
        config = json.load(f)
        
    df = pd.read_csv(train_path, nrows=100)
    
    for t in config["targets"]:
        assert t in df.columns, f"Target {t} missing from output"
        
    for g in config["graph_identifiers"]:
        assert g in df.columns, f"Graph identifier {g} missing from output"
        
    assert os.path.exists(report_path), f"Report {report_path} missing"
    with open(report_path, "r") as f:
        report = json.load(f)
        
    if "leakage_checks" in report:
        leakage = report["leakage_checks"]
        assert not leakage.get("targets_in_model_features")
        assert not leakage.get("graph_identifiers_in_model_features")
        assert not leakage.get("excluded_cols_in_model_features")
    
    if "verification" in report:
        ver = report["verification"]
        assert ver.get("targets_excluded_from_model")
        assert ver.get("graph_identifiers_excluded_from_model")

def test_chronological_preprocessing_integrity():
    check_split_integrity(
        "configs/preprocessing_config.json", 
        "data/processed/edge_iiot/train.csv", 
        "reports/preprocessing_report.json"
    )

def test_supervised_preprocessing_integrity():
    if os.path.exists("data/processed/edge_iiot/supervised/train.csv"):
        check_split_integrity(
            "configs/supervised_split_config.json", 
            "data/processed/edge_iiot/supervised/train.csv", 
            "reports/supervised_split_report.json"
        )
