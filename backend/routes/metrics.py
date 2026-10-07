from fastapi import APIRouter, HTTPException
from backend.schemas.metrics import MetricResponse
import sys
import os

# Append the project root so we can import src.api.data_layer
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(project_root, 'src'))

from api import data_layer

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

def _safe_fetch(fetch_fn, source_name):
    try:
        data = fetch_fn()
        if not data:
            raise ValueError("Empty data returned")
        return MetricResponse(source=source_name, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail={"status": "error", "message": "Verified experiment artifact unavailable."})

@router.get("/centralized-baselines", response_model=MetricResponse)
def get_centralized_baselines():
    return _safe_fetch(data_layer.get_centralized_baselines, "phase4_2/phase6_2/baselines")

@router.get("/multimodal-confounding", response_model=MetricResponse)
def get_multimodal_confounding():
    return _safe_fetch(data_layer.get_multimodal_confounding, "phase6_2/multimodal_robustness")

@router.get("/centralized-vs-federated", response_model=MetricResponse)
def get_centralized_vs_federated():
    return _safe_fetch(data_layer.get_centralized_vs_federated, "phase7_3/fair_comparison")

@router.get("/non-iid", response_model=MetricResponse)
def get_non_iid():
    return _safe_fetch(data_layer.get_non_iid_metrics, "phase8_1/summary.csv")

@router.get("/fedprox", response_model=MetricResponse)
def get_fedprox():
    return _safe_fetch(data_layer.get_fedprox_metrics, "phase8_2/mu_comparison.csv")

@router.get("/personalization", response_model=MetricResponse)
def get_personalization():
    return _safe_fetch(data_layer.get_personalization_metrics, "phase8_3/client_comparison.csv")

@router.get("/byzantine", response_model=MetricResponse)
def get_byzantine():
    return _safe_fetch(data_layer.get_byzantine_metrics, "phase8_4/summary.csv")

@router.get("/dp", response_model=MetricResponse)
def get_dp():
    return _safe_fetch(data_layer.get_dp_metrics, "phase9/privacy_accounting.csv")

@router.get("/secure-aggregation", response_model=MetricResponse)
def get_secure_aggregation():
    return _safe_fetch(data_layer.get_secure_agg_metrics, "phase9/secure_aggregation_comparison.csv")

@router.get("/attack-surface", response_model=MetricResponse)
def get_attack_surface():
    return _safe_fetch(data_layer.get_attack_surface, "phase9/attack_surface_matrix.csv")

@router.get("/all")
def get_all_metrics():
    try:
        data = data_layer.verify_data_layer()
        return MetricResponse(source="all_verified_artifacts", data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail={"status": "error", "message": "Verified experiment artifact unavailable."})
