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
        # Define 3 clients
        c1_mask = df['label'].str.contains('Surgery', case=False, na=False)
        c2_mask = df['label'].str.contains('Consult', case=False, na=False) | df['label'].str.contains('Cardiovascular', case=False, na=False)
        c3_mask = ~(c1_mask | c2_mask)
        
        def safe_mean(mask):
            sub = clin_emb[mask]
            if len(sub) == 0:
                return clin_emb.mean(axis=0)
            return sub.mean(axis=0)
            
        # Aggregate (mean) clinical embeddings for each client
        self.c1_emb = torch.tensor(safe_mean(c1_mask), dtype=torch.float32)
        self.c2_emb = torch.tensor(safe_mean(c2_mask), dtype=torch.float32)
        self.c3_emb = torch.tensor(safe_mean(c3_mask), dtype=torch.float32)
        
    def get_client_id(self, attack_type):
        """Map IoT attack type to a specific client to simulate non-IID institutional silos."""
        atk = str(attack_type).lower()
        if 'ddos' in atk or 'dos' in atk:
            return 1
        elif 'port_scanning' in atk or 'vulnerability_scanner' in atk or 'fingerprinting' in atk:
            return 2
        else:
            return 3
            
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
        
        # Build dynamic clinical context based on client assignment
        clin_embs = []
        for atk in edges_df['Attack_type']:
            cid = self.client_sim.get_client_id(atk)
            clin_embs.append(self.client_sim.get_clinical_emb(cid))
            
        clin_embs = torch.stack(clin_embs)
        
        return {
            'x': x,
            'edge_index': edge_index,
            'edge_attr': edge_attr,
            'y': y,
            'clin_emb': clin_embs
        }

def collate_fn(batch):
    return batch[0]

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
        self.mlp = torch_nn.Sequential(
            torch_nn.Linear(iot_dim, 128),
            torch_nn.ReLU(),
            torch_nn.Dropout(0.3),
            torch_nn.Linear(128, 1)
        )
    def forward(self, iot_repr, clin_repr):
        return self.mlp(iot_repr)

class ClinicalOnlyBaseline(torch_nn.Module):
    def __init__(self, clin_dim=768):
        super().__init__()
        self.mlp = torch_nn.Sequential(
            torch_nn.Linear(clin_dim, 128),
            torch_nn.ReLU(),
            torch_nn.Dropout(0.3),
            torch_nn.Linear(128, 1)
        )
    def forward(self, iot_repr, clin_repr):
        return self.mlp(clin_repr)

def train_epoch(model, graphsage_ext, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    all_preds, all_labels = [], []
    
    for i, data in enumerate(loader):
        x, edge_index, edge_attr = data['x'].to(device), data['edge_index'].to(device), data['edge_attr'].to(device)
        y, clin_emb = data['y'].to(device), data['clin_emb'].to(device)
        
        if len(y) == 0: continue
        
        with torch.no_grad():
            z = graphsage_ext.sage(x, edge_index)
            z_u = z[edge_index[0]]
            z_v = z[edge_index[1]]
            z_diff = torch.abs(z_u - z_v)
            iot_repr = torch.cat([z_u, z_v, z_diff, edge_attr], dim=-1)
            
        optimizer.zero_grad()
        out = model(iot_repr, clin_emb).squeeze(-1)
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

def evaluate(model, graphsage_ext, loader, criterion, device):
    model.eval()
    total_loss = 0
    all_preds, all_labels = [], []
    
    with torch.no_grad():
        for data in loader:
            x, edge_index, edge_attr = data['x'].to(device), data['edge_index'].to(device), data['edge_attr'].to(device)
            y, clin_emb = data['y'].to(device), data['clin_emb'].to(device)
            
            if len(y) == 0: continue
            
            z = graphsage_ext.sage(x, edge_index)
            z_u = z[edge_index[0]]
            z_v = z[edge_index[1]]
            z_diff = torch.abs(z_u - z_v)
            iot_repr = torch.cat([z_u, z_v, z_diff, edge_attr], dim=-1)
            
            out = model(iot_repr, clin_emb).squeeze(-1)
            loss = criterion(out, y)
            
            total_loss += loss.item()
            preds = torch.sigmoid(out).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(y.cpu().numpy())
            
    return total_loss / len(loader), all_preds, all_labels

def run_experiment(name, model, graphsage_ext, train_loader, val_loader, test_loader, criterion, device):
    print(f"\n--- Running {name} ---")
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    best_f1 = -1.0
    t0 = time.time()
    
    for epoch in range(1):
        t_loss, _, _ = train_epoch(model, graphsage_ext, train_loader, optimizer, criterion, device)
        v_loss, v_preds, v_labels = evaluate(model, graphsage_ext, val_loader, criterion, device)
        v_metrics = compute_metrics(v_labels, v_preds)
        print(f"Epoch {epoch+1} - Train Loss: {t_loss:.4f} - Val Loss: {v_loss:.4f} - Val F1: {v_metrics['F1']:.4f}")
        
        if v_metrics['F1'] > best_f1:
            best_f1 = v_metrics['F1']
            torch.save(model.state_dict(), f'results/phase6/best_{name.replace(" ", "_")}.pth')
            
    try:
        model.load_state_dict(torch.load(f'results/phase6/best_{name.replace(" ", "_")}.pth', weights_only=True))
    except FileNotFoundError:
        print(f"Warning: No best model saved for {name} (F1 likely 0.0 or NaN). Using last epoch weights.")
    _, test_preds, test_labels = evaluate(model, graphsage_ext, test_loader, criterion, device)
    test_metrics = compute_metrics(test_labels, test_preds)
    test_metrics['Training_Time'] = time.time() - t0
    return test_metrics

def main():
    os.makedirs('results/phase6', exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    print("Initializing Client Simulator...")
    client_sim = ClientSimulator('results/phase5/embeddings_mean.npy', 'results/phase5/labels.json')
    
    data_path = 'graph_data/phase4_2_canonical_flow'
    train_dataset = IoTGraphWindowDataset(data_path, 'train', client_sim)
    val_dataset = IoTGraphWindowDataset(data_path, 'val', client_sim)
    test_dataset = IoTGraphWindowDataset(data_path, 'test', client_sim)
    
    train_loader = DataLoader(train_dataset, batch_size=1, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_dataset, batch_size=1, shuffle=False, collate_fn=collate_fn)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False, collate_fn=collate_fn)
    
    # Extract dimensions
    sample = train_dataset[0]
    node_dim = sample['x'].shape[1]
    edge_dim = sample['edge_attr'].shape[1]
    
    print("Loading pre-trained GraphSAGE feature extractor...")
    sage = GraphSAGE(in_channels=node_dim, hidden_channels_list=[128, 128], out_channels=64)
    classifier = EdgeClassifier(node_emb_dim=64, edge_feat_dim=edge_dim, hidden_dim=128)
    graphsage_ext = GraphSAGEEdgeModel(sage, classifier).to(device)
    
    # Load Phase 4.2 weights
    graphsage_ext.load_state_dict(torch.load('results/phase4_2/best_model_c.pth', map_location=device, weights_only=True))
    graphsage_ext.eval()
    
    iot_repr_dim = (64 * 2) + 64 + edge_dim # z_u, z_v, |z_u - z_v|, edge_attr => 64 + 64 + 64 + 31 = 223
    print(f"IoT Repr Dim: {iot_repr_dim}")
    
    pos_weight = torch.tensor([0.4622]).to(device) # using phase 4.2 weight
    criterion = torch_nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    results = {}
    
    model_a = IoTOnlyBaseline(iot_repr_dim).to(device)
    results['Experiment_A_IoT_Only'] = run_experiment("IoT_Only", model_a, graphsage_ext, train_loader, val_loader, test_loader, criterion, device)
    
    model_b = ClinicalOnlyBaseline(clin_dim=768).to(device)
    results['Experiment_B_Clinical_Only'] = run_experiment("Clinical_Only", model_b, graphsage_ext, train_loader, val_loader, test_loader, criterion, device)
    
    model_c = MultimodalClassifier(iot_in_dim=iot_repr_dim, clin_in_dim=768).to(device)
    results['Experiment_C_Multimodal'] = run_experiment("Multimodal", model_c, graphsage_ext, train_loader, val_loader, test_loader, criterion, device)
    
    with open('reports/phase6_multimodal_report.json', 'w') as f:
        json.dump(results, f, indent=4)
        
    print("Phase 6 execution complete!")

if __name__ == "__main__":
    main()
