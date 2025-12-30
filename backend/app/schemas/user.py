import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# --- User Schemas ---

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = ""


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response."""
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None
    is_verified: bool
    profile_type: str
    subscription: str
    daily_analyses_used: int
    analyses_limit: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user."""
    full_name: str | None = None
    avatar_url: str | None = None
    profile_type: str | None = None
    favorite_leagues: list[int] | None = None


class VerifyOTP(BaseModel):
    """Schema for OTP verification."""
    email: EmailStr
    otp_code: str


class PasswordChange(BaseModel):
    """Schema for password change."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr


class ResetPassword(BaseModel):
    """Schema for password reset with OTP."""
    email: EmailStr
    otp_code: str
    new_password: str = Field(..., min_length=8)


# --- Token Schemas ---

class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str  # User ID
    exp: datetime
    type: str  # "access" or "refresh"
