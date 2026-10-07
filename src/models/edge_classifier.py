import torch
import torch.nn as torch_nn
import torch.nn.functional as F

class EdgeClassifier(torch_nn.Module):
    def __init__(self, node_emb_dim, edge_feat_dim, hidden_dim, out_dim=1, dropout=0.5):
        super(EdgeClassifier, self).__init__()
        
        # Edge representation: [z_u, z_v, |z_u - z_v|, edge_features]
        in_dim = node_emb_dim * 3 + edge_feat_dim
        
        self.mlp = torch_nn.Sequential(
            torch_nn.Linear(in_dim, hidden_dim),
            torch_nn.ReLU(),
            torch_nn.Dropout(dropout),
            torch_nn.Linear(hidden_dim, out_dim)
        )
        
    def forward(self, z, edge_index, edge_features):
        src, dst = edge_index[0], edge_index[1]
        
        z_u = z[src]
        z_v = z[dst]
        z_diff = torch.abs(z_u - z_v)
        
        edge_repr = torch.cat([z_u, z_v, z_diff, edge_features], dim=-1)
        return self.mlp(edge_repr)

class GraphSAGEEdgeModel(torch_nn.Module):
    def __init__(self, sage, edge_classifier):
        super(GraphSAGEEdgeModel, self).__init__()
        self.sage = sage
        self.edge_classifier = edge_classifier
        
    def forward(self, x, edge_index_msg, edge_index_target, edge_features):
        """
        To avoid message-passing leakage, we can use a separate edge_index_msg 
        (e.g., historical edges, or masked edges) if needed, 
        and edge_index_target for classification.
        In this implementation, we allow the caller to pass them separately.
        """
        # 1. Compute node embeddings using the message-passing graph
        z = self.sage(x, edge_index_msg)
        
        # 2. Predict on the target edges
        out = self.edge_classifier(z, edge_index_target, edge_features)
        return out
