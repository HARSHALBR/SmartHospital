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
from graphsage import GraphSAGE
from edge_classifier import EdgeClassifier, GraphSAGEEdgeModel
from edge_mlp_baseline import EdgeMLPBaseline

class IoTGraphWindowDataset(Dataset):
    def __init__(self, data_dir, split):
        self.data_dir = os.path.join(data_dir, split)
        self.windows = sorted(glob.glob(os.path.join(self.data_dir, 'window_*')))
        
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
        
        return {
            'x': x,
            'edge_index': edge_index,
            'edge_attr': edge_attr,
            'y': y,
            'window_id': os.path.basename(w_dir)
        }

def collate_fn(batch):
    return batch[0]

def train_epoch_baseline(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    all_preds, all_labels = [], []
    
    for i, data in enumerate(loader):
        edge_attr, y = data['edge_attr'].to(device), data['y'].to(device)
        if len(y) == 0: continue
        
        optimizer.zero_grad()
        out = model(edge_attr).squeeze(-1)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        preds = torch.sigmoid(out).detach().cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(y.cpu().numpy())
        
        if (i+1) % 1000 == 0:
            print(f"  Batch {i+1}/{len(loader)} loss: {loss.item():.4f}")
            
    return total_loss / len(loader), all_preds, all_labels

def evaluate_baseline(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    all_preds, all_labels = [], []
    
    with torch.no_grad():
        for data in loader:
            edge_attr, y = data['edge_attr'].to(device), data['y'].to(device)
            if len(y) == 0: continue
            out = model(edge_attr).squeeze(-1)
            loss = criterion(out, y)
            total_loss += loss.item()
            preds = torch.sigmoid(out).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(y.cpu().numpy())
            
    return total_loss / len(loader), all_preds, all_labels

def train_epoch_gnn(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    all_preds, all_labels = [], []
    
    for i, data in enumerate(loader):
        x, edge_index, edge_attr, y = data['x'].to(device), data['edge_index'].to(device), data['edge_attr'].to(device), data['y'].to(device)
        if len(y) == 0: continue
        
        optimizer.zero_grad()
        out = model(x, edge_index, edge_index, edge_attr).squeeze(-1)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        preds = torch.sigmoid(out).detach().cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(y.cpu().numpy())
        
        if (i+1) % 1000 == 0:
            print(f"  Batch {i+1}/{len(loader)} loss: {loss.item():.4f}")
            
    return total_loss / len(loader), all_preds, all_labels

def evaluate_gnn(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    all_preds, all_labels = [], []
    
    with torch.no_grad():
        for data in loader:
            x, edge_index, edge_attr, y = data['x'].to(device), data['edge_index'].to(device), data['edge_attr'].to(device), data['y'].to(device)
            if len(y) == 0: continue
            out = model(x, edge_index, edge_index, edge_attr).squeeze(-1)
            loss = criterion(out, y)
            total_loss += loss.item()
            preds = torch.sigmoid(out).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(y.cpu().numpy())
            
    return total_loss / len(loader), all_preds, all_labels

def compute_metrics(labels, preds):
    labels = np.array(labels)
    preds = np.array(preds)
    pred_labels = (preds >= 0.5).astype(int)
    
    try:
        acc = accuracy_score(labels, pred_labels)
        prec = precision_score(labels, pred_labels, zero_division=0)
        rec = recall_score(labels, pred_labels, zero_division=0)
        f1 = f1_score(labels, pred_labels, zero_division=0)
        
        if len(np.unique(labels)) > 1:
            roc_auc = roc_auc_score(labels, preds)
            pr_auc = average_precision_score(labels, preds)
        else:
            roc_auc, pr_auc = 0.0, 0.0
            
        cm = confusion_matrix(labels, pred_labels).tolist()
    except Exception as e:
        print("Metric error:", e)
        acc, prec, rec, f1, roc_auc, pr_auc, cm = 0, 0, 0, 0, 0, 0, []
        
    return {
        "Accuracy": float(acc),
        "Precision": float(prec),
        "Recall": float(rec),
        "F1": float(f1),
        "ROC-AUC": float(roc_auc),
        "PR-AUC": float(pr_auc),
        "Confusion_Matrix": cm
    }

def calculate_class_weights(loader):
    total_pos = 0
    total_neg = 0
    for data in loader:
        y = data['y']
        total_pos += y.sum().item()
        total_neg += (1 - y).sum().item()
    if total_pos == 0: return 1.0
    return total_neg / total_pos

def main():
    os.makedirs('results/phase4_2', exist_ok=True)
    os.makedirs('reports', exist_ok=True)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    data_path = 'graph_data/phase4_2_canonical_flow'
    train_dataset = IoTGraphWindowDataset(data_path, 'train')
    val_dataset = IoTGraphWindowDataset(data_path, 'val')
    test_dataset = IoTGraphWindowDataset(data_path, 'test')
    
    train_loader = DataLoader(train_dataset, batch_size=1, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_dataset, batch_size=1, shuffle=False, collate_fn=collate_fn)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False, collate_fn=collate_fn)
    
    sample = train_dataset[0]
    node_dim = sample['x'].shape[1]
    edge_dim = sample['edge_attr'].shape[1]
    
    print(f"Node feature dim: {node_dim}")
    print(f"Edge feature dim: {edge_dim}")
    
    # Calculate pos_weight dynamically for Phase 4.2
    pos_weight_val = calculate_class_weights(train_loader)
    print(f"Calculated pos_weight for BCE: {pos_weight_val:.4f}")
    pos_weight = torch.tensor([pos_weight_val]).to(device)
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    epochs = 3
    lr = 1e-3
    weight_decay = 1e-4
    hidden_dim = 128
    sage_out_dim = 64
    
    results = {}
    
    # EXPERIMENT A
    print("\n--- Experiment A: Edge MLP Baseline ---")
    model_a = EdgeMLPBaseline(edge_feat_dim=edge_dim, hidden_dim=hidden_dim).to(device)
    optimizer_a = torch.optim.AdamW(model_a.parameters(), lr=lr, weight_decay=weight_decay)
    
    best_val_f1 = 0
    t0 = time.time()
    
    for epoch in range(epochs):
        t_loss, _, _ = train_epoch_baseline(model_a, train_loader, optimizer_a, criterion, device)
        v_loss, v_preds, v_labels = evaluate_baseline(model_a, val_loader, criterion, device)
        v_metrics = compute_metrics(v_labels, v_preds)
        print(f"Epoch {epoch+1} - Train Loss: {t_loss:.4f} - Val Loss: {v_loss:.4f} - Val F1: {v_metrics['F1']:.4f}")
        if v_metrics['F1'] > best_val_f1:
            best_val_f1 = v_metrics['F1']
            torch.save(model_a.state_dict(), 'results/phase4_2/best_model_a.pth')
            
    model_a.load_state_dict(torch.load('results/phase4_2/best_model_a.pth', weights_only=True))
    _, test_preds_a, test_labels_a = evaluate_baseline(model_a, test_loader, criterion, device)
    test_metrics_a = compute_metrics(test_labels_a, test_preds_a)
    t_a = time.time() - t0
    
    results['Experiment_A_MLP'] = test_metrics_a
    results['Experiment_A_MLP']['Training_Time'] = t_a
    
    # EXPERIMENT C
    print("\n--- Experiment C: GraphSAGE + Edge Features ---")
    sage_c = GraphSAGE(in_channels=node_dim, hidden_channels_list=[hidden_dim, hidden_dim], out_channels=sage_out_dim)
    classifier_c = EdgeClassifier(node_emb_dim=sage_out_dim, edge_feat_dim=edge_dim, hidden_dim=hidden_dim)
    model_c = GraphSAGEEdgeModel(sage_c, classifier_c).to(device)
    optimizer_c = torch.optim.AdamW(model_c.parameters(), lr=lr, weight_decay=weight_decay)
    
    best_val_f1_c = 0
    t0 = time.time()
    for epoch in range(epochs):
        t_loss, _, _ = train_epoch_gnn(model_c, train_loader, optimizer_c, criterion, device)
        v_loss, v_preds, v_labels = evaluate_gnn(model_c, val_loader, criterion, device)
        v_metrics = compute_metrics(v_labels, v_preds)
        print(f"Epoch {epoch+1} - Train Loss: {t_loss:.4f} - Val Loss: {v_loss:.4f} - Val F1: {v_metrics['F1']:.4f}")
        if v_metrics['F1'] > best_val_f1_c:
            best_val_f1_c = v_metrics['F1']
            torch.save(model_c.state_dict(), 'results/phase4_2/best_model_c.pth')
            
    model_c.load_state_dict(torch.load('results/phase4_2/best_model_c.pth', weights_only=True))
    _, test_preds_c, test_labels_c = evaluate_gnn(model_c, test_loader, criterion, device)
    test_metrics_c = compute_metrics(test_labels_c, test_preds_c)
    t_c = time.time() - t0
    results['Experiment_C_GraphSAGE'] = test_metrics_c
    results['Experiment_C_GraphSAGE']['Training_Time'] = t_c

    # EXPERIMENT B
    print("\n--- Experiment B: GraphSAGE (No Edge Features) ---")
    sage_b = GraphSAGE(in_channels=node_dim, hidden_channels_list=[hidden_dim, hidden_dim], out_channels=sage_out_dim)
    class EdgeClassifierNoFeat(torch_nn.Module):
        def __init__(self, node_emb_dim, hidden_dim):
            super().__init__()
            self.mlp = torch_nn.Sequential(
                torch_nn.Linear(node_emb_dim * 3, hidden_dim),
                torch_nn.ReLU(),
                torch_nn.Linear(hidden_dim, 1)
            )
        def forward(self, z, edge_index, _):
            src, dst = edge_index[0], edge_index[1]
            z_u = z[src]
            z_v = z[dst]
            z_diff = torch.abs(z_u - z_v)
            edge_repr = torch.cat([z_u, z_v, z_diff], dim=-1)
            return self.mlp(edge_repr)
            
    classifier_b = EdgeClassifierNoFeat(node_emb_dim=sage_out_dim, hidden_dim=hidden_dim)
    model_b = GraphSAGEEdgeModel(sage_b, classifier_b).to(device)
    optimizer_b = torch.optim.AdamW(model_b.parameters(), lr=lr, weight_decay=weight_decay)
    
    best_val_f1_b = 0
    t0 = time.time()
    for epoch in range(epochs):
        t_loss, _, _ = train_epoch_gnn(model_b, train_loader, optimizer_b, criterion, device)
        v_loss, v_preds, v_labels = evaluate_gnn(model_b, val_loader, criterion, device)
        v_metrics = compute_metrics(v_labels, v_preds)
        print(f"Epoch {epoch+1} - Train Loss: {t_loss:.4f} - Val Loss: {v_loss:.4f} - Val F1: {v_metrics['F1']:.4f}")
        if v_metrics['F1'] > best_val_f1_b:
            best_val_f1_b = v_metrics['F1']
            torch.save(model_b.state_dict(), 'results/phase4_2/best_model_b.pth')
            
    model_b.load_state_dict(torch.load('results/phase4_2/best_model_b.pth', weights_only=True))
    _, test_preds_b, test_labels_b = evaluate_gnn(model_b, test_loader, criterion, device)
    test_metrics_b = compute_metrics(test_labels_b, test_preds_b)
    t_b = time.time() - t0
    results['Experiment_B_GraphSAGE_NoEdgeFeat'] = test_metrics_b
    results['Experiment_B_GraphSAGE_NoEdgeFeat']['Training_Time'] = t_b
    
    with open('reports/phase4_2_results.json', 'w') as f:
        json.dump(results, f, indent=4)
        
    print("Training 4.2 Complete!")

if __name__ == "__main__":
    main()
