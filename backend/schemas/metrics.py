from pydantic import BaseModel
from typing import Any, Dict, List, Union

class MetricResponse(BaseModel):
    source: str
    status: str = "verified"
    data: Union[Dict[str, Any], List[Dict[str, Any]]]
