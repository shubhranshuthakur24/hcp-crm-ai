from pydantic import BaseModel
from typing import List, Optional, Any

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    interaction_state: Optional[dict] = None

class LogInteractionRequest(BaseModel):
    data: dict

class HCPResponse(BaseModel):
    id: int
    name: str
    specialty: str
    organization: str
    location: str

    class ConfigDict:
        from_attributes = True
