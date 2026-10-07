import os
import glob
import pandas as pd
import numpy as np
import torch
import torch.nn as torch_nn
from torch.utils.data import TensorDataset, DataLoader
import hashlib
import json
import warnings
import sys
import time
import random
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score
from scipy.spatial.distance import jensenshannon

warnings.filterwarnings("ignore")

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def compute_metrics(labels, preds):
    labels = np.array(labels)
    preds = np.array(preds)
    pred_labels = (preds >= 0.5).astype(int)
    try:
        acc = float(accuracy_score(labels, pred_labels))
        prec = float(precision_score(labels, pred_labels, zero_division=0))
        rec = float(recall_score(labels, pred_labels, zero_division=0))
        f1 = float(f1_score(labels, pred_labels, zero_division=0))
        roc_auc = float(roc_auc_score(labels, preds)) if len(np.unique(labels)) > 1 else 0.0
        pr_auc = float(average_precision_score(labels, preds)) if len(np.unique(labels)) > 1 else 0.0
    except:
        acc, prec, rec, f1, roc_auc, pr_auc = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    return {"Accuracy": acc, "Precision": prec, "Recall": rec, "F1": f1, "ROC-AUC": roc_auc, "PR-AUC": pr_auc}

class EdgeMLP(torch_nn.Module):
    def __init__(self, edge_dim=31):
        super().__init__()
        self.mlp = torch_nn.Sequential(
            torch_nn.Linear(edge_dim, 128),
            torch_nn.ReLU(),
            torch_nn.Dropout(0.3),
            torch_nn.Linear(128, 1)
        )
    def forward(self, edge_attr):
        return self.mlp(edge_attr)

class ClientSimulatorPhase81:
    def __init__(self, severity_level):
        self.severity_level = severity_level
        # Define distribution matrix [C1, C2, C3] percentages
        if severity_level == 'iid':
            self.dist = {'ddos': [33, 33, 34], 'scan': [33, 33, 34], 'inj': [33, 33, 34], 'other': [33, 33, 34]}
        elif severity_level == 'mild':
            self.dist = {'ddos': [50, 25, 25], 'scan': [25, 50, 25], 'inj': [25, 25, 50], 'other': [33, 33, 34]}
        elif severity_level == 'moderate':
            self.dist = {'ddos': [70, 15, 15], 'scan': [15, 70, 15], 'inj': [15, 15, 70], 'other': [33, 33, 34]}
        elif severity_level == 'severe':
            self.dist = {'ddos': [90, 5, 5], 'scan': [5, 90, 5], 'inj': [5, 5, 90], 'other': [33, 33, 34]}
        else:
            raise ValueError("Unknown severity level")
            
    def get_client_id(self, attack_type, src_ip, dst_ip):
        atk = str(attack_type).lower()
        h = int(hashlib.md5(f"{src_ip}_{dst_ip}_{attack_type}".encode()).hexdigest(), 16) % 100
        
        if atk == 'normal':
            group = 'other'
        elif 'ddos' in atk or 'dos' in atk:
            group = 'ddos'
        elif 'port_scanning' in atk or 'vulnerability_scanner' in atk or 'fingerprinting' in atk:
            group = 'scan'
        elif 'sql_injection' in atk or 'xss' in atk:
            group = 'inj'
        else:
            group = 'other'
            
        c1_thresh = self.dist[group][0]
        c2_thresh = c1_thresh + self.dist[group][1]
        
        if h < c1_thresh: return 1
        elif h < c2_thresh: return 2
        else: return 3

def load_partitioned_data(data_dir, split, client_sim):
    windows = sorted(glob.glob(os.path.join(data_dir, split, 'window_*')))
    clients = {1: {"x": [], "y": [], "attack_type": []}, 2: {"x": [], "y": [], "attack_type": []}, 3: {"x": [], "y": [], "attack_type": []}}
    
    for w_dir in windows:
        edges_df = pd.read_csv(os.path.join(w_dir, 'edges.csv'), low_memory=False)
        edge_feat_cols = [c for c in edges_df.columns if c not in ['src_ip', 'dst_ip', 'Attack_label', 'Attack_type', 'num_records']]
        
        for _, row in edges_df.iterrows():
            cid = client_sim.get_client_id(row['Attack_type'], row['src_ip'], row['dst_ip'])
            features = row[edge_feat_cols].values.astype(np.float32)
            label = float(row['Attack_label'])
            atk_type = str(row['Attack_type'])
            
            clients[cid]["x"].append(features)
            clients[cid]["y"].append(label)
            clients[cid]["attack_type"].append(atk_type)
            
    for cid in clients:
        if len(clients[cid]["x"]) > 0:
            clients[cid]["x"] = torch.tensor(np.stack(clients[cid]["x"]))
            clients[cid]["y"] = torch.tensor(np.array(clients[cid]["y"], dtype=np.float32))
        else:
            clients[cid]["x"] = torch.empty((0, len(edge_feat_cols)))
            clients[cid]["y"] = torch.empty((0,))
            
    return clients

def calculate_jsd(client_distributions, global_distribution):
    jsd_values = {}
    glob_arr = np.array(list(global_distribution.values()), dtype=np.float64)
    glob_arr /= glob_arr.sum()
    
    for cid, dist in client_distributions.items():
        cli_arr = np.array([dist.get(k, 0) for k in global_distribution.keys()], dtype=np.float64)
        if cli_arr.sum() > 0:
            cli_arr /= cli_arr.sum()
            jsd_values[cid] = jensenshannon(cli_arr, glob_arr) ** 2
        else:
            jsd_values[cid] = 0.0
            
    return jsd_values

def eval_local(model, loader, device):
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            out = model(x).squeeze(-1)
            all_preds.extend(torch.sigmoid(out).cpu().numpy())
            all_labels.extend(y.numpy())
    return all_preds, all_labels

def evaluate_global(model, test_loaders_dict, device):
    all_preds, all_labels = [], []
    client_metrics = []
    
    for cid, loader in test_loaders_dict.items():
        p, l = eval_local(model, loader, device)
        all_preds.extend(p)
        all_labels.extend(l)
        
        cm = compute_metrics(l, p)
        cm['Client'] = cid
        client_metrics.append(cm)
        
    global_metric = compute_metrics(all_labels, all_preds)
    return global_metric, client_metrics

def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    for batch in loader:
        x, y = batch[0].to(device), batch[1].to(device)
        optimizer.zero_grad()
        out = model(x).squeeze(-1)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()

def aggregate_weights(weights_list, sample_counts):
    total_samples = sum(sample_counts)
    agg_weights = []
    for i in range(len(weights_list[0])):
        layer_sum = sum(w[i] * n for w, n in zip(weights_list, sample_counts))
        agg_weights.append(layer_sum / total_samples)
    return agg_weights

def main():
    os.makedirs('results/phase8_1', exist_ok=True)
    os.makedirs('results/phase8_1/plots', exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    data_path = 'graph_data/phase4_2_canonical_flow'
    batch_size = 256
    epochs = 10
    
    severities = ['iid', 'mild', 'moderate', 'severe']
    
    summary_results = []
    all_jsd = []
    
    for sev in severities:
        print(f"\n==============================================")
        print(f"Starting Severity Level: {sev.upper()}")
        print(f"==============================================")
        
        os.makedirs(f'results/phase8_1/{sev}', exist_ok=True)
        set_seed(42)
        
        client_sim = ClientSimulatorPhase81(sev)
        train_data = load_partitioned_data(data_path, 'train', client_sim)
        test_data = load_partitioned_data(data_path, 'test', client_sim)
        
        # Calculate Distributions & JSD
        global_dist = {}
        client_dists = {1: {}, 2: {}, 3: {}}
        
        for cid in [1, 2, 3]:
            for atk in train_data[cid]["attack_type"]:
                global_dist[atk] = global_dist.get(atk, 0) + 1
                client_dists[cid][atk] = client_dists[cid].get(atk, 0) + 1
                
        jsd_vals = calculate_jsd(client_dists, global_dist)
        mean_jsd = np.mean(list(jsd_vals.values()))
        
        all_jsd.append({
            "Severity": sev.capitalize(),
            "Client_1_JSD": jsd_vals[1],
            "Client_2_JSD": jsd_vals[2],
            "Client_3_JSD": jsd_vals[3],
            "Mean_JSD": mean_jsd
        })
        
        train_loaders = {}
        test_loaders = {}
        
        for cid in [1, 2, 3]:
            train_ds = TensorDataset(train_data[cid]['x'], train_data[cid]['y'])
            test_ds = TensorDataset(test_data[cid]['x'], test_data[cid]['y'])
            train_loaders[cid] = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
            test_loaders[cid] = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
            
        global_model = EdgeMLP(edge_dim=31).to(device)
        criterion = torch_nn.BCEWithLogitsLoss(pos_weight=torch.tensor([0.4622]).to(device))
        
        global_metrics_list = []
        client_metrics_list = []
        
        for r in range(1, epochs + 1):
            global_weights = [val.cpu().numpy() for _, val in global_model.state_dict().items()]
            client_weights = []
            client_samples = []
            
            for cid in [1, 2, 3]:
                local_model = EdgeMLP(edge_dim=31).to(device)
                params_dict = zip(local_model.state_dict().keys(), global_weights)
                state_dict = {k: torch.tensor(v) for k, v in params_dict}
                local_model.load_state_dict(state_dict, strict=True)
                
                optimizer = torch.optim.AdamW(local_model.parameters(), lr=1e-3, weight_decay=1e-4)
                train_epoch(local_model, train_loaders[cid], optimizer, criterion, device)
                
                c_weights = [val.cpu().numpy() for _, val in local_model.state_dict().items()]
                c_samples = len(train_loaders[cid].dataset)
                client_weights.append(c_weights)
                client_samples.append(c_samples)
                
            agg_weights = aggregate_weights(client_weights, client_samples)
            params_dict = zip(global_model.state_dict().keys(), agg_weights)
            state_dict = {k: torch.tensor(v) for k, v in params_dict}
            global_model.load_state_dict(state_dict, strict=True)
            
            g_metrics, c_metrics = evaluate_global(global_model, test_loaders, device)
            g_metrics['Round'] = r
            for cm in c_metrics: cm['Round'] = r
            
            global_metrics_list.append(g_metrics)
            client_metrics_list.extend(c_metrics)
            print(f"Round {r} F1: {g_metrics['F1']:.4f}")
            
        torch.save(global_model.state_dict(), f'results/phase8_1/{sev}/final_model.pth')
        pd.DataFrame(global_metrics_list).to_csv(f'results/phase8_1/{sev}/global_metrics.csv', index=False)
        pd.DataFrame(client_metrics_list).to_csv(f'results/phase8_1/{sev}/client_metrics.csv', index=False)
        
        best_r = max(global_metrics_list, key=lambda x: x['F1'])
        c_best = [c for c in client_metrics_list if c['Round'] == best_r['Round']]
        c_f1s = [c['F1'] for c in c_best]
        
        summary_results.append({
            "Severity": sev.capitalize(),
            "Mean_JSD": mean_jsd,
            "Global_F1": best_r['F1'],
            "Global_PR_AUC": best_r['PR-AUC'],
            "Mean_Client_F1": np.mean(c_f1s),
            "Worst_Client_F1": np.min(c_f1s),
            "Client_F1_Std": np.std(c_f1s)
        })
        
    pd.DataFrame(summary_results).to_csv('results/phase8_1/summary.csv', index=False)
    pd.DataFrame(all_jsd).to_csv('results/phase8_1/heterogeneity_metrics.csv', index=False)

if __name__ == "__main__":
    main()
