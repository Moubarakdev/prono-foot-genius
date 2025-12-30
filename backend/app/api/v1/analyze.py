import asyncio
from datetime import datetime
from datetime import datetime
from typing import Annotated, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
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
from app.services.analysis import check_analysis_limit, calculate_value_bet, MatchAnalyzer
from app.providers import get_football_provider, get_ai_provider
from app.providers.base import BaseFootballProvider, BaseAIProvider

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# Dependencies for providers
FootballProvider = Annotated[BaseFootballProvider, Depends(get_football_provider)]
AIProvider = Annotated[BaseAIProvider, Depends(get_ai_provider)]


@router.post("/custom", response_model=MatchAnalysisResponse)
async def analyze_custom_match(
    request: CustomAnalysisRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    football_api: FootballProvider,
    ai_service: AIProvider,
    accept_language: Annotated[Optional[str], Header()] = None,
    lang: Annotated[Optional[str], Query()] = None
):
    """Analyze a custom matchup between two teams."""
    # Determine language: Query param > Header > Default 'fr'
    language = "fr"
    if lang:
        language = lang.lower()[:2]
    elif accept_language:
        language = accept_language.split(",")[0].lower()[:2]
    
    if language not in ["fr", "en", "de"]:
        language = "fr"
    # Check limit (handled by MatchAnalyzer)

    # 1. Get Team Details
    home_team = await football_api.get_team_by_id(request.home_team_id)
    away_team = await football_api.get_team_by_id(request.away_team_id)
    
    if not home_team or not away_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Une ou plusieurs équipes non trouvées."
        )

    # 2. Get H2H History
    h2h_data = await football_api.get_head_to_head(request.home_team_id, request.away_team_id, last=10)
    
    # 3. Check for UPCOMING fixture (Exact match)
    upcoming_fixture = await football_api.search_fixture(home_team["name"], away_team["name"])
    
    analyzer = MatchAnalyzer(football_api, ai_service, db)

    if upcoming_fixture:
        f_home_id = upcoming_fixture["teams"]["home"]["id"]
        f_away_id = upcoming_fixture["teams"]["away"]["id"]
        
        if (f_home_id == request.home_team_id and f_away_id == request.away_team_id) or \
           (f_home_id == request.away_team_id and f_away_id == request.home_team_id):
           
           # Use standard analysis
           analysis = await analyzer.analyze(upcoming_fixture, current_user, request.user_context)
           return analysis

    # 4. If no upcoming fixture found, perform Hypothetical Analysis
    analysis = await analyzer.analyze_custom(home_team, away_team, h2h_data, current_user, request.user_context, language=language)
    return analysis


@router.post("/match", response_model=MatchAnalysisResponse)
async def analyze_match(
    request: MatchAnalysisRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    football_api: FootballProvider,
    ai_service: AIProvider,
    accept_language: Annotated[Optional[str], Header()] = None,
    lang: Annotated[Optional[str], Query()] = None
):
    """Analyze a match using AI."""
    # Determine language
    language = "fr"
    if lang:
        language = lang.lower()[:2]
    elif accept_language:
        language = accept_language.split(",")[0].lower()[:2]
    
    if language not in ["fr", "en", "de"]:
        language = "fr"
    # Check limit (handled by MatchAnalyzer)
    
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
    
    analyzer = MatchAnalyzer(football_api, ai_service, db)
    analysis = await analyzer.analyze(fixture, current_user, request.user_context, language=language)
    return analysis


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
    analysis_id: str,
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
        # Debugging 404 more aggressively
        logger.warning(f"DEBUG 404: Analysis not found. ID: '{analysis_id}' (user: {current_user.id})")
        # Try finding it without the user filter to see if it's an ownership issue
        raw_res = await db.execute(select(MatchAnalysis).where(MatchAnalysis.id == analysis_id))
        raw_analysis = raw_res.scalar_one_or_none()
        if raw_analysis:
            logger.warning(f"DEBUG 404: Analysis {analysis_id} EXISTS but owner is {raw_analysis.user_id}")
        else:
            logger.warning(f"DEBUG 404: Analysis {analysis_id} DOES NOT EXIST in DB at all.")

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    logger.info(f"✅ Analysis {analysis_id} retrieved successfully for {current_user.email}")
    return analysis


@router.post("/{analysis_id}/chat", response_model=ChatMessageResponse)
async def chat_about_match(
    analysis_id: str,
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
    analysis_id: str,
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
