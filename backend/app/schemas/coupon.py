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
    id: str
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
    
    model_config = {
        "from_attributes": True
    }


class CouponCreate(BaseModel):
    """Schema for creating a coupon."""
    selections: list[SelectionCreate] = Field(..., min_length=1)

    model_config = {
        "json_schema_extra": {
            "example": {
                "selections": [
                    {
                        "fixture_id": 123456,
                        "home_team": "Liverpool",
                        "away_team": "Real Madrid",
                        "match_date": "2024-05-28T21:00:00Z",
                        "selection_type": "1",
                        "odds": 2.1
                    }
                ]
            }
        }
    }



class CouponResponse(BaseModel):
    """Schema for coupon response."""
    id: str
    user_id: str
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
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "user_id": "550e8400-e29b-41d4-a716-446655440002",
                "coupon_type": "custom",
                "total_odds": 4.5,
                "success_probability": 0.35,
                "risk_level": "medium",
                "ai_recommendation": "Coupon équilibré avec une bonne probabilité.",
                "status": "pending",
                "selections": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440003",
                        "fixture_id": 123456,
                        "home_team": "PSG",
                        "away_team": "Marseille",
                        "match_date": "2024-03-31T20:45:00Z",
                        "selection_type": "1",
                        "odds": 1.95,
                        "ai_probability": 0.65
                    }
                ],
                "created_at": "2024-03-31T08:00:00Z"
            }
        }
    }


class CouponListResponse(BaseModel):
    """Schema for list of coupons."""
    id: str
    coupon_type: str
    total_odds: float
    success_probability: float
    risk_level: str
    status: str
    selections_count: int
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class DailyCouponsResponse(BaseModel):
    """Schema for daily coupons response."""
    date: str
    safe: CouponResponse | None
    balanced: CouponResponse | None
    ambitious: CouponResponse | None
