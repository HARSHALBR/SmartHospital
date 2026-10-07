import torch
import torch.nn as torch_nn
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv

class GraphSAGE(torch_nn.Module):
    def __init__(self, in_channels, hidden_channels_list, out_channels, dropout=0.5):
        super(GraphSAGE, self).__init__()
        
        self.convs = torch_nn.ModuleList()
        self.bns = torch_nn.ModuleList()
        self.dropout = dropout
        
        # Build layers based on hidden_channels_list
        if not hidden_channels_list:
            self.convs.append(SAGEConv(in_channels, out_channels))
        else:
            self.convs.append(SAGEConv(in_channels, hidden_channels_list[0]))
            self.bns.append(torch_nn.BatchNorm1d(hidden_channels_list[0]))
            
            for i in range(len(hidden_channels_list) - 1):
                self.convs.append(SAGEConv(hidden_channels_list[i], hidden_channels_list[i+1]))
                self.bns.append(torch_nn.BatchNorm1d(hidden_channels_list[i+1]))
                
            self.convs.append(SAGEConv(hidden_channels_list[-1], out_channels))
            
    def forward(self, x, edge_index):
        # We need to process layers
        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = self.bns[i](x)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)
            
        # Final layer (no ReLU or BN on the final node embedding output, usually)
        x = self.convs[-1](x, edge_index)
        return x
