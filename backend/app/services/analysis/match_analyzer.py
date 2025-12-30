"""
Match analyzer service for orchestrating match analysis.

This module contains the business logic for analyzing football matches,
including limit checking, value bet calculation, and analysis orchestration.
"""
import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger
from app.models import User, MatchAnalysis
from app.providers.base import BaseFootballProvider, BaseAIProvider
from app.services import cache_service, CACHE_TTL
from app.services.analysis.computed_stats_service import computed_stats_service


async def check_analysis_limit(user: User, db: AsyncSession) -> None:
    """
    Check if user has reached their daily analysis limit.
    
    Args:
        user: The current user
        db: Database session
        
    Raises:
        HTTPException: If daily limit is reached
    """
    limit = user.analyses_limit
    
    # Unlimited for Pro/Lifetime
    if limit == -1:
        return
    
    # Reset counter if new day
    today = datetime.utcnow().date()
    if user.daily_analyses_reset_at:
        reset_date = user.daily_analyses_reset_at.date()
        if reset_date < today:
            user.daily_analyses_used = 0
            user.daily_analyses_reset_at = datetime.utcnow()
            await db.commit()
    else:
        user.daily_analyses_reset_at = datetime.utcnow()
        await db.commit()
    
    if user.daily_analyses_used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily analysis limit reached ({limit} per day). Upgrade your plan for more analyses."
        )


def calculate_value_bet(probs: Dict[str, float], odds_data: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Calculate the best value bet based on AI probabilities and market odds.
    
    A value bet is identified when the AI's probability estimate is higher
    than the implied probability from the odds (with a 5% threshold).
    
    Args:
        probs: AI probability predictions {"home": 0.x, "draw": 0.x, "away": 0.x}
        odds_data: Raw odds data from API
        
    Returns:
        Best value bet info or None if no value found
    """
    if not odds_data:
        return None
        
    try:
        # Extract Match Winner odds
        market_odds = {}
        bookmakers = odds_data[0].get("bookmakers", [])
        if not bookmakers: 
            return None
        
        # Use first available bookmaker (usually the most popular/complete)
        bets = bookmakers[0].get("bets", [])
        for bet in bets:
            if bet.get("name") == "Match Winner":
                for val in bet.get("values", []):
                    label = val.get("value")
                    odd_str = val.get("odd")
                    # Validate odd is a valid number > 1.0
                    try:
                        odd = float(odd_str)
                        if odd <= 0 or odd != odd:  # Check for negative, zero, or NaN
                            continue
                    except (ValueError, TypeError):
                        continue
                    
                    if label == "Home": market_odds["1"] = odd
                    elif label == "Draw": market_odds["X"] = odd
                    elif label == "Away": market_odds["2"] = odd
        
        if not market_odds: 
            return None
        
        # Calculate EV for each outcome
        # value = (Prob * Odd) - 1
        values = []
        mapping = {"1": "home", "X": "draw", "2": "away"}
        
        for outcome, odd in market_odds.items():
            prob = probs.get(mapping[outcome], 0)
            value = (prob * odd) - 1
            values.append({
                "outcome": outcome,
                "ai_probability": prob,
                "market_odds": odd,
                "value_percentage": round(value * 100, 2),
                "is_value": value > 0.05  # Threshold 5% for calling it a "Value"
            })
            
        if not values:
            return None

        # Return the one with highest value
        values.sort(key=lambda x: x["value_percentage"], reverse=True)
        return values[0]
        
    except Exception as e:
        logger.error(f"Error calculating value bet: {e}")
        return None


class MatchAnalyzer:
    """
    Orchestrates match analysis by coordinating data fetching and AI analysis.
    
    This class handles:
    - Fetching fixture data
    - Parallel data collection (H2H, injuries, odds, stats, news)
    - AI analysis
    - Database persistence
    """
    
    def __init__(
        self,
        football_provider: BaseFootballProvider,
        ai_provider: BaseAIProvider,
        db: AsyncSession
    ):
        """
        Initialize the analyzer with providers and database session.
        
        Args:
            football_provider: Provider for football data
            ai_provider: Provider for AI analysis
            db: Async database session
        """
        self.football_api = football_provider
        self.ai_service = ai_provider
        self.db = db
    
    async def _fetch_fixture_data(
        self,
        fixture_id: int,
        home_team_id: int,
        away_team_id: int,
        league_id: int,
        home_team_name: str,
        away_team_name: str
    ) -> tuple:
        """
        Fetch all required data for analysis in parallel.
        
        Returns:
            Tuple of (h2h_data, injuries_data, odds_data, team_stats, news_context)
        """
        # Define cache keys
        h2h_key = f"h2h:{home_team_id}:{away_team_id}"
        injuries_key = f"injuries:{fixture_id}"
        odds_key = f"odds:{fixture_id}"
        stats_key = f"team_stats:{home_team_id}:{league_id}"
        news_key = f"news:{home_team_id}:{away_team_id}"
        recent_matches_home_key = f"recent_matches:{home_team_id}"
        recent_matches_away_key = f"recent_matches:{away_team_id}"
        
        # Helper functions for parallel data fetching with cache
        async def get_h2h():
            cached = await cache_service.get(h2h_key)
            if cached:
                return cached
            data = await self.football_api.get_head_to_head(home_team_id, away_team_id)
            await cache_service.set(h2h_key, data, CACHE_TTL["h2h"])
            return data
        
        async def get_injuries():
            cached = await cache_service.get(injuries_key)
            if cached:
                return cached
            data = await self.football_api.get_injuries(fixture_id)
            await cache_service.set(injuries_key, data, CACHE_TTL["injuries"])
            return data
        
        async def get_odds():
            cached = await cache_service.get(odds_key)
            if cached:
                return cached
            data = await self.football_api.get_odds(fixture_id)
            await cache_service.set(odds_key, data, CACHE_TTL["odds"])
            return data
        
        async def get_stats():
            cached = await cache_service.get(stats_key)
            if cached:
                return cached
            data = await self.football_api.get_team_statistics(home_team_id, league_id)
            await cache_service.set(stats_key, data, CACHE_TTL["team_stats"])
            return data
        
        async def get_news():
            cached = await cache_service.get(news_key)
            if cached:
                return cached
            try:
                from app.services.news_service import news_service
                data = await news_service.get_match_context_news(home_team_name, away_team_name)
                await cache_service.set(news_key, data, 3600)  # 1h cache
                return data
            except Exception as e:
                logger.error(f"Error fetching news for analysis: {e}")
                return []

        async def get_recent_matches(team_id: int, league_id: int, cache_key: str):
            cached = await cache_service.get(cache_key)
            if cached:
                return cached
            # Fetch last 20 matches to have enough data for HT/FT analysis
            data = await self.football_api.get_fixtures(team=team_id, league=league_id)
            await cache_service.set(cache_key, data, CACHE_TTL.get("fixtures", 3600))
            return data
        
        # Fetch all data in parallel for better performance
        return await asyncio.gather(
            get_odds(),
            get_stats(),
            get_news(),
            get_recent_matches(home_team_id, league_id, recent_matches_home_key),
            get_recent_matches(away_team_id, league_id, recent_matches_away_key)
        )
    
    def _determine_predicted_outcome(self, probs: Dict[str, float]) -> str:
        """Determine the predicted outcome from probabilities."""
        if probs["home"] > probs["draw"] and probs["home"] > probs["away"]:
            return "1"
        elif probs["away"] > probs["draw"]:
            return "2"
        else:
            return "X"
    
    async def analyze_custom(
        self,
        home_team: Dict[str, Any],
        away_team: Dict[str, Any],
        h2h_data: List[Dict[str, Any]],
        user: User,
        user_context: Optional[str] = None,
        language: str = "fr"
    ) -> MatchAnalysis:
        """
        Perform analysis for a custom/hypothetical matchup.
        
        Args:
            home_team: Home team details
            away_team: Away team details
            h2h_data: Head-to-head history
            user: Current user
            
        Returns:
            Saved MatchAnalysis object
        """
        await check_analysis_limit(user, self.db)
        
        home_name = home_team["name"]
        away_name = away_team["name"]
        
        logger.info(f"Performing custom analysis for {home_name} vs {away_name} for user {user.email}")
        
        # AI Analysis with available data
        ai_result = await self.ai_service.analyze_match(
            home_team=home_name,
            away_team=away_name,
            league_name="Custom Matchup (Hypothetical)",
            match_date=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            team_stats={},  # No specific league context
            h2h_data=h2h_data,
            injuries_data=[],
            odds_data=[],
            news_context=[],
            user_context=user_context,
            language=language
        )
        
        # Extract predictions
        probs = ai_result["probabilities"]
        predicted_outcome = self._determine_predicted_outcome(probs)
            
        # Create Analysis record
        # Use 0 as virtual fixture_id for custom analyses
        analysis = MatchAnalysis(
            user_id=user.id,
            fixture_id=0, 
            home_team=home_name,
            away_team=away_name,
            home_team_id=home_team["id"],
            away_team_id=away_team["id"],
            home_team_logo=home_team.get("logo"),
            away_team_logo=away_team.get("logo"),
            league_id=0,
            league_name="Custom Analysis",
            match_date=datetime.utcnow(),
            prediction_home=probs["home"],
            prediction_draw=probs["draw"],
            prediction_away=probs["away"],
            predicted_outcome=predicted_outcome,
            confidence_score=ai_result["confidence"],
            summary=ai_result["summary"],
            key_factors=ai_result["key_factors"],
            scenarios=ai_result["scenarios"],
            statistics_snapshot={},
            news_context=[],
            created_at=datetime.utcnow()
        )
        
        self.db.add(analysis)
        
        # Increment usage
        user.daily_analyses_used += 1
        
        try:
            await self.db.commit()
            await self.db.refresh(analysis)
        except Exception as e:
            logger.error(f"Database error saving custom analysis: {e}")
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de l'enregistrement de l'analyse personnalisée."
            )
            
        return analysis

    async def analyze(
        self,
        fixture: Dict[str, Any],
        user: User,
        user_context: Optional[str] = None,
        language: str = "fr"
    ) -> MatchAnalysis:
        """
        Perform full analysis on a fixture.
        
        Args:
            fixture: Fixture data from API
            user: Current user
            
        Returns:
            Saved MatchAnalysis object
        """
        await check_analysis_limit(user, self.db)
        
        # Extract fixture info
        fixture_id = fixture["fixture"]["id"]
        home_team = fixture["teams"]["home"]["name"]
        away_team = fixture["teams"]["away"]["name"]
        home_team_id = fixture["teams"]["home"]["id"]
        away_team_id = fixture["teams"]["away"]["id"]
        league_id = fixture["league"]["id"]
        league_name = fixture["league"]["name"]
        
        try:
            match_date_str = fixture["fixture"]["date"]
            match_date = datetime.fromisoformat(match_date_str.replace("Z", "+00:00"))
        except Exception as e:
            logger.error(f"Error parsing match date {match_date_str}: {e}")
            match_date = datetime.utcnow()
        
        logger.info(f"Performing analysis for {home_team} vs {away_team} (fixture_id: {fixture_id})")
        
        # Fetch all required data
        h2h_data, injuries_data, odds_data, team_stats, news_context, recent_home, recent_away = await self._fetch_fixture_data(
            fixture_id, home_team_id, away_team_id, league_id, home_team, away_team
        )
        
        # Compute Smart Stats
        smart_stats_home = computed_stats_service.compute_team_stats(recent_home, home_team_id)
        smart_stats_away = computed_stats_service.compute_team_stats(recent_away, away_team_id)
        
        # Aggregate stats for AI
        combined_stats = {
            "home": smart_stats_home,
            "away": smart_stats_away,
            "raw_api_stats": team_stats
        }
        
        # AI Analysis
        ai_result = await self.ai_service.analyze_match(
            home_team=home_team,
            away_team=away_team,
            league_name=league_name,
            match_date=fixture["fixture"]["date"],
            team_stats=combined_stats,
            h2h_data=h2h_data,
            injuries_data=injuries_data,
            odds_data=odds_data,
            news_context=news_context,
            user_context=user_context,
            language=language
        )
        
        # Determine predicted outcome
        probs = ai_result["probabilities"]
        predicted_outcome = self._determine_predicted_outcome(probs)
        
        # Calculate Value Bet
        value_bet = calculate_value_bet(probs, odds_data)
        
        # Save analysis
        analysis = MatchAnalysis(
            user_id=user.id,
            fixture_id=fixture_id,
            home_team=home_team,
            away_team=away_team,
            home_team_logo=fixture["teams"]["home"]["logo"],
            away_team_logo=fixture["teams"]["away"]["logo"],
            home_team_id=home_team_id,
            away_team_id=away_team_id,
            league_id=league_id,
            league_name=league_name,
            match_date=match_date,
            prediction_home=probs["home"],
            prediction_draw=probs["draw"],
            prediction_away=probs["away"],
            predicted_outcome=predicted_outcome,
            confidence_score=ai_result["confidence"],
            summary=ai_result["summary"],
            key_factors=ai_result["key_factors"],
            scenarios=ai_result["scenarios"],
            statistics_snapshot=team_stats if isinstance(team_stats, dict) else {},
            news_context=news_context,
            value_bet=value_bet,
            created_at=datetime.utcnow()
        )
        
        self.db.add(analysis)
        
        # Increment usage
        user.daily_analyses_used += 1
        
        try:
            await self.db.commit()
            await self.db.refresh(analysis)
        except Exception as e:
            logger.error(f"Database error saving analysis: {e}")
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de l'enregistrement de l'analyse."
            )
        
        logger.info(f"Analysis {analysis.id} saved for user {user.email}")
        
        return analysis
