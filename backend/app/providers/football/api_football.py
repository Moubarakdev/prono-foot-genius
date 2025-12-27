import httpx
from datetime import datetime, timedelta
from typing import Any, List, Optional, Dict
from ..base import BaseFootballProvider
from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

class ApiFootballProvider(BaseFootballProvider):
    """Concrete implementation of Football Data Provider using API-Football."""
    
    def __init__(self):
        self.base_url = settings.football_api_base_url
        self.headers = {
            "x-rapidapi-key": settings.football_api_key,
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
    
    async def _request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make an API request with logging and error handling."""
        async with httpx.AsyncClient() as client:
            try:
                logger.debug(f"API-Football Request: {endpoint} with params {params}")
                response = await client.get(
                    f"{self.base_url}/{endpoint}",
                    headers=self.headers,
                    params=params or {},
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("errors"):
                    logger.error(f"API-Football Errors for {endpoint}: {result['errors']}")
                    return {"response": [], "errors": result["errors"]}
                
                return result
            except httpx.HTTPStatusError as e:
                logger.error(f"API-Football HTTP Error for {endpoint}: {e.response.status_code} - {e.response.text}")
                return {"response": [], "errors": {"http": str(e)}}
            except Exception as e:
                logger.error(f"API-Football Exception for {endpoint}: {str(e)}")
                return {"response": [], "errors": {"exception": str(e)}}
    
    async def get_fixtures(
        self,
        date: Optional[str] = None,
        league: Optional[int] = None,
        team: Optional[int] = None,
        next: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        params = {}
        if date:
            params["date"] = date
        if league:
            params["league"] = league
        if team:
            params["team"] = team
            
        limit = None
        if next:
            limit = next
            today = datetime.utcnow().date()
            end_date = today + timedelta(days=60)
            
            season = today.year
            if today.month < 7:
                season -= 1
            
            params["season"] = season
            params["from"] = today.strftime("%Y-%m-%d")
            params["to"] = end_date.strftime("%Y-%m-%d")
        
        result = await self._request("fixtures", params)
        fixtures = result.get("response", [])
        
        if limit and fixtures:
            fixtures.sort(key=lambda x: x["fixture"]["date"])
            return fixtures[:limit]
            
        return fixtures
    
    async def get_fixture_by_id(self, fixture_id: int) -> Optional[Dict[str, Any]]:
        result = await self._request("fixtures", {"id": fixture_id})
        fixtures = result.get("response", [])
        return fixtures[0] if fixtures else None
    
    async def get_statistics(self, fixture_id: int) -> List[Dict[str, Any]]:
        result = await self._request("fixtures/statistics", {"fixture": fixture_id})
        return result.get("response", [])
    
    async def get_head_to_head(
        self,
        team1_id: int,
        team2_id: int,
        last: int = 10
    ) -> List[Dict[str, Any]]:
        result = await self._request(
            "fixtures/headtohead",
            {"h2h": f"{team1_id}-{team2_id}", "last": last}
        )
        return result.get("response", [])
    
    async def get_team_statistics(
        self,
        team_id: int,
        league_id: int,
        season: Optional[int] = None
    ) -> Dict[str, Any]:
        if not season:
            season = datetime.utcnow().year
        
        result = await self._request(
            "teams/statistics",
            {"team": team_id, "league": league_id, "season": season}
        )
        return result.get("response", {})
    
    async def get_odds(
        self,
        fixture_id: int,
        bookmaker: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        params = {"fixture": fixture_id}
        if bookmaker:
            params["bookmaker"] = bookmaker
        
        result = await self._request("odds", params)
        return result.get("response", [])
    
    async def get_injuries(self, fixture_id: int) -> List[Dict[str, Any]]:
        result = await self._request("injuries", {"fixture": fixture_id})
        return result.get("response", [])
    
    async def get_predictions(self, fixture_id: int) -> Dict[str, Any]:
        result = await self._request("predictions", {"fixture": fixture_id})
        predictions = result.get("response", [])
        return predictions[0] if predictions else {}
    
    async def search_team(self, name: str) -> List[Dict[str, Any]]:
        result = await self._request("teams", {"search": name})
        return result.get("response", [])
    
    async def get_team_by_id(self, team_id: int) -> Optional[Dict[str, Any]]:
        result = await self._request("teams", {"id": team_id})
        response = result.get("response", [])
        return response[0]["team"] if response else None

    async def get_leagues(self, country: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {"current": "true"}
        if country:
            params["country"] = country
        
        result = await self._request("leagues", params)
        return result.get("response", [])

    async def search_fixture(self, home_team_name: str, away_team_name: str) -> Optional[Dict[str, Any]]:
        # 1. Search for home team
        home_teams = await self.search_team(home_team_name)
        if not home_teams:
            return None
        home_team_id = home_teams[0]["team"]["id"]
        
        # 2. Search for away team
        away_teams = await self.search_team(away_team_name)
        if not away_teams:
            return None
        away_team_id = away_teams[0]["team"]["id"]
        
        # 3. Get upcoming fixtures for home team
        # We look ahead to find the match against away team
        fixtures = await self.get_fixtures(team=home_team_id, next=10)
        
        for f in fixtures:
            f_home_id = f["teams"]["home"]["id"]
            f_away_id = f["teams"]["away"]["id"]
            
            if (f_home_id == home_team_id and f_away_id == away_team_id) or \
               (f_home_id == away_team_id and f_away_id == home_team_id):
                return f
                
        return None
