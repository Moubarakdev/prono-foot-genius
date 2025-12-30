import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MatchAnalysisRequest(BaseModel):
    """Request schema for match analysis."""
    home_team: str | None = Field(None, min_length=2)
    away_team: str | None = Field(None, min_length=2)
    fixture_id: int | None = None  # Optional, can search by team names

    model_config = {
        "json_schema_extra": {
            "example": {
                "home_team": "Paris Saint Germain",
                "away_team": "Marseille",
                "fixture_id": 123456
            }
        }
    }


class CustomAnalysisRequest(BaseModel):
    """Request schema for custom 1vs1 analysis."""
    home_team_id: int
    away_team_id: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "home_team_id": 33,
                "away_team_id": 34
            }
        }
    }


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
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "fixture_id": 123456,
                "home_team": "PSG",
                "away_team": "Marseille",
                "league_name": "Ligue 1",
                "match_date": "2024-03-31T20:45:00Z",
                "predictions": {"home": 0.6, "draw": 0.25, "away": 0.15},
                "predicted_outcome": "1",
                "confidence_score": 0.85,
                "summary": "Analyse du Clasico français...",
                "key_factors": ["Forme à domicile", "Absence de Mbappé"],
                "scenarios": [
                    {"name": "Victoire serrée", "probability": 0.45, "description": "1-0 ou 2-1"}
                ],
                "value_bet": {
                    "outcome": "1",
                    "ai_probability": 0.65,
                    "market_odds": 1.95,
                    "value_percentage": 0.26,
                    "is_value": True
                },
                "created_at": "2024-03-31T08:00:00Z"
            }
        }
    }



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
    
    model_config = {
        "from_attributes": True
    }

