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

def calc_norm(v_list):
    flat = np.concatenate([v.flatten() for v in v_list])
    return np.linalg.norm(flat)

def apply_dp_perturbation(update_list, C, sigma):
    norm = calc_norm(update_list)
    is_clipped = norm > C
    clip_factor = min(1.0, C / (norm + 1e-10))
    
    perturbed_update = []
    noise_norm_sq = 0.0
    for v in update_list:
        clipped_v = v * clip_factor
        if sigma > 0:
            noise = np.random.normal(0, sigma * C, size=clipped_v.shape)
            noise_norm_sq += np.sum(noise ** 2)
            perturbed_v = clipped_v + noise
        else:
            perturbed_v = clipped_v
        perturbed_update.append(perturbed_v)
        
    noise_norm = np.sqrt(noise_norm_sq) if sigma > 0 else 0.0
    return perturbed_update, norm, norm * clip_factor, is_clipped, noise_norm

def run_dp_experiment(sigma, train_loaders, val_loaders, test_loaders, device, seed=42):
    epochs = 10
    C = 1.0
    set_seed(seed)
    
    global_model = EdgeMLP(edge_dim=31).to(device)
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=torch.tensor([0.4622]).to(device))
    
    global_metrics_list = []
    client_metrics_list = []
    diagnostics_list = []
    
    for r in range(1, epochs + 1):
        global_weights = [val.cpu().numpy() for _, val in global_model.state_dict().items()]
        
        client_updates = []
        client_samples = []
        
        round_unclipped = []
        round_clipped = []
        round_noise = []
        round_is_clipped = []
        
        for cid in [1, 2, 3]:
            local_model = EdgeMLP(edge_dim=31).to(device)
            params_dict = zip(local_model.state_dict().keys(), global_weights)
            state_dict = {k: torch.tensor(v) for k, v in params_dict}
            local_model.load_state_dict(state_dict, strict=True)
            
            optimizer = torch.optim.AdamW(local_model.parameters(), lr=1e-3, weight_decay=1e-4)
            train_epoch(local_model, train_loaders[cid], optimizer, criterion, device)
            
            c_weights = [val.cpu().numpy() for _, val in local_model.state_dict().items()]
            c_samples = len(train_loaders[cid].dataset)
            
            delta_k = [cw - gw for cw, gw in zip(c_weights, global_weights)]
            
            perturbed_delta, unclip_n, clip_n, is_cl, noise_n = apply_dp_perturbation(delta_k, C, sigma)
            
            client_updates.append(perturbed_delta)
            client_samples.append(c_samples)
            
            round_unclipped.append(unclip_n)
            round_clipped.append(clip_n)
            round_noise.append(noise_n)
            round_is_clipped.append(is_cl)
            
        total_samples = sum(client_samples)
        agg_update = []
        for i in range(len(client_updates[0])):
            layer_sum = sum(up[i] * n for up, n in zip(client_updates, client_samples))
            agg_update.append(layer_sum / total_samples)
            
        new_global_weights = [gw + au for gw, au in zip(global_weights, agg_update)]
        global_norm = calc_norm(new_global_weights)
        
        params_dict = zip(global_model.state_dict().keys(), new_global_weights)
        state_dict = {k: torch.tensor(v) for k, v in params_dict}
        global_model.load_state_dict(state_dict, strict=True)
        
        v_g, v_c = evaluate_global(global_model, val_loaders, device)
        g_metrics, c_metrics = evaluate_global(global_model, test_loaders, device)
        
        g_metrics['Round'] = r
        g_metrics['Val_F1'] = v_g['F1']
        v_c_f1s = [c['F1'] for c in v_c]
        g_metrics['Val_Worst_Client_F1'] = min(v_c_f1s)
        g_metrics['Val_Mean_Client_F1'] = np.mean(v_c_f1s)
        
        for cm in c_metrics: cm['Round'] = r
        
        global_metrics_list.append(g_metrics)
        client_metrics_list.extend(c_metrics)
        
        diagnostics_list.append({
            "Round": r,
            "Avg_Unclipped_Norm": np.mean(round_unclipped),
            "Avg_Clipped_Norm": np.mean(round_clipped),
            "Clipping_Fraction": np.mean(round_is_clipped),
            "Avg_Noise_Norm": np.mean(round_noise),
            "Global_Model_Norm": global_norm
        })
        
        print(f"[sigma={sigma}] Round {r} Val F1: {v_g['F1']:.4f} | Test F1: {g_metrics['F1']:.4f}")
        
    return global_model, global_metrics_list, client_metrics_list, diagnostics_list

def main():
    os.makedirs('results/phase8_5', exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    data_path = 'graph_data/phase4_2_canonical_flow'
    batch_size = 256
    
    print("Loading Severe Non-IID Partition...")
    client_sim = ClientSimulatorPhase81('severe')
    train_data = load_partitioned_data(data_path, 'train', client_sim)
    val_data = load_partitioned_data(data_path, 'val', client_sim)
    test_data = load_partitioned_data(data_path, 'test', client_sim)
    
    train_loaders = {}
    val_loaders = {}
    test_loaders = {}
    
    for cid in [1, 2, 3]:
        train_ds = TensorDataset(train_data[cid]['x'], train_data[cid]['y'])
        val_ds = TensorDataset(val_data[cid]['x'], val_data[cid]['y'])
        test_ds = TensorDataset(test_data[cid]['x'], test_data[cid]['y'])
        
        train_loaders[cid] = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        val_loaders[cid] = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
        test_loaders[cid] = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
        
    sigmas = [0.0, 0.01, 0.05, 0.1, 0.25, 0.5]
    summary_results = []
    
    for sigma in sigmas:
        print(f"\n==============================================")
        print(f"Running Privacy Experiment: sigma = {sigma}")
        print(f"==============================================")
        
        folder = f'sigma_{sigma}'
        os.makedirs(f'results/phase8_5/{folder}', exist_ok=True)
        
        model, g_list, c_list, d_list = run_dp_experiment(sigma, train_loaders, val_loaders, test_loaders, device)
        
        pd.DataFrame(g_list).to_csv(f'results/phase8_5/{folder}/global_metrics.csv', index=False)
        pd.DataFrame(c_list).to_csv(f'results/phase8_5/{folder}/client_metrics.csv', index=False)
        pd.DataFrame(d_list).to_csv(f'results/phase8_5/{folder}/diagnostics.csv', index=False)
        
        # Select best round via validation subset
        best_val = max(g_list, key=lambda x: (x['Val_Worst_Client_F1'], x['Val_Mean_Client_F1'], x['Val_F1']))
        r = best_val['Round']
        
        best_g = [x for x in g_list if x['Round'] == r][0]
        c_f1s = [c['F1'] for c in c_list if c['Round'] == r]
        
        d_best = [d for d in d_list if d['Round'] == r][0]
        
        summary_results.append({
            "Noise_Sigma": sigma,
            "Global_F1": best_g['F1'],
            "Mean_Client_F1": np.mean(c_f1s),
            "Worst_Client_F1": min(c_f1s),
            "Client_F1_Std": np.std(c_f1s),
            "Global_Precision": best_g['Precision'],
            "Global_Recall": best_g['Recall'],
            "Global_PR_AUC": best_g['PR-AUC'],
            "Global_ROC_AUC": best_g['ROC-AUC'],
            "Avg_Unclipped_Norm": d_best['Avg_Unclipped_Norm'],
            "Avg_Clipped_Norm": d_best['Avg_Clipped_Norm'],
            "Clipping_Fraction": d_best['Clipping_Fraction'],
            "Avg_Noise_Norm": d_best['Avg_Noise_Norm']
        })
        
    pd.DataFrame(summary_results).to_csv('results/phase8_5/summary.csv', index=False)
    
    print("\n--- Running Seed Reproducibility Verification ---")
    best_overall = max(summary_results, key=lambda x: x['Worst_Client_F1'])
    best_sigma = best_overall['Noise_Sigma']
    
    seeds = [43, 44] # Seed 42 is already done
    seed_summary = []
    
    for s in seeds:
        print(f"\nRe-running sigma={best_sigma} with Seed={s}")
        _, g_list, c_list, _ = run_dp_experiment(best_sigma, train_loaders, val_loaders, test_loaders, device, seed=s)
        best_val = max(g_list, key=lambda x: (x['Val_Worst_Client_F1'], x['Val_Mean_Client_F1'], x['Val_F1']))
        r = best_val['Round']
        best_g = [x for x in g_list if x['Round'] == r][0]
        c_f1s = [c['F1'] for c in c_list if c['Round'] == r]
        
        seed_summary.append({
            "Seed": s,
            "Noise_Sigma": best_sigma,
            "Global_F1": best_g['F1'],
            "Mean_Client_F1": np.mean(c_f1s),
            "Worst_Client_F1": min(c_f1s),
            "Client_F1_Std": np.std(c_f1s)
        })
        
    pd.DataFrame(seed_summary).to_csv('results/phase8_5/seed_reproducibility.csv', index=False)

if __name__ == "__main__":
    main()
