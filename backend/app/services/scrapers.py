"""
Web scrapers for football data sources.
"""
import asyncio
import httpx
import time
import random
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Any
from app.core.logger import get_logger
from datetime import datetime

logger = get_logger('services.scrapers')

# Liste de User-Agents pour rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

def get_random_headers() -> Dict[str, str]:
    """Retourne des headers aléatoires pour éviter le blocage."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }


class SofaScoreScraper:
    """Scraper for SofaScore.com to get live scores and match results."""
    
    BASE_URL = "https://www.sofascore.com"
    
    async def get_match_score(self, match_id: str) -> Optional[Dict[str, Any]]:
        """
        Get live score for a specific match.
        
        Args:
            match_id: SofaScore match ID
            
        Returns:
            Dict with score data: {
                "home_score": int,
                "away_score": int,
                "status": str,
                "minute": int,
                "period": str
            }
        """
        start_time = time.time()
        
        try:
            url = f"{self.BASE_URL}/api/v1/event/{match_id}"
            
            logger.debug(
                f"🔍 Scraping SofaScore match: {match_id}",
                extra={'extra_data': {'match_id': match_id, 'url': url}}
            )
            
            # Retry logic avec différents User-Agents
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        response = await client.get(url, headers=get_random_headers())
                        response.raise_for_status()
                        data = response.json()
                    
                    event = data.get("event", {})
                    result = {
                        "home_score": event.get("homeScore", {}).get("current", 0),
                        "away_score": event.get("awayScore", {}).get("current", 0),
                        "status": event.get("status", {}).get("type", "unknown"),
                        "minute": event.get("time", {}).get("currentPeriodStartTimestamp", 0),
                        "period": event.get("status", {}).get("description", "")
                    }
                    
                    duration_ms = (time.time() - start_time) * 1000
                    logger.log_external_api('SofaScore', f'match/{match_id}', 'success', duration_ms)
                    
                    return result
                    
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403 and attempt < max_retries - 1:
                        logger.warning(f"⚠️ SofaScore 403, retry {attempt + 1}/{max_retries}")
                        await asyncio.sleep(random.uniform(1, 3))  # Random delay
                        continue
                    raise
                
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"❌ SofaScore scraping error for match {match_id} ({duration_ms:.0f}ms): {e}",
                exc_info=True,
                extra={'extra_data': {
                    'match_id': match_id,
                    'duration_ms': duration_ms,
                    'error': str(e)
                }}
            )
            return None
    
    async def search_match(
        self, 
        home_team: str, 
        away_team: str, 
        date: Optional[str] = None
    ) -> Optional[str]:
        """
        Search for a match and return its SofaScore ID.
        
        Args:
            home_team: Home team name
            away_team: Away team name
            date: Match date (YYYY-MM-DD)
            
        Returns:
            Match ID as string or None
        """
        try:
            if not date:
                date = datetime.utcnow().strftime("%Y-%m-%d")
            
            url = f"{self.BASE_URL}/api/v1/sport/football/scheduled-events/{date}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    },
                    timeout=15.0
                )
                response.raise_for_status()
                data = response.json()
                
                events = data.get("events", [])
                for event in events:
                    home = event.get("homeTeam", {}).get("name", "").lower()
                    away = event.get("awayTeam", {}).get("name", "").lower()
                    
                    if home_team.lower() in home and away_team.lower() in away:
                        return str(event.get("id"))
                
                return None
                
        except Exception as e:
            logger.error(f"SofaScore search error for {home_team} vs {away_team}: {e}")
            return None


class OddsCheckerScraper:
    """Scraper for OddsChecker.com to get betting odds."""
    
    BASE_URL = "https://www.oddschecker.com"
    
    async def get_match_odds(
        self, 
        home_team: str, 
        away_team: str,
        league: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get betting odds for a specific match.
        
        Args:
            home_team: Home team name
            away_team: Away team name
            league: League name (e.g., "premier-league")
            
        Returns:
            Dict with odds data: {
                "home_win": float,
                "draw": float,
                "away_win": float,
                "bookmaker": str,
                "over_2_5": float,
                "under_2_5": float
            }
        """
        try:
            # Clean team names for URL
            home_clean = home_team.lower().replace(" ", "-")
            away_clean = away_team.lower().replace(" ", "-")
            
            # Construct URL
            if league:
                url = f"{self.BASE_URL}/football/{league}/{home_clean}-v-{away_clean}"
            else:
                url = f"{self.BASE_URL}/football/{home_clean}-v-{away_clean}"
            
            # Retry logic avec différents User-Agents
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        response = await client.get(
                            url,
                            headers=get_random_headers(),
                            follow_redirects=True
                        )
                        response.raise_for_status()
                        
                        soup = BeautifulSoup(response.text, "html.parser")
                        
                        # Extract odds from the page
                        odds_data = {
                            "home_win": None,
                            "draw": None,
                            "away_win": None,
                            "over_2_5": None,
                            "under_2_5": None,
                            "bookmaker": "average"
                        }
                        
                        # Find 1X2 odds
                        odds_rows = soup.find_all("tr", class_="diff-row")
                        if odds_rows and len(odds_rows) > 0:
                            first_row = odds_rows[0]
                            odds_cells = first_row.find_all("td", class_="bc")
                            
                            if len(odds_cells) >= 3:
                                try:
                                    odds_data["home_win"] = float(odds_cells[0].text.strip())
                                    odds_data["draw"] = float(odds_cells[1].text.strip())
                                    odds_data["away_win"] = float(odds_cells[2].text.strip())
                                except (ValueError, AttributeError):
                                    pass
                        
                        return odds_data if any(odds_data.values()) else None
                
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403 and attempt < max_retries - 1:
                        logger.warning(f"⚠️ OddsChecker 403, retry {attempt + 1}/{max_retries}")
                        await asyncio.sleep(random.uniform(1, 3))
                        continue
                    raise
                
        except Exception as e:
            logger.error(f"OddsChecker scraping error for {home_team} vs {away_team}: {e}")
            return None


class FBrefScraper:
    """Scraper for FBref.com to get detailed match statistics."""
    
    BASE_URL = "https://fbref.com"
    
    async def get_team_stats(
        self, 
        team_name: str,
        season: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get team statistics from FBref.
        
        Args:
            team_name: Team name
            season: Season (e.g., "2024-2025")
            
        Returns:
            Dict with team stats: {
                "goals_scored": int,
                "goals_conceded": int,
                "shots_per_game": float,
                "possession_pct": float,
                "clean_sheets": int,
                "form": str (last 5 results)
            }
        """
        try:
            # Search for team
            search_url = f"{self.BASE_URL}/search/search.fcgi"
            
            # Retry logic avec différents User-Agents
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        response = await client.get(
                            search_url,
                            params={"search": team_name},
                            headers=get_random_headers(),
                            follow_redirects=True
                        )
                        response.raise_for_status()
                        
                        soup = BeautifulSoup(response.text, "html.parser")
                        
                        # Find team link
                        team_link = soup.find("a", href=lambda x: x and "/squads/" in x)
                        if not team_link:
                            return None
                        
                        team_url = f"{self.BASE_URL}{team_link['href']}"
                        
                        # Get team page
                        team_response = await client.get(
                            team_url,
                            headers=get_random_headers(),
                            timeout=15.0,
                            follow_redirects=True
                        )
                        team_response.raise_for_status()
                        
                        team_soup = BeautifulSoup(team_response.text, "html.parser")
                        
                        # Extract statistics
                        stats = {
                            "goals_scored": 0,
                            "goals_conceded": 0,
                            "shots_per_game": 0.0,
                            "possession_pct": 0.0,
                            "clean_sheets": 0,
                            "form": "N/A"
                        }
                        
                        # Parse stats table
                        stats_table = team_soup.find("table", {"id": "stats_standard"})
                        if stats_table:
                            rows = stats_table.find_all("tr")
                            for row in rows:
                                cells = row.find_all(["th", "td"])
                                if len(cells) > 1:
                                    label = cells[0].text.strip().lower()
                                    try:
                                        if "goals" in label and "for" in label:
                                            stats["goals_scored"] = int(cells[1].text.strip())
                                        elif "goals" in label and "against" in label:
                                            stats["goals_conceded"] = int(cells[1].text.strip())
                                        elif "shots" in label:
                                            stats["shots_per_game"] = float(cells[1].text.strip())
                                    except (ValueError, IndexError):
                                        continue
                        
                        return stats
                
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403 and attempt < max_retries - 1:
                        logger.warning(f"⚠️ FBref 403, retry {attempt + 1}/{max_retries}")
                        await asyncio.sleep(random.uniform(1, 3))
                        continue
                    raise
                
        except Exception as e:
            logger.error(f"FBref scraping error for {team_name}: {e}")
            return None
    
    async def get_match_stats(
        self, 
        home_team: str,
        away_team: str,
        date: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get match statistics from FBref.
        
        Args:
            home_team: Home team name
            away_team: Away team name
            date: Match date
            
        Returns:
            Dict with match stats for both teams
        """
        try:
            # For now, aggregate team stats
            home_stats = await self.get_team_stats(home_team)
            away_stats = await self.get_team_stats(away_team)
            
            if not home_stats or not away_stats:
                return None
            
            return {
                "home": home_stats,
                "away": away_stats,
                "source": "fbref"
            }
            
        except Exception as e:
            logger.error(f"FBref match stats error for {home_team} vs {away_team}: {e}")
            return None
