from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

class ChatMessage(Base):
    """
    Model for storing chat messages related to a specific match analysis.
    This allows follow-up questions (Visifoot feature).
    """
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("match_analyses.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    role: Mapped[str] = mapped_column(String(20))  # 'user' or 'assistant'
    content: Mapped[str] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    analysis: Mapped["MatchAnalysis"] = relationship("MatchAnalysis", back_populates="chat_messages")
    user: Mapped["User"] = relationship("User")
