import os
import torch
import torch.nn as nn

class ModalityProjector(nn.Module):
    def __init__(self, in_dim, out_dim=128):
        super().__init__()
        self.proj = nn.Sequential(
            nn.Linear(in_dim, out_dim),
            nn.ReLU(),
            nn.Dropout(0.3)
        )
        
    def forward(self, x):
        return self.proj(x)

class ConcatFusion(nn.Module):
    def __init__(self, proj_dim=128, hidden_dim=128):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(proj_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, 1)
        )
        
    def forward(self, iot_emb, clin_emb):
        # iot_emb: [batch, proj_dim]
        # clin_emb: [batch, proj_dim]
        # Concat along feature dim
        fused = torch.cat([iot_emb, clin_emb], dim=-1)
        return self.mlp(fused)

class MultimodalClassifier(nn.Module):
    def __init__(self, iot_in_dim, clin_in_dim=768, proj_dim=128, hidden_dim=128):
        super().__init__()
        self.iot_proj = ModalityProjector(iot_in_dim, proj_dim)
        self.clin_proj = ModalityProjector(clin_in_dim, proj_dim)
        self.fusion = ConcatFusion(proj_dim, hidden_dim)
        
    def forward(self, iot_repr, clin_repr):
        iot_p = self.iot_proj(iot_repr)
        clin_p = self.clin_proj(clin_repr)
        return self.fusion(iot_p, clin_p)
