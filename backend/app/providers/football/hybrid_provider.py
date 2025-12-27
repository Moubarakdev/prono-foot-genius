"""
Hybrid Football Data Provider - Orchestrates multiple data sources
Combines:
- Football-Data.org (fixtures)
- SofaScore (scores via scraping)
- OddsChecker (odds via scraping)
- FBref (statistics via scraping)
"""
from typing import Any, List, Optional, Dict
from ..base import BaseFootballProvider
from .football_data_org import FootballDataOrgProvider
from app.services.scrapers import SofaScoreScraper, OddsCheckerScraper, FBrefScraper
from app.core.logger import logger
from datetime import datetime


class HybridFootballProvider(BaseFootballProvider):
    """
    Hybrid provider that combines free API and web scraping sources.
    
    Data Sources:
    - Fixtures: Football-Data.org (free API)
    - Scores: SofaScore (scraping)
    - Odds: OddsChecker (scraping)
    - Statistics: FBref (scraping)
    """
    
    def __init__(self):
        # Initialize all providers
        self.football_data = FootballDataOrgProvider()
        self.sofascore = SofaScoreScraper()
        self.oddschecker = OddsCheckerScraper()
        self.fbref = FBrefScraper()
        
        logger.info("Hybrid Football Provider initialized with multiple sources")
    
    async def get_fixtures(
        self,
        date: Optional[str] = None,
        league: Optional[int] = None,
        team: Optional[int] = None,
        next: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get fixtures from Football-Data.org."""
        return await self.football_data.get_fixtures(
            date=date,
            league=league,
            team=team,
            next=next
        )
    
    async def get_fixture_by_id(self, fixture_id: int) -> Optional[Dict[str, Any]]:
        """Get fixture details and enrich with live scores if available."""
        fixture = await self.football_data.get_fixture_by_id(fixture_id)
        
        if not fixture:
            return None
        
        # Try to enrich with live score from SofaScore
        try:
            home_team = fixture["teams"]["home"]["name"]
            away_team = fixture["teams"]["away"]["name"]
            fixture_date = fixture["fixture"]["date"][:10]  # YYYY-MM-DD
            
            # Search for match on SofaScore
            sofascore_id = await self.sofascore.search_match(
                home_team, 
                away_team, 
                fixture_date
            )
            
            if sofascore_id:
                score_data = await self.sofascore.get_match_score(sofascore_id)
                if score_data:
                    # Enrich fixture with live score
                    fixture["live_score"] = score_data
                    logger.info(f"Enriched fixture {fixture_id} with SofaScore data")
        except Exception as e:
            logger.error(f"Error enriching fixture with SofaScore: {e}")
        
        return fixture
    
    async def get_statistics(self, fixture_id: int) -> List[Dict[str, Any]]:
        """Get match statistics from FBref."""
        try:
            # Get fixture to get team names
            fixture = await self.football_data.get_fixture_by_id(fixture_id)
            if not fixture:
                return []
            
            home_team = fixture["teams"]["home"]["name"]
            away_team = fixture["teams"]["away"]["name"]
            
            # Get stats from FBref
            stats = await self.fbref.get_match_stats(home_team, away_team)
            
            if not stats:
                return []
            
            # Convert to standardized format
            return [
                {
                    "team": fixture["teams"]["home"],
                    "statistics": [
                        {"type": "Goals Scored", "value": stats["home"].get("goals_scored", 0)},
                        {"type": "Goals Conceded", "value": stats["home"].get("goals_conceded", 0)},
                        {"type": "Shots per Game", "value": stats["home"].get("shots_per_game", 0)},
                        {"type": "Possession %", "value": stats["home"].get("possession_pct", 0)},
                        {"type": "Clean Sheets", "value": stats["home"].get("clean_sheets", 0)}
                    ]
                },
                {
                    "team": fixture["teams"]["away"],
                    "statistics": [
                        {"type": "Goals Scored", "value": stats["away"].get("goals_scored", 0)},
                        {"type": "Goals Conceded", "value": stats["away"].get("goals_conceded", 0)},
                        {"type": "Shots per Game", "value": stats["away"].get("shots_per_game", 0)},
                        {"type": "Possession %", "value": stats["away"].get("possession_pct", 0)},
                        {"type": "Clean Sheets", "value": stats["away"].get("clean_sheets", 0)}
                    ]
                }
            ]
        except Exception as e:
            logger.error(f"Error getting statistics for fixture {fixture_id}: {e}")
            return []
    
    async def get_head_to_head(
        self,
        team1_id: int,
        team2_id: int,
        last: int = 10
    ) -> List[Dict[str, Any]]:
        """Get head-to-head matches from Football-Data.org."""
        return await self.football_data.get_head_to_head(team1_id, team2_id, last)
    
    async def get_team_statistics(
        self,
        team_id: int,
        league_id: int,
        season: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get team statistics from FBref."""
        try:
            # Get team name
            team = await self.football_data.get_team_by_id(team_id)
            if not team:
                return {}
            
            team_name = team.get("name", "")
            
            # Get stats from FBref
            stats = await self.fbref.get_team_stats(team_name)
            
            if not stats:
                return {}
            
            # Convert to standardized format
            return {
                "team": team,
                "league": {"id": league_id},
                "form": stats.get("form", "N/A"),
                "fixtures": {
                    "played": {"total": 0},
                    "wins": {"total": 0},
                    "draws": {"total": 0},
                    "loses": {"total": 0}
                },
                "goals": {
                    "for": {"total": stats.get("goals_scored", 0)},
                    "against": {"total": stats.get("goals_conceded", 0)}
                },
                "clean_sheet": {"total": stats.get("clean_sheets", 0)},
                "statistics": {
                    "shots_per_game": stats.get("shots_per_game", 0),
                    "possession_pct": stats.get("possession_pct", 0)
                }
            }
        except Exception as e:
            logger.error(f"Error getting team statistics for team {team_id}: {e}")
            return {}
    
    async def get_odds(
        self,
        fixture_id: int,
        bookmaker: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get betting odds from OddsChecker."""
        try:
            # Get fixture to get team names
            fixture = await self.football_data.get_fixture_by_id(fixture_id)
            if not fixture:
                return []
            
            home_team = fixture["teams"]["home"]["name"]
            away_team = fixture["teams"]["away"]["name"]
            league_name = fixture["league"]["name"].lower().replace(" ", "-")
            
            # Get odds from OddsChecker
            odds = await self.oddschecker.get_match_odds(
                home_team, 
                away_team, 
                league_name
            )
            
            if not odds:
                return []
            
            # Convert to standardized format
            return [
                {
                    "fixture": {"id": fixture_id},
                    "bookmaker": {"name": odds.get("bookmaker", "Average")},
                    "bets": [
                        {
                            "name": "Match Winner",
                            "values": [
                                {"value": "Home", "odd": str(odds.get("home_win", "N/A"))},
                                {"value": "Draw", "odd": str(odds.get("draw", "N/A"))},
                                {"value": "Away", "odd": str(odds.get("away_win", "N/A"))}
                            ]
                        },
                        {
                            "name": "Goals Over/Under",
                            "values": [
                                {"value": "Over 2.5", "odd": str(odds.get("over_2_5", "N/A"))},
                                {"value": "Under 2.5", "odd": str(odds.get("under_2_5", "N/A"))}
                            ]
                        }
                    ]
                }
            ]
        except Exception as e:
            logger.error(f"Error getting odds for fixture {fixture_id}: {e}")
            return []
    
    async def get_injuries(self, fixture_id: int) -> List[Dict[str, Any]]:
        """Injuries not available in hybrid provider."""
        logger.warning("Injuries not available in hybrid provider")
        return []
    
    async def get_predictions(self, fixture_id: int) -> Dict[str, Any]:
        """Predictions not available - handled by AI service."""
        logger.warning("Predictions handled by AI service, not provider")
        return {}
    
    async def search_team(self, name: str) -> List[Dict[str, Any]]:
        """Search for teams in Football-Data.org."""
        return await self.football_data.search_team(name)
    
    async def get_team_by_id(self, team_id: int) -> Optional[Dict[str, Any]]:
        """Get team details from Football-Data.org."""
        return await self.football_data.get_team_by_id(team_id)
    
    async def get_leagues(self, country: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get available leagues from Football-Data.org."""
        return await self.football_data.get_leagues(country)
    
    async def search_fixture(
        self,
        home_team_name: str,
        away_team_name: str
    ) -> Optional[Dict[str, Any]]:
        """Search for a specific fixture."""
        fixture = await self.football_data.search_fixture(home_team_name, away_team_name)
        
        if not fixture:
            return None
        
        # Try to enrich with odds
        try:
            fixture_id = fixture["fixture"]["id"]
            odds = await self.get_odds(fixture_id)
            if odds:
                fixture["odds"] = odds
                logger.info(f"Enriched fixture with odds from OddsChecker")
        except Exception as e:
            logger.error(f"Error enriching fixture with odds: {e}")
        
        return fixture
    
    async def get_fixture_with_all_data(self, fixture_id: int) -> Optional[Dict[str, Any]]:
        """
        Get complete fixture data from all sources.
        
        This is a convenience method that combines:
        - Basic fixture info (Football-Data.org)
        - Live scores (SofaScore)
        - Statistics (FBref)
        - Odds (OddsChecker)
        """
        try:
            # Get base fixture
            fixture = await self.get_fixture_by_id(fixture_id)
            if not fixture:
                return None
            
            # Enrich with statistics
            stats = await self.get_statistics(fixture_id)
            if stats:
                fixture["statistics"] = stats
            
            # Enrich with odds
            odds = await self.get_odds(fixture_id)
            if odds:
                fixture["odds"] = odds
            
            logger.info(f"Retrieved complete fixture data for {fixture_id} from all sources")
            return fixture
            
        except Exception as e:
            logger.error(f"Error getting complete fixture data for {fixture_id}: {e}")
            return None
