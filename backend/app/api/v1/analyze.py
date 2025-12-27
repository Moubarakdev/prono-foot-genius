import asyncio
from datetime import datetime
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger
from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.models import User, MatchAnalysis, ChatMessage, SubscriptionType
from app.schemas import (
    MatchAnalysisRequest,
    CustomAnalysisRequest,
    MatchAnalysisResponse,
    MatchAnalysisListResponse,
    PredictionResult,
    ScenarioResult,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatHistoryResponse
)
from app.services import cache_service, CACHE_TTL
from app.providers import get_football_provider, get_ai_provider
from app.providers.base import BaseFootballProvider, BaseAIProvider

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# Dependencies for providers
FootballProvider = Annotated[BaseFootballProvider, Depends(get_football_provider)]
AIProvider = Annotated[BaseAIProvider, Depends(get_ai_provider)]


async def check_analysis_limit(user: User, db: AsyncSession) -> None:
    """Check if user has reached their daily analysis limit."""
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


def calculate_value_bet(probs: dict, odds_data: list) -> dict | None:
    """Calculate the best value bet based on AI probabilities and market odds."""
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
                "is_value": value > 0.05 # Threshold 5% for calling it a "Value"
            })
            
        if not values:
            return None

        # Return the one with highest value
        values.sort(key=lambda x: x["value_percentage"], reverse=True)
        return values[0]
        
    except Exception as e:
        logger.error(f"Error calculating value bet: {e}")
        return None


async def _perform_hypothetical_analysis(
    home_team: dict,
    away_team: dict,
    h2h: list[dict],
    user: User,
    db: AsyncSession,
    ai_provider: BaseAIProvider
) -> MatchAnalysisResponse:
    """Perform analysis for a custom/hypothetical matchup."""
    home_name = home_team["name"]
    away_name = away_team["name"]
    
    # Perform AI analysis with available data
    ai_result = await ai_provider.analyze_match(
        home_team=home_name,
        away_team=away_name,
        league_name="Custom Matchup (Hypothetical)",
        match_date=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        team_stats={},  # No specific league context
        h2h_data=h2h,
        injuries_data=[],
        odds_data=[],
        news_context=[]
    )
    
    # Extract predictions
    probs = ai_result["probabilities"]
    if probs["home"] > probs["draw"] and probs["home"] > probs["away"]:
        predicted_outcome = "1"
    elif probs["away"] > probs["draw"]:
        predicted_outcome = "2"
    else:
        predicted_outcome = "X"
        
    # Create Analysis record
    # Use 0 as virtual fixture_id for custom analyses
    analysis = MatchAnalysis(
        user_id=user.id,
        fixture_id=0, 
        home_team=home_name,
        away_team=away_name,
        home_team_id=home_team["id"],
        away_team_id=away_team["id"],
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
        created_at=datetime.utcnow()
    )
    
    db.add(analysis)
    
    # Increment usage
    user.daily_analyses_used += 1
    
    await db.commit()
    await db.refresh(analysis)
    
    return MatchAnalysisResponse(
        id=analysis.id,
        fixture_id=analysis.fixture_id,
        home_team=analysis.home_team,
        away_team=analysis.away_team,
        league_name=analysis.league_name,
        match_date=analysis.match_date,
        predictions=PredictionResult(
            home=analysis.prediction_home,
            draw=analysis.prediction_draw,
            away=analysis.prediction_away
        ),
        predicted_outcome=analysis.predicted_outcome,
        confidence_score=analysis.confidence_score,
        summary=analysis.summary,
        key_factors=analysis.key_factors,
        scenarios=[ScenarioResult(**s) for s in analysis.scenarios],
        actual_result=analysis.actual_result,
        was_correct=analysis.was_correct,
        created_at=analysis.created_at
    )


@router.post("/custom", response_model=MatchAnalysisResponse)
async def analyze_custom_match(
    request: CustomAnalysisRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    football_api: FootballProvider,
    ai_service: AIProvider
):
    """Analyze a custom matchup between two teams."""
    # Check limit
    await check_analysis_limit(current_user, db)

    # 1. Get Team Details
    home_team = await football_api.get_team_by_id(request.home_team_id)
    away_team = await football_api.get_team_by_id(request.away_team_id)
    
    if not home_team or not away_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more teams not found."
        )

    # 2. Get H2H History
    h2h_data = await football_api.get_head_to_head(request.home_team_id, request.away_team_id, last=10)
    
    # 3. Check for UPCOMING fixture (Exact match)
    # Search specifically for upcoming match between these team IDs
    # Since search_fixture uses names, let's use search_fixture but be careful
    upcoming_fixture = await football_api.search_fixture(home_team["name"], away_team["name"])
    
    if upcoming_fixture:
        # Check if IDs match to be sure
        f_home_id = upcoming_fixture["teams"]["home"]["id"]
        f_away_id = upcoming_fixture["teams"]["away"]["id"]
        
        if (f_home_id == request.home_team_id and f_away_id == request.away_team_id) or \
           (f_home_id == request.away_team_id and f_away_id == request.home_team_id):
           
           # Use standard analysis!
           # We must NOT double-count usage because analyze_match calls check_analysis_limit
           # BUT analyze_match is a function here if called directly? 
           # No, analyze_match logic is inside the route function.
           # To reuse code properly, we should extract logic or call the function.
           # Calling the route function directly is tricky with dependencies.
           # Better to return failure or redirect? No, explicit call.
           
           # Re-using logic by calling the endpoint function logic directly?
           # Let's just create a MatchAnalysisRequest and call analyze_match
           # Note: analyze_match takes dependencies. We can pass them.
           
           match_req = MatchAnalysisRequest(fixture_id=upcoming_fixture["fixture"]["id"])
           # Check limit was already done above. analyze_match will check it again.
           # This means double counting?
           # Yes. 
           # Solution: Don't call check_analysis_limit here if we redirect?
           # Or just implement custom logic cleanly.
           
           # Let's skip the limit check in THIS function if we redirect?
           # No, analyze_match checks it. So we should NOT check it here if we redirect.
           # But we don't know if we redirect yet.
           
           # Hack: revert usage limit incremement if analyze_match increments it? 
           # Or better: analyze_match checks limit but we can pass a flag? No.
           
           # Let's manually do what analyze_match does.
           # Or better: Pass on the call.
           # The user has quota. Checking twice is fine as long as we don't increment twice (which analyze_match does).
           # Both increment!
           # So if I call analyze_match, it will increment. I should NOT increment here.
           # The check `check_analysis_limit` verifies/increments?
           # `check_analysis_limit` CHECKS.
           # `current_user.daily_analyses_used += 1` is done at the end of analyze_match.
           
           # So: check_analysis_limit here is just a check. It doesn't write.
           # BUT `check_analysis_limit` DOES reset the counter if date changed. That performs a write!
           # That's fine.
           
           return await analyze_match(match_req, current_user, db, football_api, ai_service)

    # 4. If no upcoming fixture found, perform Hypothetical Analysis
    return await _perform_hypothetical_analysis(home_team, away_team, h2h_data, current_user, db, ai_service)


@router.post("/match", response_model=MatchAnalysisResponse)
async def analyze_match(
    request: MatchAnalysisRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    football_api: FootballProvider,
    ai_service: AIProvider
):
    """Analyze a match using AI."""
    # Check limit
    await check_analysis_limit(current_user, db)
    
    # Get fixture data
    fixture = None
    
    if request.fixture_id:
        # Get by fixture ID
        cache_key = f"fixture:{request.fixture_id}"
        fixture = await cache_service.get(cache_key)
        
        if not fixture:
            logger.info(f"Fetching fixture {request.fixture_id} from API for analysis by {current_user.email}")
            fixture = await football_api.get_fixture_by_id(request.fixture_id)
            if fixture:
                await cache_service.set(cache_key, fixture, CACHE_TTL["fixtures"])
    else:
        # Search by team names
        logger.info(f"Searching for fixture {request.home_team} vs {request.away_team} for analysis by {current_user.email}")
        fixture = await football_api.search_fixture(
            request.home_team,
            request.away_team
        )
    
    if not fixture:
        logger.warning(f"Analysis failed: Match not found for {request}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match non trouvé. Veuillez vérifier les noms des équipes ou l'ID du match."
        )
    
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
        # Handle various date formats if necessary
        match_date = datetime.fromisoformat(match_date_str.replace("Z", "+00:00"))
    except Exception as e:
        logger.error(f"Error parsing match date {match_date_str}: {e}")
        match_date = datetime.utcnow()
    
    logger.info(f"Performing analysis for {home_team} vs {away_team} (fixture_id: {fixture_id})")
    
    # Define cache keys
    h2h_key = f"h2h:{home_team_id}:{away_team_id}"
    injuries_key = f"injuries:{fixture_id}"
    odds_key = f"odds:{fixture_id}"
    stats_key = f"team_stats:{home_team_id}:{league_id}"
    news_key = f"news:{home_team_id}:{away_team_id}"
    
    # Helper functions for parallel data fetching with cache
    async def get_h2h():
        cached = await cache_service.get(h2h_key)
        if cached:
            return cached
        data = await football_api.get_head_to_head(home_team_id, away_team_id)
        await cache_service.set(h2h_key, data, CACHE_TTL["h2h"])
        return data
    
    async def get_injuries():
        cached = await cache_service.get(injuries_key)
        if cached:
            return cached
        data = await football_api.get_injuries(fixture_id)
        await cache_service.set(injuries_key, data, CACHE_TTL["injuries"])
        return data
    
    async def get_odds():
        cached = await cache_service.get(odds_key)
        if cached:
            return cached
        data = await football_api.get_odds(fixture_id)
        await cache_service.set(odds_key, data, CACHE_TTL["odds"])
        return data
    
    async def get_stats():
        cached = await cache_service.get(stats_key)
        if cached:
            return cached
        data = await football_api.get_team_statistics(home_team_id, league_id)
        await cache_service.set(stats_key, data, CACHE_TTL["team_stats"])
        return data
    
    async def get_news():
        cached = await cache_service.get(news_key)
        if cached:
            return cached
        try:
            from app.services.news_service import news_service
            data = await news_service.get_match_context_news(home_team, away_team)
            await cache_service.set(news_key, data, 3600)  # 1h cache
            return data
        except Exception as e:
            logger.error(f"Error fetching news for analysis: {e}")
            return []
    
    # Fetch all data in parallel for better performance
    h2h_data, injuries_data, odds_data, team_stats, news_context = await asyncio.gather(
        get_h2h(),
        get_injuries(),
        get_odds(),
        get_stats(),
        get_news()
    )
    
    # AI Analysis
    ai_result = await ai_service.analyze_match(
        home_team=fixture["teams"]["home"]["name"],
        away_team=fixture["teams"]["away"]["name"],
        league_name=fixture["league"]["name"],
        match_date=fixture["fixture"]["date"],
        team_stats=team_stats,
        h2h_data=h2h_data,
        injuries_data=injuries_data,
        odds_data=odds_data,
        news_context=news_context
    )
    
    # Determine predicted outcome
    probs = ai_result["probabilities"]
    if probs["home"] > probs["draw"] and probs["home"] > probs["away"]:
        predicted_outcome = "1"
    elif probs["away"] > probs["draw"]:
        predicted_outcome = "2"
    else:
        predicted_outcome = "X"
    
    # Calculate Value Bet
    value_bet = calculate_value_bet(probs, odds_data)
    
    # Save analysis
    analysis = MatchAnalysis(
        user_id=current_user.id,
        fixture_id=fixture_id,
        home_team=home_team,
        away_team=away_team,
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
        value_bet=value_bet,
        created_at=datetime.utcnow()
    )
    
    db.add(analysis)
    
    # Increment usage
    current_user.daily_analyses_used += 1
    
    try:
        await db.commit()
        await db.refresh(analysis)
    except Exception as e:
        logger.error(f"Database error saving analysis: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'enregistrement de l'analyse."
        )
    
    logger.info(f"Analysis {analysis.id} saved for user {current_user.email}")
    
    # Build response
    return MatchAnalysisResponse(
        id=analysis.id,
        fixture_id=analysis.fixture_id,
        home_team=analysis.home_team,
        away_team=analysis.away_team,
        league_name=analysis.league_name,
        match_date=analysis.match_date,
        predictions=PredictionResult(
            home=analysis.prediction_home,
            draw=analysis.prediction_draw,
            away=analysis.prediction_away
        ),
        predicted_outcome=analysis.predicted_outcome,
        confidence_score=analysis.confidence_score,
        summary=analysis.summary,
        key_factors=analysis.key_factors,
        scenarios=[ScenarioResult(**s) for s in analysis.scenarios],
        actual_result=analysis.actual_result,
        was_correct=analysis.was_correct,
        created_at=analysis.created_at
    )


@router.get("/history", response_model=list[MatchAnalysisListResponse])
async def get_analysis_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
    offset: int = 0
):
    """Get user's analysis history."""
    result = await db.execute(
        select(MatchAnalysis)
        .where(MatchAnalysis.user_id == current_user.id)
        .order_by(MatchAnalysis.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    analyses = result.scalars().all()
    
    return [
        MatchAnalysisListResponse(
            id=a.id,
            home_team=a.home_team,
            away_team=a.away_team,
            league_name=a.league_name,
            match_date=a.match_date,
            predicted_outcome=a.predicted_outcome,
            confidence_score=a.confidence_score,
            was_correct=a.was_correct,
            created_at=a.created_at
        )
        for a in analyses
    ]


@router.get("/{analysis_id}", response_model=MatchAnalysisResponse)
async def get_analysis(
    analysis_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get a specific analysis."""
    logger.info(
        f"📋 Fetching analysis {analysis_id} for user {current_user.email}",
        extra={'extra_data': {
            'analysis_id': str(analysis_id),
            'user_id': str(current_user.id)
        }}
    )
    
    result = await db.execute(
        select(MatchAnalysis)
        .where(
            MatchAnalysis.id == str(analysis_id),
            MatchAnalysis.user_id == current_user.id
        )
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        logger.warning(
            f"❌ Analysis {analysis_id} not found or access denied",
            extra={'extra_data': {
                'analysis_id': str(analysis_id),
                'user_id': str(current_user.id)
            }}
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    logger.info(
        f"✅ Analysis {analysis_id} retrieved successfully",
        extra={'extra_data': {'analysis_id': str(analysis_id)}}
    )
    
    return MatchAnalysisResponse(
        id=analysis.id,
        fixture_id=analysis.fixture_id,
        home_team=analysis.home_team,
        away_team=analysis.away_team,
        league_name=analysis.league_name,
        match_date=analysis.match_date,
        predictions=PredictionResult(
            home=analysis.prediction_home,
            draw=analysis.prediction_draw,
            away=analysis.prediction_away
        ),
        predicted_outcome=analysis.predicted_outcome,
        confidence_score=analysis.confidence_score,
        summary=analysis.summary,
        key_factors=analysis.key_factors,
        scenarios=[ScenarioResult(**s) for s in analysis.scenarios],
        actual_result=analysis.actual_result,
        was_correct=analysis.was_correct,
        created_at=analysis.created_at
    )


@router.post("/{analysis_id}/chat", response_model=ChatMessageResponse)
async def chat_about_match(
    analysis_id: uuid.UUID,
    chat_req: ChatMessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    ai_service: AIProvider
):
    """Ask a follow-up question about a match analysis (Pro/Lifetime only)."""
    
    # Check subscription (Visifoot paywall)
    if current_user.subscription not in [SubscriptionType.PRO.value, SubscriptionType.LIFETIME.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Le Chat IA est réservé aux abonnés Pro et Lifetime."
        )
        
    # Get the analysis
    result = await db.execute(
        select(MatchAnalysis).where(
            MatchAnalysis.id == analysis_id,
            MatchAnalysis.user_id == current_user.id
        )
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Analyse non trouvée."
        )
        
    # Get chat history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.analysis_id == analysis_id)
        .order_by(ChatMessage.created_at.asc())
    )
    history = history_result.scalars().all()
    
    # Call AI
    ai_response = await ai_service.chat_analysis(
        analysis_summary=analysis.summary,
        history=history,
        user_question=chat_req.content
    )
    
    # Save user message
    user_msg = ChatMessage(
        analysis_id=analysis_id,
        user_id=current_user.id,
        role="user",
        content=chat_req.content
    )
    db.add(user_msg)
    
    # Save assistant message
    assistant_msg = ChatMessage(
        analysis_id=analysis_id,
        user_id=current_user.id,
        role="assistant",
        content=ai_response
    )
    db.add(assistant_msg)
    
    await db.commit()
    await db.refresh(assistant_msg)
    
    return assistant_msg


@router.get("/{analysis_id}/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    analysis_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get the chat history for a specific analysis."""
    # Check if analysis belongs to user
    result = await db.execute(
        select(MatchAnalysis).where(
            MatchAnalysis.id == analysis_id,
            MatchAnalysis.user_id == current_user.id
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Analyse non trouvée."
        )
        
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.analysis_id == analysis_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = history_result.scalars().all()
    
    return ChatHistoryResponse(
        analysis_id=analysis_id,
        messages=messages
    )
