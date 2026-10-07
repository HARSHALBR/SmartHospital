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
import matplotlib.pyplot as plt
import random

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score

warnings.filterwarnings("ignore")
set_seed(42)

sys.path.append('src/multimodal')
from fusion import MultimodalClassifier

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

def train_local(model, loader, clin_emb, optimizer, criterion, device):
    model.train()
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        c_emb = clin_emb.unsqueeze(0).expand(x.size(0), -1).to(device)
        optimizer.zero_grad()
        out = model(x, c_emb).squeeze(-1)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()

def eval_local(model, loader, clin_emb, device):
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for x, y in loader:
            x = x.to(device)
            c_emb = clin_emb.unsqueeze(0).expand(x.size(0), -1).to(device)
            out = model(x, c_emb).squeeze(-1)
            all_preds.extend(torch.sigmoid(out).cpu().numpy())
            all_labels.extend(y.numpy())
    return all_preds, all_labels

global_client_metrics = {1: [], 2: [], 3: []}
global_round_metrics = []

def record_client_metrics(cid, round_idx, metrics):
    metrics['Round'] = round_idx
    global_client_metrics[cid].append(metrics)

def evaluate_global_model(parameters, test_loaders_dict, client_sim, device):
    model = MultimodalClassifier(iot_in_dim=31, clin_in_dim=768).to(device)
    params_dict = zip(model.state_dict().keys(), parameters)
    state_dict = {k: torch.tensor(v) for k, v in params_dict}
    model.load_state_dict(state_dict, strict=True)
    all_preds, all_labels = [], []
    for cid, loader in test_loaders_dict.items():
        clin_emb = client_sim.get_clinical_emb(cid)
        p, l = eval_local(model, loader, clin_emb, device)
        all_preds.extend(p)
        all_labels.extend(l)
    return compute_metrics(all_labels, all_preds)

def aggregate_weights(weights_list, sample_counts):
    total_samples = sum(sample_counts)
    agg_weights = []
    for i in range(len(weights_list[0])):
        layer_sum = sum(w[i] * n for w, n in zip(weights_list, sample_counts))
        agg_weights.append(layer_sum / total_samples)
    return agg_weights

def main():
    os.makedirs('results/phase7_2', exist_ok=True)
    os.makedirs('results/phase7_2/plots', exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    print("Initializing client simulator and clinical embeddings...")
    client_sim = ClientSimulatorPhase62('results/phase6_1/embeddings_mean.npy', 'results/phase6_1/labels.json')
    
    print("Loading partitioned edge features...")
    data_path = 'graph_data/phase4_2_canonical_flow'
    train_data = load_partitioned_data(data_path, 'train', client_sim)
    test_data = load_partitioned_data(data_path, 'test', client_sim)
    
    client_train_loaders = {}
    client_test_loaders = {}
    
    batch_size = 256
    for cid in [1, 2, 3]:
        train_ds = TensorDataset(train_data[cid]['x'], train_data[cid]['y'])
        test_ds = TensorDataset(test_data[cid]['x'], test_data[cid]['y'])
        client_train_loaders[cid] = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        client_test_loaders[cid] = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
        print(f"Client {cid}: {len(train_ds)} train edges, {len(test_ds)} test edges.")
        
    global_model = MultimodalClassifier(iot_in_dim=31, clin_in_dim=768).to(device)
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=torch.tensor([0.4622]).to(device))
    
    num_rounds = 10
    
    print("\nStarting Multimodal Federated Learning Simulation (Native PyTorch FedAvg)...")
    for r in range(1, num_rounds + 1):
        global_weights = [val.cpu().numpy() for _, val in global_model.state_dict().items()]
        
        client_weights = []
        client_samples = []
        
        for cid in [1, 2, 3]:
            local_model = MultimodalClassifier(iot_in_dim=31, clin_in_dim=768).to(device)
            params_dict = zip(local_model.state_dict().keys(), global_weights)
            state_dict = {k: torch.tensor(v) for k, v in params_dict}
            local_model.load_state_dict(state_dict, strict=True)
            
            clin_emb = client_sim.get_clinical_emb(cid)
            optimizer = torch.optim.AdamW(local_model.parameters(), lr=1e-3, weight_decay=1e-4)
            train_local(local_model, client_train_loaders[cid], clin_emb, optimizer, criterion, device)
            
            c_weights = [val.cpu().numpy() for _, val in local_model.state_dict().items()]
            c_samples = len(client_train_loaders[cid].dataset)
            
            client_weights.append(c_weights)
            client_samples.append(c_samples)
            
            preds, labels = eval_local(local_model, client_test_loaders[cid], clin_emb, device)
            c_metrics = compute_metrics(labels, preds)
            record_client_metrics(cid, r, c_metrics)
            
        agg_weights = aggregate_weights(client_weights, client_samples)
        
        params_dict = zip(global_model.state_dict().keys(), agg_weights)
        state_dict = {k: torch.tensor(v) for k, v in params_dict}
        global_model.load_state_dict(state_dict, strict=True)
        
        global_metrics = evaluate_global_model(agg_weights, client_test_loaders, client_sim, device)
        global_metrics['Round'] = r
        global_round_metrics.append(global_metrics)
        print(f"Round {r} Global Test F1: {global_metrics['F1']:.4f}")
        
    print("\nSimulation complete. Saving results...")
    torch.save(global_model.state_dict(), 'results/phase7_2/final_global_model.pth')
    
    if len(global_round_metrics) > 0:
        best_round = max(global_round_metrics, key=lambda x: x['F1'])
        print(f"Best Global F1: {best_round['F1']:.4f} at Round {best_round['Round']}")
        
    with open('results/phase7_2/global_metrics.csv', 'w') as f:
        pd.DataFrame(global_round_metrics).to_csv(f, index=False)
        
    flat_client = []
    for cid, metrics_list in global_client_metrics.items():
        for m in metrics_list:
            m_copy = m.copy()
            m_copy['Client'] = cid
            flat_client.append(m_copy)
            
    with open('results/phase7_2/client_metrics.csv', 'w') as f:
        pd.DataFrame(flat_client).to_csv(f, index=False)
        
    df_global = pd.DataFrame(global_round_metrics)
    if not df_global.empty:
        plt.figure(figsize=(10, 6))
        plt.plot(df_global['Round'], df_global['F1'], marker='o', label='Multimodal FedAvg F1')
        plt.title('Global Multimodal F1 vs Federated Round')
        plt.xlabel('Round')
        plt.ylabel('F1 Score')
        plt.grid(True)
        plt.savefig('results/phase7_2/plots/global_f1.png')
        plt.close()
        
        plt.figure(figsize=(10, 6))
        plt.plot(df_global['Round'], df_global['PR-AUC'], marker='o', label='Multimodal PR-AUC')
        plt.title('Global Multimodal PR-AUC vs Federated Round')
        plt.xlabel('Round')
        plt.ylabel('PR-AUC Score')
        plt.grid(True)
        plt.savefig('results/phase7_2/plots/global_prauc.png')
        plt.close()
        
        plt.figure(figsize=(10, 6))
        plt.plot(df_global['Round'], df_global['Recall'], marker='o', label='Multimodal Recall')
        plt.title('Global Multimodal Recall vs Federated Round')
        plt.xlabel('Round')
        plt.ylabel('Recall')
        plt.grid(True)
        plt.savefig('results/phase7_2/plots/global_recall.png')
        plt.close()
        
    df_client = pd.DataFrame(flat_client)
    if not df_client.empty:
        plt.figure(figsize=(10, 6))
        for cid in [1, 2, 3]:
            c_data = df_client[df_client['Client'] == cid]
            plt.plot(c_data['Round'], c_data['F1'], marker='x', label=f'Client {cid} F1')
        plt.title('Per-Client Multimodal F1 vs Federated Round')
        plt.xlabel('Round')
        plt.ylabel('F1 Score')
        plt.legend()
        plt.grid(True)
        plt.savefig('results/phase7_2/plots/per_client_f1.png')
        plt.close()

if __name__ == "__main__":
    main()
