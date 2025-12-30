from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class BaseFootballProvider(ABC):
    """Abstract base class for football data providers."""
    
    @abstractmethod
    async def get_fixtures(
        self,
        date: Optional[str] = None,
        league: Optional[int] = None,
        team: Optional[int] = None,
        next: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_fixture_by_id(self, fixture_id: int) -> Optional[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_statistics(self, fixture_id: int) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_head_to_head(
        self,
        team1_id: int,
        team2_id: int,
        last: int = 10
    ) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_team_statistics(
        self,
        team_id: int,
        league_id: int,
        season: Optional[int] = None
    ) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def get_odds(
        self,
        fixture_id: int,
        bookmaker: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_injuries(self, fixture_id: int) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_predictions(self, fixture_id: int) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def search_team(self, name: str) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_team_by_id(self, team_id: int) -> Optional[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_leagues(self, country: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def search_fixture(self, home_team_name: str, away_team_name: str) -> Optional[Dict[str, Any]]:
        """Search for an upcoming fixture between two teams by their names."""
        pass

class BaseAIProvider(ABC):
    """Abstract base class for AI analysis providers."""
    
    @abstractmethod
    async def analyze_match(
        self,
        home_team: str,
        away_team: str,
        league_name: str,
        match_date: str,
        team_stats: Dict[str, Any],
        h2h_data: List[Dict[str, Any]],
        injuries_data: List[Dict[str, Any]],
        odds_data: List[Dict[str, Any]],
        news_context: List[str] = [],
        user_context: Optional[str] = None
    ) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def analyze_coupon(self, matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def chat_analysis(
        self,
        analysis_summary: str,
        history: List[Any],
        user_question: str
    ) -> str:
        pass
