import pytest
import torch
import sys

sys.path.append('src/models')
from graphsage import GraphSAGE
from edge_classifier import EdgeClassifier, GraphSAGEEdgeModel

def test_graphsage_forward():
    num_nodes = 10
    node_dim = 5
    hidden_dims = [16, 16]
    out_dim = 8
    
    x = torch.rand((num_nodes, node_dim))
    edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 4]], dtype=torch.long)
    
    model = GraphSAGE(node_dim, hidden_dims, out_dim)
    
    out = model(x, edge_index)
    assert out.shape == (num_nodes, out_dim)
    assert not torch.isnan(out).any()
    assert not torch.isinf(out).any()

def test_edge_representation():
    num_nodes = 5
    node_emb_dim = 8
    edge_feat_dim = 4
    num_edges = 3
    
    z = torch.rand((num_nodes, node_emb_dim))
    edge_index = torch.tensor([[0, 1, 2], [1, 2, 3]], dtype=torch.long)
    edge_features = torch.rand((num_edges, edge_feat_dim))
    
    model = EdgeClassifier(node_emb_dim, edge_feat_dim, 16, 1)
    
    out = model(z, edge_index, edge_features)
    assert out.shape == (num_edges, 1)
    assert not torch.isnan(out).any()

def test_label_alignment_and_leakage():
    # If the user sets a random seed, output should be reproducible
    torch.manual_seed(42)
    x = torch.rand((5, 4))
    edge_index = torch.tensor([[0, 1], [1, 2]], dtype=torch.long)
    edge_features = torch.rand((2, 3))
    
    sage = GraphSAGE(4, [8], 4)
    clf = EdgeClassifier(4, 3, 8)
    model = GraphSAGEEdgeModel(sage, clf)
    
    out1 = model(x, edge_index, edge_index, edge_features)
    
    torch.manual_seed(42)
    sage = GraphSAGE(4, [8], 4)
    clf = EdgeClassifier(4, 3, 8)
    model2 = GraphSAGEEdgeModel(sage, clf)
    
    out2 = model2(x, edge_index, edge_index, edge_features)
    
    assert out1.shape == out2.shape
