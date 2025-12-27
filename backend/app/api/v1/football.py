from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.v1.auth import get_current_user
from app.core.config import get_settings
from app.core.logger import logger
from app.models import User
from app.services import cache_service, CACHE_TTL
from app.providers import get_football_provider
from app.providers.base import BaseFootballProvider
from app.schemas.football import TeamSearchResult, LeagueSearchResult, FixtureResult

settings = get_settings()

router = APIRouter(prefix="/football", tags=["Football Data"])

FootballProvider = Annotated[BaseFootballProvider, Depends(get_football_provider)]


@router.get("/fixtures", response_model=dict)
async def get_fixtures(
    current_user: Annotated[User, Depends(get_current_user)],
    date: str | None = Query(None, description="Date in YYYY-MM-DD format"),
    league: int | None = Query(None, description="League ID"),
    team: int | None = Query(None, description="Team ID"),
    next: int | None = Query(None, description="Get next N fixtures"),
    football_api: FootballProvider = None
):
    """Get football fixtures."""
    if not date and not next:
        date = datetime.utcnow().strftime("%Y-%m-%d")
    
    cache_key = f"fixtures:{date}:{league}:{team}:{next}"
    try:
        cached = await cache_service.get(cache_key)
        if cached:
            return {"fixtures": cached}
    except Exception as e:
        logger.error(f"Cache retrieval error for {cache_key}: {e}")
    
    logger.info(f"Fetching fixtures for user {current_user.email} (params: {date=}, {league=}, {team=}, {next=})")
    fixtures = await football_api.get_fixtures(
        date=date,
        league=league,
        team=team,
        next=next
    )
    
    try:
        await cache_service.set(cache_key, fixtures, CACHE_TTL["fixtures"])
    except Exception as e:
        logger.error(f"Cache set error for {cache_key}: {e}")
    
    return {"fixtures": fixtures}


@router.get("/leagues", response_model=list[LeagueSearchResult])
async def get_leagues(
    current_user: Annotated[User, Depends(get_current_user)],
    country: str | None = Query(None, description="Country name"),
    football_api: FootballProvider = None
):
    """Get available leagues."""
    cache_key = f"leagues:{country or 'all'}"
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    logger.info(f"Fetching leagues for user {current_user.email} (country: {country})")
    leagues = await football_api.get_leagues(country=country)
    
    await cache_service.set(cache_key, leagues, 24 * 60 * 60)  # 24h cache
    
    return leagues


@router.get("/teams/search", response_model=list[TeamSearchResult])
async def search_teams(
    current_user: Annotated[User, Depends(get_current_user)],
    name: str = Query(..., min_length=3, description="Team name"),
    football_api: FootballProvider = None
):
    """Search for a team by name."""
    cache_key = f"teams:search:{name.lower()}"
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    logger.info(f"Searching teams matching '{name}' for user {current_user.email}")
    teams = await football_api.search_team(name)
    
    await cache_service.set(cache_key, teams, 24 * 60 * 60)  # 24h cache
    
    return teams


@router.get("/teams/{team_id}/stats", response_model=dict)
async def get_team_stats(
    team_id: int,
    league_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    season: int | None = Query(None),
    football_api: FootballProvider = None
):
    """Get team statistics for a league."""
    cache_key = f"team_stats:{team_id}:{league_id}:{season}"
    cached = await cache_service.get(cache_key)
    if cached:
        return {"statistics": cached}
    
    logger.info(f"Fetching team stats for team {team_id}, league {league_id} for user {current_user.email}")
    stats = await football_api.get_team_statistics(
        team_id=team_id,
        league_id=league_id,
        season=season
    )
    
    await cache_service.set(cache_key, stats, CACHE_TTL["team_stats"])
    
    return {"statistics": stats}


@router.get("/h2h")
async def get_head_to_head(
    team1_id: int,
    team2_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    last: int = Query(10, ge=1, le=50, description="Number of matches"),
    football_api: FootballProvider = None
):
    """Get head-to-head history between two teams."""
    cache_key = f"h2h:{team1_id}:{team2_id}:{last}"
    cached = await cache_service.get(cache_key)
    if cached:
        return {"matches": cached}
    
    logger.info(f"Fetching H2H history between {team1_id} and {team2_id} for user {current_user.email}")
    h2h = await football_api.get_head_to_head(team1_id, team2_id, last)
    
    await cache_service.set(cache_key, h2h, CACHE_TTL["h2h"])
    
    return {"matches": h2h}


@router.get("/fixtures/{fixture_id}/odds", response_model=dict)
async def get_fixture_odds(
    fixture_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    football_api: FootballProvider = None
):
    """Get odds for a specific fixture."""
    cache_key = f"odds:{fixture_id}"
    cached = await cache_service.get(cache_key)
    if cached:
        return {"odds": cached}
    
    logger.info(f"Fetching odds for fixture {fixture_id} for user {current_user.email}")
    odds = await football_api.get_odds(fixture_id)
    
    await cache_service.set(cache_key, odds, CACHE_TTL["odds"])
    
    return {"odds": odds}
