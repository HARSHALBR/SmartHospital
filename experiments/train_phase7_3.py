import os
import glob
import pandas as pd
import numpy as np
import torch
import torch.nn as torch_nn
from torch.utils.data import TensorDataset, DataLoader, ConcatDataset
import hashlib
import json
import warnings
import sys
import time
import random
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score

warnings.filterwarnings("ignore")

sys.path.append('src/multimodal')
from fusion import MultimodalClassifier

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

class ClientSimulatorPhase62:
    def __init__(self, clinical_embeddings_path, clinical_labels_path):
        clin_emb = np.load(clinical_embeddings_path)
        with open(clinical_labels_path, 'r') as f:
            labels = json.load(f)
        df = pd.DataFrame({'label': labels})
        c1_mask = df['label'].str.contains('Surgery', case=False, na=False)
        c2_mask = df['label'].str.contains('Consult', case=False, na=False) | df['label'].str.contains('Cardiovascular', case=False, na=False)
        c3_mask = df['label'].str.contains('Psychiatry', case=False, na=False)
        c3_mask = c3_mask | (~(c1_mask | c2_mask))
        self.c1_emb = torch.tensor(clin_emb[c1_mask].mean(axis=0), dtype=torch.float32)
        self.c2_emb = torch.tensor(clin_emb[c2_mask].mean(axis=0), dtype=torch.float32)
        self.c3_emb = torch.tensor(clin_emb[c3_mask].mean(axis=0), dtype=torch.float32)
        
    def get_client_id(self, attack_type, src_ip, dst_ip):
        atk = str(attack_type).lower()
        h = int(hashlib.md5(f"{src_ip}_{dst_ip}_{attack_type}".encode()).hexdigest(), 16) % 100
        if atk == 'normal':
            if h < 33: return 1
            elif h < 66: return 2
            else: return 3
        if 'ddos' in atk or 'dos' in atk:
            if h < 70: return 1
            elif h < 85: return 2
            else: return 3
        elif 'port_scanning' in atk or 'vulnerability_scanner' in atk or 'fingerprinting' in atk:
            if h < 15: return 1
            elif h < 85: return 2
            else: return 3
        else:
            if h < 15: return 1
            elif h < 30: return 2
            else: return 3
            
    def get_clinical_emb(self, client_id):
        if client_id == 1: return self.c1_emb
        if client_id == 2: return self.c2_emb
        return self.c3_emb

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

def eval_local(model, loader, device, is_multimodal, clin_emb=None):
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        if is_multimodal:
            for x, y, c in loader:
                x, y, c = x.to(device), y.to(device), c.to(device)
                if clin_emb is not None:
                    c = clin_emb.unsqueeze(0).expand(x.size(0), -1).to(device)
                out = model(x, c).squeeze(-1)
                all_preds.extend(torch.sigmoid(out).cpu().numpy())
                all_labels.extend(y.numpy())
        else:
            for x, y in loader:
                x, y = x.to(device), y.to(device)
                out = model(x).squeeze(-1)
                all_preds.extend(torch.sigmoid(out).cpu().numpy())
                all_labels.extend(y.numpy())
    return all_preds, all_labels

def evaluate_global(model, test_loaders_dict, device, is_multimodal, client_sim=None):
    all_preds, all_labels = [], []
    client_metrics = []
    
    for cid, loader in test_loaders_dict.items():
        clin_emb = client_sim.get_clinical_emb(cid) if client_sim else None
        p, l = eval_local(model, loader, device, is_multimodal, clin_emb)
        all_preds.extend(p)
        all_labels.extend(l)
        
        cm = compute_metrics(l, p)
        cm['Client'] = cid
        client_metrics.append(cm)
        
    global_metric = compute_metrics(all_labels, all_preds)
    return global_metric, client_metrics

def train_epoch(model, loader, optimizer, criterion, device, is_multimodal, clin_emb=None):
    model.train()
    for batch in loader:
        if is_multimodal:
            x, y, c = batch[0].to(device), batch[1].to(device), batch[2].to(device)
            if clin_emb is not None:
                c = clin_emb.unsqueeze(0).expand(x.size(0), -1).to(device)
            optimizer.zero_grad()
            out = model(x, c).squeeze(-1)
        else:
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

def calculate_communication(model, num_clients, num_rounds):
    num_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    size_bytes = num_params * 4
    server_to_client = size_bytes * num_clients * num_rounds
    client_to_server = size_bytes * num_clients * num_rounds
    total_comm = server_to_client + client_to_server
    return {
        "Trainable_Parameters": num_params,
        "Parameter_Size_MB": size_bytes / (1024*1024),
        "Server_to_Client_MB": server_to_client / (1024*1024),
        "Client_to_Server_MB": client_to_server / (1024*1024),
        "Total_Communication_MB": total_comm / (1024*1024)
    }

def main():
    os.makedirs('results/phase7_3', exist_ok=True)
    os.makedirs('results/phase7_3/plots', exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    set_seed(42)
    client_sim = ClientSimulatorPhase62('results/phase6_1/embeddings_mean.npy', 'results/phase6_1/labels.json')
    data_path = 'graph_data/phase4_2_canonical_flow'
    train_data = load_partitioned_data(data_path, 'train', client_sim)
    test_data = load_partitioned_data(data_path, 'test', client_sim)
    
    batch_size = 256
    epochs = 10
    
    iot_train_loaders = {}
    iot_test_loaders = {}
    mm_train_loaders = {}
    mm_test_loaders = {}
    
    iot_train_dss = []
    mm_train_dss = []
    
    for cid in [1, 2, 3]:
        c_emb = client_sim.get_clinical_emb(cid)
        
        iot_train_ds = TensorDataset(train_data[cid]['x'], train_data[cid]['y'])
        iot_test_ds = TensorDataset(test_data[cid]['x'], test_data[cid]['y'])
        
        c_train_embs = c_emb.unsqueeze(0).expand(train_data[cid]['x'].size(0), -1)
        c_test_embs = c_emb.unsqueeze(0).expand(test_data[cid]['x'].size(0), -1)
        
        mm_train_ds = TensorDataset(train_data[cid]['x'], train_data[cid]['y'], c_train_embs)
        mm_test_ds = TensorDataset(test_data[cid]['x'], test_data[cid]['y'], c_test_embs)
        
        iot_train_loaders[cid] = DataLoader(iot_train_ds, batch_size=batch_size, shuffle=True)
        iot_test_loaders[cid] = DataLoader(iot_test_ds, batch_size=batch_size, shuffle=False)
        
        mm_train_loaders[cid] = DataLoader(mm_train_ds, batch_size=batch_size, shuffle=True)
        mm_test_loaders[cid] = DataLoader(mm_test_ds, batch_size=batch_size, shuffle=False)
        
        iot_train_dss.append(iot_train_ds)
        mm_train_dss.append(mm_train_ds)
        
    global_iot_train_loader = DataLoader(ConcatDataset(iot_train_dss), batch_size=batch_size, shuffle=True)
    global_mm_train_loader = DataLoader(ConcatDataset(mm_train_dss), batch_size=batch_size, shuffle=True)
    
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=torch.tensor([0.4622]).to(device))
    
    results = {
        "Centralized_IoT": {"global": [], "client": [], "time": 0},
        "Centralized_Multimodal": {"global": [], "client": [], "time": 0},
        "Federated_IoT": {"global": [], "client": [], "time": 0, "comm": None},
        "Federated_Multimodal": {"global": [], "client": [], "time": 0, "comm": None}
    }
    
    # --- 1. Centralized IoT-only ---
    print("\n--- Centralized IoT-only (10 Epochs) ---")
    set_seed(42)
    model = EdgeMLP(edge_dim=31).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    start_time = time.time()
    for ep in range(1, epochs + 1):
        train_epoch(model, global_iot_train_loader, optimizer, criterion, device, is_multimodal=False)
        g_metrics, c_metrics = evaluate_global(model, iot_test_loaders, device, is_multimodal=False)
        g_metrics['Round'] = ep
        for cm in c_metrics: cm['Round'] = ep
        results["Centralized_IoT"]["global"].append(g_metrics)
        results["Centralized_IoT"]["client"].extend(c_metrics)
        print(f"Epoch {ep} F1: {g_metrics['F1']:.4f}")
    results["Centralized_IoT"]["time"] = time.time() - start_time

    # --- 2. Centralized Multimodal ---
    print("\n--- Centralized Multimodal (10 Epochs) ---")
    set_seed(42)
    model = MultimodalClassifier(iot_in_dim=31, clin_in_dim=768).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    start_time = time.time()
    for ep in range(1, epochs + 1):
        train_epoch(model, global_mm_train_loader, optimizer, criterion, device, is_multimodal=True)
        g_metrics, c_metrics = evaluate_global(model, mm_test_loaders, device, is_multimodal=True)
        g_metrics['Round'] = ep
        for cm in c_metrics: cm['Round'] = ep
        results["Centralized_Multimodal"]["global"].append(g_metrics)
        results["Centralized_Multimodal"]["client"].extend(c_metrics)
        print(f"Epoch {ep} F1: {g_metrics['F1']:.4f}")
    results["Centralized_Multimodal"]["time"] = time.time() - start_time
    
    # --- 3. Federated IoT-only FedAvg ---
    print("\n--- Federated IoT-only FedAvg (10 Rounds) ---")
    set_seed(42)
    global_model = EdgeMLP(edge_dim=31).to(device)
    results["Federated_IoT"]["comm"] = calculate_communication(global_model, 3, epochs)
    start_time = time.time()
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
            train_epoch(local_model, iot_train_loaders[cid], optimizer, criterion, device, is_multimodal=False)
            c_weights = [val.cpu().numpy() for _, val in local_model.state_dict().items()]
            c_samples = len(iot_train_loaders[cid].dataset)
            client_weights.append(c_weights)
            client_samples.append(c_samples)
        agg_weights = aggregate_weights(client_weights, client_samples)
        params_dict = zip(global_model.state_dict().keys(), agg_weights)
        state_dict = {k: torch.tensor(v) for k, v in params_dict}
        global_model.load_state_dict(state_dict, strict=True)
        g_metrics, c_metrics = evaluate_global(global_model, iot_test_loaders, device, is_multimodal=False)
        g_metrics['Round'] = r
        for cm in c_metrics: cm['Round'] = r
        results["Federated_IoT"]["global"].append(g_metrics)
        results["Federated_IoT"]["client"].extend(c_metrics)
        print(f"Round {r} F1: {g_metrics['F1']:.4f}")
    results["Federated_IoT"]["time"] = time.time() - start_time
        
    # --- 4. Federated Multimodal FedAvg ---
    print("\n--- Federated Multimodal FedAvg (10 Rounds) ---")
    set_seed(42)
    global_model = MultimodalClassifier(iot_in_dim=31, clin_in_dim=768).to(device)
    results["Federated_Multimodal"]["comm"] = calculate_communication(global_model, 3, epochs)
    start_time = time.time()
    for r in range(1, epochs + 1):
        global_weights = [val.cpu().numpy() for _, val in global_model.state_dict().items()]
        client_weights = []
        client_samples = []
        for cid in [1, 2, 3]:
            local_model = MultimodalClassifier(iot_in_dim=31, clin_in_dim=768).to(device)
            params_dict = zip(local_model.state_dict().keys(), global_weights)
            state_dict = {k: torch.tensor(v) for k, v in params_dict}
            local_model.load_state_dict(state_dict, strict=True)
            optimizer = torch.optim.AdamW(local_model.parameters(), lr=1e-3, weight_decay=1e-4)
            train_epoch(local_model, mm_train_loaders[cid], optimizer, criterion, device, is_multimodal=True, clin_emb=client_sim.get_clinical_emb(cid))
            c_weights = [val.cpu().numpy() for _, val in local_model.state_dict().items()]
            c_samples = len(mm_train_loaders[cid].dataset)
            client_weights.append(c_weights)
            client_samples.append(c_samples)
        agg_weights = aggregate_weights(client_weights, client_samples)
        params_dict = zip(global_model.state_dict().keys(), agg_weights)
        state_dict = {k: torch.tensor(v) for k, v in params_dict}
        global_model.load_state_dict(state_dict, strict=True)
        g_metrics, c_metrics = evaluate_global(global_model, mm_test_loaders, device, is_multimodal=True, client_sim=client_sim)
        g_metrics['Round'] = r
        for cm in c_metrics: cm['Round'] = r
        results["Federated_Multimodal"]["global"].append(g_metrics)
        results["Federated_Multimodal"]["client"].extend(c_metrics)
        print(f"Round {r} F1: {g_metrics['F1']:.4f}")
    results["Federated_Multimodal"]["time"] = time.time() - start_time
    
    # Save Outputs
    for exp_name, exp_data in results.items():
        pd.DataFrame(exp_data["global"]).to_csv(f'results/phase7_3/{exp_name.lower()}_metrics.csv', index=False)
        
    final_comp = []
    client_comp = []
    
    for exp_name, exp_data in results.items():
        best_g = max(exp_data["global"], key=lambda x: x['F1'])
        r = best_g['Round']
        final_comp.append({
            "Model": exp_name,
            "F1": best_g['F1'],
            "Precision": best_g['Precision'],
            "Recall": best_g['Recall'],
            "PR-AUC": best_g['PR-AUC'],
            "ROC-AUC": best_g['ROC-AUC']
        })
        for c in exp_data["client"]:
            if c['Round'] == r:
                c_copy = c.copy()
                c_copy['Model'] = exp_name
                client_comp.append(c_copy)
                
    pd.DataFrame(final_comp).to_csv('results/phase7_3/final_comparison.csv', index=False)
    pd.DataFrame(client_comp).to_csv('results/phase7_3/client_comparison.csv', index=False)
    
    comm_data = [
        {"Model": "Federated_IoT", **results["Federated_IoT"]["comm"]},
        {"Model": "Federated_Multimodal", **results["Federated_Multimodal"]["comm"]}
    ]
    pd.DataFrame(comm_data).to_csv('results/phase7_3/communication_cost.csv', index=False)
    
    time_data = [
        {"Model": k, "Training_Time_Seconds": v["time"]} for k, v in results.items()
    ]
    pd.DataFrame(time_data).to_csv('results/phase7_3/training_time.csv', index=False)

if __name__ == "__main__":
    main()
