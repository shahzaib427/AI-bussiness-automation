"""Pydantic schemas for conversation endpoints."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ConversationOut(BaseModel):
    id: int
    user_id: int
    session_id: str
    message: str
    response: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationListResponse(BaseModel):
    items: List[ConversationOut]
    total: int
    page: int
    limit: int
    pages: int
