"""
Business logic for conversations: persisting a turn (message + AI response)
and querying conversation history with pagination + ownership enforcement.

Conversations are created from real n8n AI Agent responses (see
app/routers/automation.py) — never fabricated text.
"""
import math
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database.models import Conversation, User, UserRole


def log_conversation(
    db: Session,
    user_id: int,
    message: str,
    response: Optional[str],
    session_id: Optional[str] = None,
) -> Conversation:
    conversation = Conversation(
        user_id=user_id,
        session_id=session_id or str(uuid4()),
        message=message,
        response=response,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def build_conversations_query(db: Session, current_user: User):
    query = db.query(Conversation)
    if current_user.role != UserRole.admin:
        query = query.filter(Conversation.user_id == current_user.id)
    return query


def paginate_conversations(query, page: int, limit: int):
    total = query.count()
    pages = max(1, math.ceil(total / limit))
    items = (
        query.order_by(Conversation.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return items, total, pages


def get_conversation_or_404(db: Session, current_user: User, conversation_id: int) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if current_user.role != UserRole.admin and conversation.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    return conversation
