from pydantic import BaseModel
from typing import List, Optional, Any

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    interaction_state: Optional[dict] = None

class InteractionUpdate(BaseModel):
    field: str
    value: str

class HCPResponse(BaseModel):
    id: int
    name: str
    specialty: str
    organization: str
    location: str

    class Config:
        orm_mode = True
