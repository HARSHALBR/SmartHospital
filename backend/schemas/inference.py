from pydantic import BaseModel, Field
from typing import List, Dict, Any

class InferenceRequest(BaseModel):
    # 31 exact edge features from Phase 4.2
    features: List[float] = Field(..., min_length=31, max_length=31, description="Exactly 31 normalized network flow features.")

class InferenceResponse(BaseModel):
    status: str
    model: str
    prediction: Dict[str, Any]
    demo_only: bool = True
