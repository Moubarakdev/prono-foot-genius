import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MatchAnalysisRequest(BaseModel):
    """Request schema for match analysis."""
    home_team: str | None = Field(None, min_length=2)
    away_team: str | None = Field(None, min_length=2)
    fixture_id: int | None = None  # Optional, can search by team names


class CustomAnalysisRequest(BaseModel):
    """Request schema for custom 1vs1 analysis."""
    home_team_id: int
    away_team_id: int


class PredictionResult(BaseModel):
    """Prediction probabilities."""
    home: float = Field(..., ge=0, le=1)
    draw: float = Field(..., ge=0, le=1)
    away: float = Field(..., ge=0, le=1)


class ScenarioResult(BaseModel):
    """Match scenario."""
    name: str
    probability: float
    description: str


class ValueBet(BaseModel):
    """Value bet information."""
    outcome: str
    ai_probability: float
    market_odds: float
    value_percentage: float
    is_value: bool


class MatchAnalysisResponse(BaseModel):
    """Response schema for match analysis."""
    id: uuid.UUID
    
    # Match info
    fixture_id: int
    home_team: str
    away_team: str
    league_name: str
    match_date: datetime
    
    # Predictions
    predictions: PredictionResult
    predicted_outcome: str
    confidence_score: float
    
    # Content
    summary: str
    key_factors: list[str]
    scenarios: list[ScenarioResult]
    
    # Value Search
    value_bet: ValueBet | None = None

    # Result (if available)
    actual_result: str | None = None
    was_correct: bool | None = None
    
    created_at: datetime
    
    class Config:
        from_attributes = True


class MatchAnalysisListResponse(BaseModel):
    """Response schema for list of analyses."""
    id: uuid.UUID
    home_team: str
    away_team: str
    league_name: str
    match_date: datetime
    predicted_outcome: str
    confidence_score: float
    was_correct: bool | None
    created_at: datetime
    
    class Config:
        from_attributes = True
