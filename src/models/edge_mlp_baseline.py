import torch
import torch.nn as torch_nn

class EdgeMLPBaseline(torch_nn.Module):
    def __init__(self, edge_feat_dim, hidden_dim, out_dim=1, dropout=0.5):
        super(EdgeMLPBaseline, self).__init__()
        
        self.mlp = torch_nn.Sequential(
            torch_nn.Linear(edge_feat_dim, hidden_dim),
            torch_nn.ReLU(),
            torch_nn.Dropout(dropout),
            torch_nn.Linear(hidden_dim, out_dim)
        )
        
    def forward(self, edge_features):
        return self.mlp(edge_features)
