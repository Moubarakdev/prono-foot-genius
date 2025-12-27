import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import String, Boolean, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class ProfileType(str, Enum):
    SAFE = "safe"
    BALANCED = "balanced"
    AMBITIOUS = "ambitious"


class SubscriptionType(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    LIFETIME = "lifetime"


class User(Base):
    """User model for authentication and preferences."""
    
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Preferences
    profile_type: Mapped[str] = mapped_column(
        String(20),
        default=ProfileType.BALANCED.value
    )
    favorite_leagues: Mapped[list] = mapped_column(JSON, default=list)
    
    # Subscription
    subscription: Mapped[str] = mapped_column(
        String(20),
        default=SubscriptionType.FREE.value
    )
    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    payment_method: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="stripe or moneroo - used to determine renewal behavior"
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    daily_analyses_used: Mapped[int] = mapped_column(Integer, default=0)
    daily_analyses_reset_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Verification & OTP
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    otp_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Refresh Token
    refresh_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Relationships
    analyses: Mapped[list["MatchAnalysis"]] = relationship("MatchAnalysis", back_populates="user")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="user")
    
    @property
    def analyses_limit(self) -> int:
        """Get daily analyses limit based on subscription."""
        limits = {
            SubscriptionType.FREE.value: 1,
            SubscriptionType.STARTER.value: 5,
            SubscriptionType.PRO.value: -1,  # Unlimited
            SubscriptionType.LIFETIME.value: -1,
        }
        return limits.get(self.subscription, 1)
