import pandas as pd

def compute_edge_labels(df_window, binary_agg='max', multiclass_agg='mode', group_cols=None):
    """
    Computes labels for each edge based on the packets contributing to that flow.
    """
    if group_cols is None:
        group_cols = ['ip.src_host', 'ip.dst_host']

    # For binary, if any packet is an attack (1), the edge is an attack (max).
    binary_labels = df_window.groupby(group_cols)['Attack_label'].max().reset_index()
    
    def get_mode(x):
        modes = x.mode()
        if len(modes) > 0:
            if 'Normal' in modes.values and len(modes) > 1:
                return [m for m in modes if m != 'Normal'][0]
            return modes.iloc[0]
        return 'Normal'

    multiclass_labels = df_window.groupby(group_cols)['Attack_type'].apply(get_mode).reset_index()
    
    labels_df = pd.merge(binary_labels, multiclass_labels, on=group_cols)
    
    unique_binary = df_window.groupby(group_cols)['Attack_label'].nunique()
    mixed_edges = (unique_binary > 1).sum()
    
    return labels_df, mixed_edges
