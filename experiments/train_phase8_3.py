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

def evaluate_global(model_dict, test_loaders_dict, device, is_personalized=False, global_model=None):
    all_preds, all_labels = [], []
    client_metrics = []
    
    for cid, loader in test_loaders_dict.items():
        if is_personalized:
            model = model_dict[cid]
        else:
            model = global_model
            
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

def calculate_divergence(local_model, global_model):
    div = 0.0
    for lp, gp in zip(local_model.parameters(), global_model.parameters()):
        div += torch.sum((lp - gp) ** 2).item()
    return np.sqrt(div)

def main():
    os.makedirs('results/phase8_3', exist_ok=True)
    os.makedirs('results/phase8_3/plots', exist_ok=True)
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
        
    print("\n--- 1. Training FedAvg Global Baseline (10 Rounds) ---")
    set_seed(42)
    global_model = EdgeMLP(edge_dim=31).to(device)
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=torch.tensor([0.4622]).to(device))
    epochs = 10
    
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
        
    torch.save(global_model.state_dict(), 'results/phase8_3/fedavg_global_model.pth')
    fedavg_g, fedavg_c = evaluate_global(None, test_loaders, device, is_personalized=False, global_model=global_model)
    fedavg_c_f1s = [c['F1'] for c in fedavg_c]
    
    print("\n--- 2. Personalization Phase (Validation Search) ---")
    pers_epochs = [1, 3, 5]
    val_results = []
    
    for pe in pers_epochs:
        print(f"Testing Personalization Epochs = {pe}")
        models_dict = {}
        for cid in [1, 2, 3]:
            set_seed(42)
            c_model = EdgeMLP(edge_dim=31).to(device)
            c_model.load_state_dict(global_model.state_dict())
            # Head-only personalization: Freeze first layer
            for name, param in c_model.named_parameters():
                if 'mlp.0' in name:
                    param.requires_grad = False
            
            optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, c_model.parameters()), lr=1e-3, weight_decay=1e-4)
            for _ in range(pe):
                train_epoch(c_model, train_loaders[cid], optimizer, criterion, device)
            models_dict[cid] = c_model
            
        v_g, v_c = evaluate_global(models_dict, val_loaders, device, is_personalized=True)
        v_c_f1s = [c['F1'] for c in v_c]
        val_results.append({
            "Epochs": pe,
            "Global_F1": v_g['F1'],
            "Worst_Client_F1": min(v_c_f1s),
            "Mean_Client_F1": np.mean(v_c_f1s),
            "Models": models_dict
        })
        
    # Select best personalization epochs based on Worst_Client_F1, then Mean_Client_F1
    best_val = max(val_results, key=lambda x: (x['Worst_Client_F1'], x['Mean_Client_F1'], x['Global_F1']))
    best_epochs = best_val['Epochs']
    print(f"\nSelected Best Personalization Epochs = {best_epochs}")
    
    print("\n--- 3. Evaluating Best Personalized Models on Test Set ---")
    best_models = best_val['Models']
    pers_g, pers_c = evaluate_global(best_models, test_loaders, device, is_personalized=True)
    pers_c_f1s = [c['F1'] for c in pers_c]
    
    for cid, model in best_models.items():
        torch.save(model.state_dict(), f'results/phase8_3/personalized_client_{cid}.pth')
        
    print("\n--- 4. Computing Parameter Drift ---")
    divergence_data = []
    for cid in [1, 2, 3]:
        div = calculate_divergence(best_models[cid], global_model)
        divergence_data.append({"Client": cid, "L2_Divergence": div})
        
    pd.DataFrame(divergence_data).to_csv('results/phase8_3/parameter_drift.csv', index=False)
    
    print("\n--- 5. Saving Final Results ---")
    
    comparison_data = [
        {"Metric": "Global F1", "FedAvg": fedavg_g['F1'], "Personalized FL": pers_g['F1'], "Delta": pers_g['F1'] - fedavg_g['F1']},
        {"Metric": "Mean Client F1", "FedAvg": np.mean(fedavg_c_f1s), "Personalized FL": np.mean(pers_c_f1s), "Delta": np.mean(pers_c_f1s) - np.mean(fedavg_c_f1s)},
        {"Metric": "Worst Client F1", "FedAvg": min(fedavg_c_f1s), "Personalized FL": min(pers_c_f1s), "Delta": min(pers_c_f1s) - min(fedavg_c_f1s)},
        {"Metric": "Client F1 Std", "FedAvg": np.std(fedavg_c_f1s), "Personalized FL": np.std(pers_c_f1s), "Delta": np.std(pers_c_f1s) - np.std(fedavg_c_f1s)},
        {"Metric": "Global Precision", "FedAvg": fedavg_g['Precision'], "Personalized FL": pers_g['Precision'], "Delta": pers_g['Precision'] - fedavg_g['Precision']},
        {"Metric": "Global Recall", "FedAvg": fedavg_g['Recall'], "Personalized FL": pers_g['Recall'], "Delta": pers_g['Recall'] - fedavg_g['Recall']},
        {"Metric": "Global PR-AUC", "FedAvg": fedavg_g['PR-AUC'], "Personalized FL": pers_g['PR-AUC'], "Delta": pers_g['PR-AUC'] - fedavg_g['PR-AUC']},
        {"Metric": "Global ROC-AUC", "FedAvg": fedavg_g['ROC-AUC'], "Personalized FL": pers_g['ROC-AUC'], "Delta": pers_g['ROC-AUC'] - fedavg_g['ROC-AUC']}
    ]
    pd.DataFrame(comparison_data).to_csv('results/phase8_3/global_comparison.csv', index=False)
    
    client_comparison_data = []
    for f_c, p_c in zip(fedavg_c, pers_c):
        cid = f_c['Client']
        client_comparison_data.append({
            "Client": cid,
            "FedAvg_F1": f_c['F1'],
            "Personalized_F1": p_c['F1'],
            "Improvement": p_c['F1'] - f_c['F1']
        })
    pd.DataFrame(client_comparison_data).to_csv('results/phase8_3/client_comparison.csv', index=False)
    
    pd.DataFrame([{"Best_Epochs": best_epochs}]).to_csv('results/phase8_3/best_hyperparameters.csv', index=False)

if __name__ == "__main__":
    main()
