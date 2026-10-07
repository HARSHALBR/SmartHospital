import torch
import torch.nn as torch_nn
import os

class EdgeMLP(torch_nn.Module):
    def __init__(self, edge_dim=31):
        super().__init__()
        self.mlp = torch_nn.Sequential(
            torch_nn.Linear(edge_dim, 128),
            torch_nn.ReLU(),
            torch_nn.Dropout(0.3),
            torch_nn.Linear(128, 1)
        )
    def forward(self, edge_attr):
        return self.mlp(edge_attr)

# Singleton model instance
_model = None

def get_model():
    global _model
    if _model is not None:
        return _model
        
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(project_root, 'results', 'phase7_3', 'fedavg_global_model.pth')
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Verified model artifact not found at {model_path}")
        
    _model = EdgeMLP(edge_dim=31)
    
    # Use weights_only=True for safety if possible, but fallback to False if PyTorch version is older
    try:
        state_dict = torch.load(model_path, map_location=torch.device('cpu'), weights_only=True)
    except TypeError:
        state_dict = torch.load(model_path, map_location=torch.device('cpu'))
        
    _model.load_state_dict(state_dict)
    _model.eval()
    return _model

def predict(features: list):
    model = get_model()
    # Features is a list of exactly 31 floats
    x = torch.tensor([features], dtype=torch.float32)
    with torch.no_grad():
        logits = model(x)
        prob = torch.sigmoid(logits).item()
        
    # Standard 0.5 threshold from binary cross entropy training
    threshold = 0.5
    label = "Attack" if prob >= threshold else "Normal"
    
    return {
        "label": label,
        "attack_probability": round(prob, 4),
        "threshold": threshold
    }
