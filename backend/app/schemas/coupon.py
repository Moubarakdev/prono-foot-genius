import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SelectionCreate(BaseModel):
    """Schema for creating a coupon selection."""
    fixture_id: int
    home_team: str
    away_team: str
    match_date: datetime
    selection_type: str  # "1", "X", "2", "Over 2.5", etc.
    odds: float = Field(..., gt=1.0)


class SelectionResponse(BaseModel):
    """Schema for coupon selection response."""
    id: uuid.UUID
    fixture_id: int
    home_team: str
    away_team: str
    match_date: datetime
    selection_type: str
    odds: float
    implied_probability: float
    ai_probability: float
    edge: float
    result: str
    
    class Config:
        from_attributes = True


class CouponCreate(BaseModel):
    """Schema for creating a coupon."""
    selections: list[SelectionCreate] = Field(..., min_length=1)



class CouponResponse(BaseModel):
    """Schema for coupon response."""
    id: uuid.UUID
    user_id: uuid.UUID
    coupon_type: str
    
    # Metrics
    total_odds: float

    
    # Analysis
    success_probability: float
    risk_level: str
    ai_recommendation: str
    weak_points: list[str]
    ai_analysis: dict | None = None
    
    # Status
    status: str
    matches_won: int
    matches_lost: int
    
    # Selections
    selections: list[SelectionResponse]
    
    created_at: datetime
    resolved_at: datetime | None
    
    class Config:
        from_attributes = True


class CouponListResponse(BaseModel):
    """Schema for list of coupons."""
    id: uuid.UUID
    coupon_type: str
    total_odds: float
    success_probability: float
    risk_level: str
    status: str
    selections_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class DailyCouponsResponse(BaseModel):
    """Schema for daily coupons response."""
    date: str
    safe: CouponResponse | None
    balanced: CouponResponse | None
    ambitious: CouponResponse | None
