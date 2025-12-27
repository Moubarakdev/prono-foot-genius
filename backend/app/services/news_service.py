import httpx
from datetime import datetime, timedelta
from typing import List, Dict
import logging

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class NewsService:
    """Service to fetch football news from external APIs (e.g., NewsAPI.org)."""
    
    def __init__(self):
        self.api_key = settings.news_api_key
        self.base_url = "https://newsapi.org/v2/everything"
    
    async def get_team_news(self, team_name: str, days_back: int = 3) -> List[str]:
        """Fetch recent news articles for a specific team."""
        if not self.api_key:
            logger.warning("News API key not configured. News integration disabled.")
            return []
            
        from_date = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        params = {
            "q": f'"{team_name}" AND (football OR soccer)',
            "from": from_date,
            "sortBy": "relevancy",
            "language": "fr",  # Priority to French news as per Visifoot context
            "apiKey": self.api_key
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                articles = data.get("articles", [])
                # Return summaries (title + description)
                return [
                    f"{a['title']}: {a['description']}" 
                    for a in articles[:5] 
                    if a.get('title') and a.get('description')
                ]
        except Exception as e:
            logger.error(f"Error fetching news for {team_name}: {e}")
            return []

    async def get_match_context_news(self, home_team: str, away_team: str) -> List[str]:
        """Get combined news for both teams involved in a match."""
        home_news = await self.get_team_news(home_team)
        away_news = await self.get_team_news(away_team)
        
        combined = []
        if home_news:
            combined.append(f"Actualités pour {home_team}:")
            combined.extend(home_news)
        if away_news:
            combined.append(f"Actualités pour {away_team}:")
            combined.extend(away_news)
            
        return combined

# Singleton instance
news_service = NewsService()
