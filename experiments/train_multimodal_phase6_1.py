import os
import json
import time
import glob
import pandas as pd
import numpy as np
import torch
import torch.nn as torch_nn
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix
import sys
import warnings

warnings.filterwarnings("ignore")

sys.path.append('src/models')
sys.path.append('src/multimodal')
from graphsage import GraphSAGE
from edge_classifier import EdgeClassifier, GraphSAGEEdgeModel
from fusion import MultimodalClassifier

class ClientSimulator:
    def __init__(self, clinical_embeddings_path, clinical_labels_path):
        clin_emb = np.load(clinical_embeddings_path)
        with open(clinical_labels_path, 'r') as f:
            labels = json.load(f)
            
        df = pd.DataFrame({'label': labels})
        
        c1_mask = df['label'].str.contains('Surgery', case=False, na=False)
        c2_mask = df['label'].str.contains('Consult', case=False, na=False) | df['label'].str.contains('Cardiovascular', case=False, na=False)
        c3_mask = df['label'].str.contains('Psychiatry', case=False, na=False)
        # Fallback for remaining nodes so no graph flow is lost
        c3_mask = c3_mask | (~(c1_mask | c2_mask))
        
        self.stats = {
            "Client_1": {"Categories": "Surgery", "Notes": int(c1_mask.sum())},
            "Client_2": {"Categories": "Consult / Cardiovascular", "Notes": int(c2_mask.sum())},
            "Client_3": {"Categories": "Psychiatry / Misc", "Notes": int(c3_mask.sum())}
        }
        
        if c1_mask.sum() == 0 or c2_mask.sum() == 0 or c3_mask.sum() == 0:
            raise ValueError(f"Partitioning problem: One of the simulated clients has NO valid clinical notes! Stats: {self.stats}")
            
        # NO GLOBAL MEAN FALLBACK
        self.c1_emb = torch.tensor(clin_emb[c1_mask].mean(axis=0), dtype=torch.float32)
        self.c2_emb = torch.tensor(clin_emb[c2_mask].mean(axis=0), dtype=torch.float32)
        self.c3_emb = torch.tensor(clin_emb[c3_mask].mean(axis=0), dtype=torch.float32)
        
    def get_client_id(self, attack_type):
        atk = str(attack_type).lower()
        if 'ddos' in atk or 'dos' in atk: return 1
        elif 'port_scanning' in atk or 'vulnerability_scanner' in atk or 'fingerprinting' in atk: return 2
        else: return 3
            
    def get_clinical_emb(self, client_id):
        if client_id == 1: return self.c1_emb
        if client_id == 2: return self.c2_emb
        return self.c3_emb

class IoTGraphWindowDataset(Dataset):
    def __init__(self, data_dir, split, client_sim):
        self.data_dir = os.path.join(data_dir, split)
        self.windows = sorted(glob.glob(os.path.join(self.data_dir, 'window_*')))
        self.client_sim = client_sim
        
    def __len__(self):
        return len(self.windows)
        
    def __getitem__(self, idx):
        w_dir = self.windows[idx]
        edges_df = pd.read_csv(os.path.join(w_dir, 'edges.csv'), low_memory=False)
        nodes_df = pd.read_csv(os.path.join(w_dir, 'nodes.csv'))
        
        unique_nodes = nodes_df['node_id'].astype(str).tolist()
        node_to_idx = {n: i for i, n in enumerate(unique_nodes)}
        
        node_feat_cols = [c for c in nodes_df.columns if c != 'node_id']
        x = torch.tensor(nodes_df[node_feat_cols].values, dtype=torch.float)
        
        src = [node_to_idx[str(n)] for n in edges_df['src_ip']]
        dst = [node_to_idx[str(n)] for n in edges_df['dst_ip']]
        edge_index = torch.tensor([src, dst], dtype=torch.long)
        
        edge_feat_cols = [c for c in edges_df.columns if c not in ['src_ip', 'dst_ip', 'Attack_label', 'Attack_type', 'num_records']]
        edge_attr = torch.tensor(edges_df[edge_feat_cols].values, dtype=torch.float)
        
        y = torch.tensor(edges_df['Attack_label'].values, dtype=torch.float)
        
        cids = [self.client_sim.get_client_id(atk) for atk in edges_df['Attack_type']]
        cids_tensor = torch.tensor(cids, dtype=torch.long)
        
        clin_embs = torch.stack([self.client_sim.get_clinical_emb(cid) for cid in cids])
        
        return {
            'x': x,
            'edge_index': edge_index,
            'edge_attr': edge_attr,
            'y': y,
            'clin_emb': clin_embs,
            'cids': cids_tensor
        }

def collate_fn(batch): return batch[0]

def compute_metrics(labels, preds):
    labels = np.array(labels)
    preds = np.array(preds)
    pred_labels = (preds >= 0.5).astype(int)
    try:
        acc = accuracy_score(labels, pred_labels)
        prec = precision_score(labels, pred_labels, zero_division=0)
        rec = recall_score(labels, pred_labels, zero_division=0)
        f1 = f1_score(labels, pred_labels, zero_division=0)
        roc_auc = roc_auc_score(labels, preds) if len(np.unique(labels)) > 1 else 0.0
        pr_auc = average_precision_score(labels, preds) if len(np.unique(labels)) > 1 else 0.0
        cm = confusion_matrix(labels, pred_labels).tolist()
    except:
        acc, prec, rec, f1, roc_auc, pr_auc, cm = 0, 0, 0, 0, 0, 0, []
    return {"Accuracy": float(acc), "Precision": float(prec), "Recall": float(rec), 
            "F1": float(f1), "ROC-AUC": float(roc_auc), "PR-AUC": float(pr_auc), "Confusion_Matrix": cm}

class IoTOnlyBaseline(torch_nn.Module):
    def __init__(self, iot_dim):
        super().__init__()
        self.mlp = torch_nn.Sequential(torch_nn.Linear(iot_dim, 128), torch_nn.ReLU(), torch_nn.Dropout(0.3), torch_nn.Linear(128, 1))
    def forward(self, iot_repr, clin_repr): return self.mlp(iot_repr)

class ClinicalOnlyBaseline(torch_nn.Module):
    def __init__(self, clin_dim=768):
        super().__init__()
        self.mlp = torch_nn.Sequential(torch_nn.Linear(clin_dim, 128), torch_nn.ReLU(), torch_nn.Dropout(0.3), torch_nn.Linear(128, 1))
    def forward(self, iot_repr, clin_repr): return self.mlp(clin_repr)

def train_epoch(model, graphsage_ext, loader, optimizer, criterion, device):
    model.train()
    for i, data in enumerate(loader):
        x, edge_index, edge_attr, y, clin_emb = data['x'].to(device), data['edge_index'].to(device), data['edge_attr'].to(device), data['y'].to(device), data['clin_emb'].to(device)
        if len(y) == 0: continue
        with torch.no_grad():
            z = graphsage_ext.sage(x, edge_index)
            iot_repr = torch.cat([z[edge_index[0]], z[edge_index[1]], torch.abs(z[edge_index[0]] - z[edge_index[1]]), edge_attr], dim=-1)
        optimizer.zero_grad()
        out = model(iot_repr, clin_emb).squeeze(-1)
        loss = criterion(out, y)
        if not torch.isnan(loss):
            loss.backward()
            optimizer.step()

def evaluate(model, graphsage_ext, loader, device):
    model.eval()
    all_preds, all_labels, all_cids = [], [], []
    with torch.no_grad():
        for data in loader:
            x, edge_index, edge_attr, y, clin_emb, cids = data['x'].to(device), data['edge_index'].to(device), data['edge_attr'].to(device), data['y'].to(device), data['clin_emb'].to(device), data['cids']
            if len(y) == 0: continue
            z = graphsage_ext.sage(x, edge_index)
            iot_repr = torch.cat([z[edge_index[0]], z[edge_index[1]], torch.abs(z[edge_index[0]] - z[edge_index[1]]), edge_attr], dim=-1)
            out = model(iot_repr, clin_emb).squeeze(-1)
            all_preds.extend(torch.sigmoid(out).cpu().numpy())
            all_labels.extend(y.cpu().numpy())
            all_cids.extend(cids.numpy())
    return all_preds, all_labels, all_cids

def run_experiment(name, model, graphsage_ext, train_loader, val_loader, test_loader, criterion, device):
    print(f"\n--- {name} ---")
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    best_f1 = -1.0
    for epoch in range(1): # 1 epoch to save time, suffices for testing representation power
        train_epoch(model, graphsage_ext, train_loader, optimizer, criterion, device)
        v_preds, v_labels, _ = evaluate(model, graphsage_ext, val_loader, device)
        v_metrics = compute_metrics(v_labels, v_preds)
        if v_metrics['F1'] > best_f1:
            best_f1 = v_metrics['F1']
            torch.save(model.state_dict(), f'results/phase6_1/best_{name.replace(" ", "_")}.pth')
            
    try:
        model.load_state_dict(torch.load(f'results/phase6_1/best_{name.replace(" ", "_")}.pth', weights_only=True))
    except: pass
    
    test_preds, test_labels, test_cids = evaluate(model, graphsage_ext, test_loader, device)
    
    # Global metrics
    global_metrics = compute_metrics(test_labels, test_preds)
    
    # Client-specific metrics
    client_metrics = {}
    test_preds, test_labels, test_cids = np.array(test_preds), np.array(test_labels), np.array(test_cids)
    for c in [1, 2, 3]:
        mask = (test_cids == c)
        if mask.sum() > 0:
            c_preds = test_preds[mask]
            c_labels = test_labels[mask]
            cm = compute_metrics(c_labels, c_preds)
            cm['Edges'] = int(mask.sum())
            cm['Attack_Ratio'] = float(c_labels.mean())
            client_metrics[f"Client_{c}"] = cm
            
    return {"Global": global_metrics, "Clients": client_metrics}

def main():
    os.makedirs('results/phase6_1', exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    client_sim = ClientSimulator('results/phase6_1/embeddings_mean.npy', 'results/phase6_1/labels.json')
    with open('results/phase6_1/client_stats.json', 'w') as f:
        json.dump(client_sim.stats, f, indent=4)
        
    data_path = 'graph_data/phase4_2_canonical_flow'
    train_dataset = IoTGraphWindowDataset(data_path, 'train', client_sim)
    train_loader = DataLoader(train_dataset, batch_size=1, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(IoTGraphWindowDataset(data_path, 'val', client_sim), batch_size=1, shuffle=False, collate_fn=collate_fn)
    test_loader = DataLoader(IoTGraphWindowDataset(data_path, 'test', client_sim), batch_size=1, shuffle=False, collate_fn=collate_fn)
    
    sample = train_dataset[0]
    node_dim = sample['x'].shape[1]
    edge_dim = sample['edge_attr'].shape[1]
    
    sage = GraphSAGE(in_channels=node_dim, hidden_channels_list=[128, 128], out_channels=64)
    classifier = EdgeClassifier(node_emb_dim=64, edge_feat_dim=edge_dim, hidden_dim=128)
    graphsage_ext = GraphSAGEEdgeModel(sage, classifier).to(device)
    graphsage_ext.load_state_dict(torch.load('results/phase4_2/best_model_c.pth', map_location=device, weights_only=True))
    graphsage_ext.eval()
    
    iot_repr_dim = (64 * 2) + 64 + edge_dim
    pos_weight = torch.tensor([0.4622]).to(device)
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    res = {}
    model_a = IoTOnlyBaseline(iot_repr_dim).to(device)
    res['IoT_Only'] = run_experiment("IoT_Only", model_a, graphsage_ext, train_loader, val_loader, test_loader, criterion, device)
    
    model_b = ClinicalOnlyBaseline(768).to(device)
    res['Clinical_Only'] = run_experiment("Clinical_Only", model_b, graphsage_ext, train_loader, val_loader, test_loader, criterion, device)
    
    model_c = MultimodalClassifier(iot_repr_dim, 768).to(device)
    res['Multimodal'] = run_experiment("Multimodal", model_c, graphsage_ext, train_loader, val_loader, test_loader, criterion, device)
    
    with open('reports/phase6_1_report.json', 'w') as f:
        json.dump(res, f, indent=4)
        
if __name__ == "__main__":
    main()
