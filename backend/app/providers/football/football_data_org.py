"""
Football-Data.org API Provider - Free API for fixtures and standings
https://www.football-data.org/
"""
import httpx
import time
from datetime import datetime, timedelta
from typing import Any, List, Optional, Dict
from ..base import BaseFootballProvider
from app.core.config import get_settings
from app.core.logger import get_logger

settings = get_settings()
logger = get_logger('providers.football_data_org')


class FootballDataOrgProvider(BaseFootballProvider):
    """
    Provider for Football-Data.org API (free tier).
    
    Free tier limits:
    - 10 requests per minute
    - Access to major European leagues
    - Fixtures, standings, team info
    """
    
    def __init__(self):
        self.base_url = "https://api.football-data.org/v4"
        self.headers = {
            "X-Auth-Token": settings.football_data_api_key
        }
        
        # Competition IDs mapping
        self.competitions = {
            "premier_league": 2021,  # England
            "la_liga": 2014,          # Spain
            "bundesliga": 2002,       # Germany
            "serie_a": 2019,          # Italy
            "ligue_1": 2015,          # France
            "eredivisie": 2003,       # Netherlands
            "liga_portugal": 2017,    # Portugal
            "champions_league": 2001,
            "europa_league": 2146,
            "world_cup": 2000
        }
    
    async def _request(
        self, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make an API request with error handling."""
        start_time = time.time()
        
        async with httpx.AsyncClient() as client:
            try:
                logger.debug(
                    f"📡 Football-Data.org API call: {endpoint}",
                    extra={'extra_data': {
                        'endpoint': endpoint,
                        'params': params
                    }}
                )
                
                response = await client.get(
                    f"{self.base_url}/{endpoint}",
                    headers=self.headers,
                    params=params or {},
                    timeout=30.0
                )
                response.raise_for_status()
                
                duration_ms = (time.time() - start_time) * 1000
                logger.log_external_api(
                    'Football-Data.org',
                    endpoint,
                    f"{response.status_code}",
                    duration_ms
                )
                
                return response.json()
                
            except httpx.HTTPStatusError as e:
                duration_ms = (time.time() - start_time) * 1000
                status_code = e.response.status_code
                error_msg = e.response.text
                
                # Handle specific errors
                if status_code == 403:
                    logger.warning(
                        f"⚠️ Football-Data.org 403 Forbidden: {endpoint} (restricted in free tier)",
                        extra={'extra_data': {
                            'endpoint': endpoint,
                            'status_code': 403,
                            'duration_ms': duration_ms,
                            'error': error_msg[:200]
                        }}
                    )
                elif status_code == 429:
                    logger.error(
                        f"🚫 Football-Data.org Rate Limit (429): {endpoint} (10 req/min exceeded)",
                        extra={'extra_data': {
                            'endpoint': endpoint,
                            'status_code': 429,
                            'duration_ms': duration_ms,
                            'error': 'Rate limit exceeded'
                        }}
                    )
                else:
                    logger.error(
                        f"❌ Football-Data.org HTTP {status_code}: {endpoint}",
                        extra={'extra_data': {
                            'endpoint': endpoint,
                            'status_code': status_code,
                            'duration_ms': duration_ms,
                            'error': error_msg[:200]
                        }}
                    )
                
                return {"error": str(e), "matches": [], "competitions": [], "teams": []}
            
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                logger.error(
                    f"❌ Football-Data.org Exception: {endpoint} ({duration_ms:.0f}ms): {str(e)}",
                    exc_info=True,
                    extra={'extra_data': {
                        'endpoint': endpoint,
                        'duration_ms': duration_ms,
                        'error': str(e)
                    }}
                )
                return {"error": str(e), "matches": [], "competitions": [], "teams": []}
    
    async def get_fixtures(
        self,
        date: Optional[str] = None,
        league: Optional[int] = None,
        team: Optional[int] = None,
        next: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get fixtures from Football-Data.org.
        
        Returns fixtures in standardized format compatible with existing code.
        """
        params = {}
        
        if date:
            params["dateFrom"] = date
            params["dateTo"] = date
        
        if next:
            # Get upcoming matches (max 10 days for Football-Data.org free tier)
            today = datetime.utcnow().date()
            end_date = today + timedelta(days=10)  # Limit to 10 days
            params["dateFrom"] = today.strftime("%Y-%m-%d")
            params["dateTo"] = end_date.strftime("%Y-%m-%d")
            params["status"] = "SCHEDULED"
        
        # Determine endpoint
        if team:
            endpoint = f"teams/{team}/matches"
        elif league:
            endpoint = f"competitions/{league}/matches"
        else:
            endpoint = "matches"
        
        result = await self._request(endpoint, params)
        matches = result.get("matches", [])
        
        # Convert to standardized format
        standardized = []
        for match in matches:
            try:
                standardized.append(self._convert_match_format(match))
            except Exception as e:
                logger.error(f"Error converting match format: {e}")
                continue
        
        # Apply limit if needed
        if next and standardized:
            standardized.sort(key=lambda x: x["fixture"]["date"])
            standardized = standardized[:next]
        
        return standardized
    
    def _convert_match_format(self, match: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert Football-Data.org format to our standardized format
        (compatible with API-Football structure).
        """
        return {
            "fixture": {
                "id": match.get("id"),
                "date": match.get("utcDate"),
                "timestamp": int(datetime.fromisoformat(
                    match.get("utcDate", "").replace("Z", "+00:00")
                ).timestamp()) if match.get("utcDate") else None,
                "venue": {
                    "name": match.get("venue"),
                    "city": None
                },
                "status": {
                    "short": self._convert_status(match.get("status")),
                    "long": match.get("status"),
                    "elapsed": match.get("minute")
                }
            },
            "league": {
                "id": match.get("competition", {}).get("id"),
                "name": match.get("competition", {}).get("name"),
                "country": match.get("area", {}).get("name"),
                "logo": match.get("competition", {}).get("emblem"),
                "season": match.get("season", {}).get("startDate", "")[:4]
            },
            "teams": {
                "home": {
                    "id": match.get("homeTeam", {}).get("id"),
                    "name": match.get("homeTeam", {}).get("name"),
                    "logo": match.get("homeTeam", {}).get("crest")
                },
                "away": {
                    "id": match.get("awayTeam", {}).get("id"),
                    "name": match.get("awayTeam", {}).get("name"),
                    "logo": match.get("awayTeam", {}).get("crest")
                }
            },
            "goals": {
                "home": match.get("score", {}).get("fullTime", {}).get("home"),
                "away": match.get("score", {}).get("fullTime", {}).get("away")
            },
            "score": {
                "halftime": {
                    "home": match.get("score", {}).get("halfTime", {}).get("home"),
                    "away": match.get("score", {}).get("halfTime", {}).get("away")
                },
                "fulltime": {
                    "home": match.get("score", {}).get("fullTime", {}).get("home"),
                    "away": match.get("score", {}).get("fullTime", {}).get("away")
                }
            }
        }
    
    def _convert_status(self, status: str) -> str:
        """Convert Football-Data.org status to short format."""
        status_map = {
            "SCHEDULED": "NS",  # Not Started
            "TIMED": "NS",
            "IN_PLAY": "1H",    # First Half
            "PAUSED": "HT",     # Half Time
            "FINISHED": "FT",   # Full Time
            "POSTPONED": "PST",
            "CANCELLED": "CANC",
            "SUSPENDED": "SUSP"
        }
        return status_map.get(status, "NS")
    
    async def get_fixture_by_id(self, fixture_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific fixture by ID."""
        result = await self._request(f"matches/{fixture_id}")
        
        if "error" in result or not result:
            return None
        
        try:
            return self._convert_match_format(result)
        except Exception as e:
            logger.error(f"Error converting fixture {fixture_id}: {e}")
            return None
    
    async def get_leagues(self, country: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get available leagues/competitions."""
        result = await self._request("competitions")
        competitions = result.get("competitions", [])
        
        if country:
            competitions = [
                c for c in competitions 
                if c.get("area", {}).get("name", "").lower() == country.lower()
            ]
        
        # Convert to standardized format
        standardized = []
        for comp in competitions:
            standardized.append({
                "league": {
                    "id": comp.get("id"),
                    "name": comp.get("name"),
                    "type": comp.get("type"),
                    "logo": comp.get("emblem")
                },
                "country": {
                    "name": comp.get("area", {}).get("name"),
                    "code": comp.get("area", {}).get("code"),
                    "flag": comp.get("area", {}).get("flag")
                },
                "seasons": [{
                    "year": comp.get("currentSeason", {}).get("startDate", "")[:4],
                    "start": comp.get("currentSeason", {}).get("startDate"),
                    "end": comp.get("currentSeason", {}).get("endDate"),
                    "current": True
                }] if comp.get("currentSeason") else []
            })
        
        return standardized
    
    async def search_team(self, name: str) -> List[Dict[str, Any]]:
        """
        Search for teams.
        Note: Football-Data.org doesn't have a direct team search endpoint.
        We'll search across competitions.
        """
        # Search in major competitions
        all_teams = []
        
        for comp_id in [2021, 2014, 2002, 2019, 2015]:  # Major leagues
            result = await self._request(f"competitions/{comp_id}/teams")
            teams = result.get("teams", [])
            
            for team in teams:
                if name.lower() in team.get("name", "").lower():
                    all_teams.append({
                        "team": {
                            "id": team.get("id"),
                            "name": team.get("name"),
                            "code": team.get("tla"),
                            "country": team.get("area", {}).get("name"),
                            "logo": team.get("crest"),
                            "founded": team.get("founded"),
                            "venue": team.get("venue")
                        }
                    })
        
        return all_teams[:10]  # Limit to 10 results
    
    async def get_team_by_id(self, team_id: int) -> Optional[Dict[str, Any]]:
        """
        Get team details by ID.
        Note: Some teams are restricted in free tier (403).
        Returns None if not accessible.
        """
        result = await self._request(f"teams/{team_id}")
        
        if "error" in result or not result or not result.get("id"):
            logger.warning(f"Team {team_id} not accessible (may be restricted in free tier)")
            return None
        
        return {
            "id": result.get("id"),
            "name": result.get("name"),
            "code": result.get("tla"),
            "country": result.get("area", {}).get("name"),
            "logo": result.get("crest"),
            "founded": result.get("founded"),
            "venue": result.get("venue"),
            "website": result.get("website")
        }
    
    # Placeholder methods (not available in Football-Data.org free tier)
    async def get_statistics(self, fixture_id: int) -> List[Dict[str, Any]]:
        """Statistics not available in Football-Data.org - use FBref scraper."""
        logger.warning("Statistics not available in Football-Data.org - use scraper")
        return []
    
    async def get_head_to_head(
        self, 
        team1_id: int, 
        team2_id: int, 
        last: int = 10
    ) -> List[Dict[str, Any]]:
        """Get head-to-head matches."""
        team1_matches = await self.get_fixtures(team=team1_id)
        
        # Filter for matches against team2
        h2h = [
            m for m in team1_matches
            if (m["teams"]["home"]["id"] == team2_id or 
                m["teams"]["away"]["id"] == team2_id)
        ]
        
        # Sort by date descending
        h2h.sort(key=lambda x: x["fixture"]["date"], reverse=True)
        
        return h2h[:last]
    
    async def get_team_statistics(
        self, 
        team_id: int, 
        league_id: int, 
        season: Optional[int] = None
    ) -> Dict[str, Any]:
        """Team statistics not available - use FBref scraper."""
        logger.warning("Team statistics not available in Football-Data.org - use scraper")
        return {}
    
    async def get_odds(
        self, 
        fixture_id: int, 
        bookmaker: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Odds not available - use OddsChecker scraper."""
        logger.warning("Odds not available in Football-Data.org - use scraper")
        return []
    
    async def get_injuries(self, fixture_id: int) -> List[Dict[str, Any]]:
        """Injuries not available in free tier."""
        logger.warning("Injuries not available in Football-Data.org free tier")
        return []
    
    async def get_predictions(self, fixture_id: int) -> Dict[str, Any]:
        """Predictions not available."""
        logger.warning("Predictions not available in Football-Data.org")
        return {}
    
    async def search_fixture(
        self, 
        home_team_name: str, 
        away_team_name: str
    ) -> Optional[Dict[str, Any]]:
        """Search for a specific fixture."""
        # Get fixtures for next 30 days
        fixtures = await self.get_fixtures(next=100)
        
        for fixture in fixtures:
            home = fixture["teams"]["home"]["name"].lower()
            away = fixture["teams"]["away"]["name"].lower()
            
            if (home_team_name.lower() in home and 
                away_team_name.lower() in away):
                return fixture
        
        return None
