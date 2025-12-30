from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Optional

class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "Quels sont les points faibles du Real Madrid ?"
            }
        }
    }

class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440004",
                "role": "assistant",
                "content": "Le Real Madrid a quelques lacunes défensives sur les coups de pied arrêtés...",
                "created_at": "2024-03-31T08:05:00Z"
            }
        }
    }

class ChatHistoryResponse(BaseModel):
    analysis_id: UUID
    messages: List[ChatMessageResponse]

