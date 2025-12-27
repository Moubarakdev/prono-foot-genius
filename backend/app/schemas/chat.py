from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Optional

class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    analysis_id: UUID
    messages: List[ChatMessageResponse]
