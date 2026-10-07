from fastapi import APIRouter, HTTPException
from backend.schemas.inference import InferenceRequest, InferenceResponse
from backend.services.inference_service import predict
import os

router = APIRouter(prefix="/api/inference", tags=["inference"])

@router.post("", response_model=InferenceResponse, description="Research demonstration using the frozen Phase 7.3 federated IoT EdgeMLP model.")
def run_inference(request: InferenceRequest):
    try:
        result = predict(request.features)
        return InferenceResponse(
            status="success",
            model="phase7_3_fedavg_global_model",
            prediction=result,
            demo_only=True
        )
    except FileNotFoundError as e:
        # User Instruction: "Mark live inference as BLOCKED... Handle missing... clear error"
        raise HTTPException(status_code=503, detail={"status": "BLOCKED", "message": str(e), "limitation": "The required frozen model or preprocessing artifact was not found in the Phase 7.3 output directory. Inference is blocked."})
    except Exception as e:
        raise HTTPException(status_code=422, detail={"status": "error", "message": f"Inference failed: {str(e)}"})
