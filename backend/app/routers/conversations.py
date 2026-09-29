"""
Conversation routes. Conversations are created as a side effect of a
successful n8n automation call (see app/routers/automation.py) — the
message sent to the AI Agent and the real text it responded with.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.dependencies.auth import get_current_user
from app.schemas.conversation import ConversationListResponse, ConversationOut
from app.services.conversation_service import (
    build_conversations_query,
    get_conversation_or_404,
    paginate_conversations,
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=ConversationListResponse)
def list_conversations(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = build_conversations_query(db, current_user)
    items, total, pages = paginate_conversations(query, page, limit)
    return ConversationListResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_conversation_or_404(db, current_user, conversation_id)
