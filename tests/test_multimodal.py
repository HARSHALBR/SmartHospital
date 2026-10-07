import json
import torch
import sys
import numpy as np
sys.path.append('src/multimodal')
from fusion import ModalityProjector, ConcatFusion, MultimodalClassifier

def test_modality_projector():
    proj = ModalityProjector(in_dim=223, out_dim=128)
    x = torch.randn(10, 223)
    out = proj(x)
    assert out.shape == (10, 128)
    
def test_concat_fusion():
    fusion = ConcatFusion(proj_dim=128, hidden_dim=64)
    iot = torch.randn(5, 128)
    clin = torch.randn(5, 128)
    out = fusion(iot, clin)
    assert out.shape == (5, 1)

def test_multimodal_classifier():
    model = MultimodalClassifier(iot_in_dim=223, clin_in_dim=768, proj_dim=128)
    iot_repr = torch.randn(20, 223)
    clin_repr = torch.randn(20, 768)
    out = model(iot_repr, clin_repr)
    assert out.shape == (20, 1)
    
def test_nan_inf():
    model = MultimodalClassifier(iot_in_dim=223, clin_in_dim=768)
    iot_repr = torch.randn(2, 223)
    clin_repr = torch.randn(2, 768)
    out = model(iot_repr, clin_repr)
    assert not torch.isnan(out).any()
    assert not torch.isinf(out).any()
