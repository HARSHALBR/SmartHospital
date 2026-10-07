import pandas as pd
import numpy as np

def compute_edge_features(df_window, model_features, agg_method='mean', group_cols=None):
    """
    Computes edge-level features by aggregating packet features per flow key.
    """
    if group_cols is None:
        group_cols = ['ip.src_host', 'ip.dst_host']
        
    # Group by the specified flow columns
    grouped = df_window.groupby(group_cols)[model_features]
    
    if agg_method == 'mean':
        edge_feats = grouped.mean().reset_index()
    elif agg_method == 'max':
        edge_feats = grouped.max().reset_index()
    else:
        edge_feats = grouped.mean().reset_index() # Default
        
    return edge_feats

def compute_node_features(df_window, model_features, agg_method='mean'):
    """
    Computes node-level features based on both outgoing and incoming traffic.
    Returns a dataframe indexed by Node IP.
    """
    # Outgoing traffic features
    out_grouped = df_window.groupby('ip.src_host')[model_features].mean()
    out_grouped.columns = [f"out_{c}" for c in out_grouped.columns]
    
    # Incoming traffic features
    in_grouped = df_window.groupby('ip.dst_host')[model_features].mean()
    in_grouped.columns = [f"in_{c}" for c in in_grouped.columns]
    
    # Combine (outer join to ensure all nodes are present)
    node_feats = pd.concat([out_grouped, in_grouped], axis=1).fillna(0.0)
    node_feats.index.name = 'ip'
    return node_feats.reset_index()
