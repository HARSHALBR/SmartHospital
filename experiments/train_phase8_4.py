import os
import glob
import pandas as pd
import numpy as np
import torch
import torch.nn as torch_nn
from torch.utils.data import TensorDataset, DataLoader
import hashlib
import warnings
import sys
import time
import random
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score
from scipy.spatial.distance import cosine

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
    def __init__(self, severity_level='severe'):
        self.severity_level = severity_level
        self.dist = {'ddos': [90, 5, 5], 'scan': [5, 90, 5], 'inj': [5, 5, 90], 'other': [33, 33, 34]}
            
    def get_client_id(self, attack_type, src_ip, dst_ip):
        atk = str(attack_type).lower()
        h = int(hashlib.md5(f"{src_ip}_{dst_ip}_{attack_type}".encode()).hexdigest(), 16) % 100
        
        if atk == 'normal': group = 'other'
        elif 'ddos' in atk or 'dos' in atk: group = 'ddos'
        elif 'port_scanning' in atk or 'vulnerability_scanner' in atk or 'fingerprinting' in atk: group = 'scan'
        elif 'sql_injection' in atk or 'xss' in atk: group = 'inj'
        else: group = 'other'
            
        c1_thresh = self.dist[group][0]
        c2_thresh = c1_thresh + self.dist[group][1]
        
        if h < c1_thresh: return 1
        elif h < c2_thresh: return 2
        else: return 3

def load_partitioned_data(data_dir, split, client_sim):
    windows = sorted(glob.glob(os.path.join(data_dir, split, 'window_*')))
    clients = {1: {"x": [], "y": []}, 2: {"x": [], "y": []}, 3: {"x": [], "y": []}}
    
    for w_dir in windows:
        edges_df = pd.read_csv(os.path.join(w_dir, 'edges.csv'), low_memory=False)
        edge_feat_cols = [c for c in edges_df.columns if c not in ['src_ip', 'dst_ip', 'Attack_label', 'Attack_type', 'num_records']]
        
        for _, row in edges_df.iterrows():
            cid = client_sim.get_client_id(row['Attack_type'], row['src_ip'], row['dst_ip'])
            features = row[edge_feat_cols].values.astype(np.float32)
            label = float(row['Attack_label'])
            clients[cid]["x"].append(features)
            clients[cid]["y"].append(label)
            
    for cid in clients:
        if len(clients[cid]["x"]) > 0:
            clients[cid]["x"] = torch.tensor(np.stack(clients[cid]["x"]))
            clients[cid]["y"] = torch.tensor(np.array(clients[cid]["y"], dtype=np.float32))
        else:
            clients[cid]["x"] = torch.empty((0, len(edge_feat_cols)))
            clients[cid]["y"] = torch.empty((0,))
            
    return clients

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

def aggregate_fedavg(weights_list, sample_counts):
    total_samples = sum(sample_counts)
    agg_weights = []
    for i in range(len(weights_list[0])):
        layer_sum = sum(w[i] * n for w, n in zip(weights_list, sample_counts))
        agg_weights.append(layer_sum / total_samples)
    return agg_weights

def aggregate_median(weights_list):
    agg_weights = []
    for i in range(len(weights_list[0])):
        stacked = np.stack([w[i] for w in weights_list], axis=0)
        layer_median = np.median(stacked, axis=0)
        agg_weights.append(layer_median)
    return agg_weights

def get_flat_update(local_w, global_w):
    updates = [ (l - g).flatten() for l, g in zip(local_w, global_w) ]
    return np.concatenate(updates)

def calc_norm(v):
    return np.linalg.norm(v)

def calc_cosine_sim(v1, v2):
    if calc_norm(v1) == 0 or calc_norm(v2) == 0:
        return 0.0
    return 1 - cosine(v1, v2)

def run_byzantine_experiment(scenario_name, aggregator, malicious_clients, alpha, train_loaders, test_loaders, device):
    epochs = 10
    set_seed(42)
    
    global_model = EdgeMLP(edge_dim=31).to(device)
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=torch.tensor([0.4622]).to(device))
    
    global_metrics_list = []
    client_metrics_list = []
    diagnostics_list = []
    
    start_time = time.time()
    
    for r in range(1, epochs + 1):
        global_weights = [val.cpu().numpy() for _, val in global_model.state_dict().items()]
        
        client_weights = []
        client_samples = []
        updates_flat = {}
        
        for cid in [1, 2, 3]:
            local_model = EdgeMLP(edge_dim=31).to(device)
            params_dict = zip(local_model.state_dict().keys(), global_weights)
            state_dict = {k: torch.tensor(v) for k, v in params_dict}
            local_model.load_state_dict(state_dict, strict=True)
            
            optimizer = torch.optim.AdamW(local_model.parameters(), lr=1e-3, weight_decay=1e-4)
            train_epoch(local_model, train_loaders[cid], optimizer, criterion, device)
            
            c_weights = [val.cpu().numpy() for _, val in local_model.state_dict().items()]
            c_samples = len(train_loaders[cid].dataset)
            
            if cid in malicious_clients:
                # Sign flip attack: delta_byz = -alpha * delta_k
                byz_weights = []
                for lw, gw in zip(c_weights, global_weights):
                    delta_k = lw - gw
                    delta_byz = -alpha * delta_k
                    byz_weights.append(gw + delta_byz)
                c_weights = byz_weights
                
            client_weights.append(c_weights)
            client_samples.append(c_samples)
            
            updates_flat[cid] = get_flat_update(c_weights, global_weights)
            
        honest_cids = [c for c in [1, 2, 3] if c not in malicious_clients]
        byz_cids = malicious_clients
        
        honest_norms = [calc_norm(updates_flat[c]) for c in honest_cids]
        mean_honest_norm = np.mean(honest_norms) if honest_norms else 0.0
        
        byz_norms = [calc_norm(updates_flat[c]) for c in byz_cids]
        mean_byz_norm = np.mean(byz_norms) if byz_norms else 0.0
        
        if honest_cids and byz_cids:
            cos_sims = [calc_cosine_sim(updates_flat[c], updates_flat[honest_cids[0]]) for c in byz_cids]
            mean_cos_sim = np.mean(cos_sims)
        else:
            mean_cos_sim = 0.0
            
        if aggregator == 'fedavg':
            agg_weights = aggregate_fedavg(client_weights, client_samples)
        elif aggregator == 'median':
            agg_weights = aggregate_median(client_weights)
            
        global_update = get_flat_update(agg_weights, global_weights)
        global_norm = calc_norm(global_update)
        
        diagnostics_list.append({
            "Round": r,
            "Mean_Honest_Norm": mean_honest_norm,
            "Mean_Byzantine_Norm": mean_byz_norm,
            "Global_Update_Norm": global_norm,
            "Cosine_Similarity": mean_cos_sim
        })
            
        params_dict = zip(global_model.state_dict().keys(), agg_weights)
        state_dict = {k: torch.tensor(v) for k, v in params_dict}
        global_model.load_state_dict(state_dict, strict=True)
        
        g_metrics, c_metrics = evaluate_global(global_model, test_loaders, device)
        g_metrics['Round'] = r
        for cm in c_metrics: cm['Round'] = r
        
        global_metrics_list.append(g_metrics)
        client_metrics_list.extend(c_metrics)
        print(f"[{scenario_name}] Round {r} F1: {g_metrics['F1']:.4f}")
        
    dur = time.time() - start_time
    return global_metrics_list, client_metrics_list, diagnostics_list, dur

def main():
    os.makedirs('results/phase8_4', exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    data_path = 'graph_data/phase4_2_canonical_flow'
    batch_size = 256
    
    print("Loading Severe Non-IID Partition...")
    client_sim = ClientSimulatorPhase81('severe')
    train_data = load_partitioned_data(data_path, 'train', client_sim)
    test_data = load_partitioned_data(data_path, 'test', client_sim)
    
    train_loaders = {}
    test_loaders = {}
    
    for cid in [1, 2, 3]:
        train_ds = TensorDataset(train_data[cid]['x'], train_data[cid]['y'])
        test_ds = TensorDataset(test_data[cid]['x'], test_data[cid]['y'])
        
        train_loaders[cid] = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        test_loaders[cid] = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
        
    scenarios = [
        {"name": "Clean", "malicious": []},
        {"name": "Attack_C1", "malicious": [1]},
        {"name": "Attack_C2", "malicious": [2]},
        {"name": "Attack_C3", "malicious": [3]},
        {"name": "Attack_C1_C2_Extreme", "malicious": [1, 2]}
    ]
    
    aggregators = ['fedavg', 'median']
    alpha = 5
    
    summary_results = []
    
    for agg in aggregators:
        for sc in scenarios:
            scenario_name = f"{agg}_{sc['name']}"
            print(f"\n==============================================")
            print(f"Running Scenario: {scenario_name}")
            print(f"==============================================")
            
            g_list, c_list, d_list, dur = run_byzantine_experiment(
                scenario_name, agg, sc['malicious'], alpha, train_loaders, test_loaders, device
            )
            
            out_dir = f"results/phase8_4/{scenario_name}"
            os.makedirs(out_dir, exist_ok=True)
            
            pd.DataFrame(g_list).to_csv(f"{out_dir}/global_metrics.csv", index=False)
            pd.DataFrame(c_list).to_csv(f"{out_dir}/client_metrics.csv", index=False)
            pd.DataFrame(d_list).to_csv(f"{out_dir}/diagnostics.csv", index=False)
            
            best_g = max(g_list, key=lambda x: x['F1'])
            r = best_g['Round']
            c_f1s = [c['F1'] for c in c_list if c['Round'] == r]
            
            summary_results.append({
                "Aggregator": agg,
                "Scenario": sc['name'],
                "Global_F1": best_g['F1'],
                "Global_PR_AUC": best_g['PR-AUC'],
                "Global_Precision": best_g['Precision'],
                "Global_Recall": best_g['Recall'],
                "Global_ROC_AUC": best_g['ROC-AUC'],
                "Mean_Client_F1": np.mean(c_f1s),
                "Worst_Client_F1": min(c_f1s),
                "Client_F1_Std": np.std(c_f1s)
            })
            
    pd.DataFrame(summary_results).to_csv('results/phase8_4/summary.csv', index=False)

if __name__ == "__main__":
    main()
