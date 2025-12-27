import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import String, Float, DateTime, Integer, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class CouponType(str, Enum):
    USER_CREATED = "user_created"
    DAILY_SAFE = "daily_safe"
    DAILY_BALANCED = "daily_balanced"
    DAILY_AMBITIOUS = "daily_ambitious"


class CouponStatus(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


class SelectionResult(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    VOID = "void"


class Coupon(Base):
    """Coupon (bet slip) model."""
    
    __tablename__ = "coupons"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        index=True
    )
    
    # Type
    coupon_type: Mapped[str] = mapped_column(
        String(30),
        default=CouponType.USER_CREATED.value
    )
    
    # Metrics
    total_odds: Mapped[float] = mapped_column(Float)
    stake: Mapped[float | None] = mapped_column(Float, nullable=True)
    potential_win: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # AI Analysis
    success_probability: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(20))
    ai_recommendation: Mapped[str] = mapped_column(Text, default="")
    weak_points: Mapped[list] = mapped_column(JSON, default=list)
    ai_analysis: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Status
    status: Mapped[str] = mapped_column(
        String(20),
        default=CouponStatus.PENDING.value
    )
    matches_won: Mapped[int] = mapped_column(Integer, default=0)
    matches_lost: Mapped[int] = mapped_column(Integer, default=0)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    selections: Mapped[list["CouponSelection"]] = relationship(
        back_populates="coupon",
        cascade="all, delete-orphan"
    )


class CouponSelection(Base):
    """Individual match selection in a coupon."""
    
    __tablename__ = "coupon_selections"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    coupon_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("coupons.id"),
        index=True
    )
    
    # Match info
    fixture_id: Mapped[int] = mapped_column(Integer)
    home_team: Mapped[str] = mapped_column(String(255))
    away_team: Mapped[str] = mapped_column(String(255))
    match_date: Mapped[datetime] = mapped_column(DateTime)
    
    # Selection
    selection_type: Mapped[str] = mapped_column(String(50))  # "1", "X", "2", "Over 2.5"
    odds: Mapped[float] = mapped_column(Float)
    
    # Analysis
    implied_probability: Mapped[float] = mapped_column(Float)
    ai_probability: Mapped[float] = mapped_column(Float)
    edge: Mapped[float] = mapped_column(Float)  # ai_prob - implied_prob
    
    # Result
    result: Mapped[str] = mapped_column(
        String(20),
        default=SelectionResult.PENDING.value
    )
    
    # Relationship
    coupon: Mapped["Coupon"] = relationship(back_populates="selections")
