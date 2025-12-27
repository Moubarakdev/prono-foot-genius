from datetime import datetime
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.coupon import Coupon, CouponSelection, CouponType, CouponStatus, RiskLevel
from app.schemas.coupon import (
    CouponCreate,
    CouponResponse,
    CouponListResponse,
    SelectionResponse
)
from app.providers import get_ai_provider
from app.providers.base import BaseAIProvider
from app.core.logger import get_logger

logger = get_logger("api.coupons")
router = APIRouter(prefix="/coupons", tags=["Coupons"])

AIProvider = Annotated[BaseAIProvider, Depends(get_ai_provider)]


def calculate_risk_level(probability: float, num_selections: int) -> str:
    """Calculate risk level based on probability and selections count."""
    if probability > 0.5 and num_selections <= 3:
        return RiskLevel.LOW.value
    elif probability > 0.3 and num_selections <= 5:
        return RiskLevel.MEDIUM.value
    elif probability > 0.1:
        return RiskLevel.HIGH.value
    return RiskLevel.EXTREME.value


@router.post("/create", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon_data: CouponCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    ai_service: AIProvider
):
    """Create and analyze a new coupon."""
    # Calculate total odds
    total_odds = 1.0
    for selection in coupon_data.selections:
        # Ensure odds is valid (already validated by Pydantic, but extra safety)
        if not selection.odds or selection.odds <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid odds value for {selection.home_team} vs {selection.away_team}"
            )
        total_odds *= selection.odds
    
    # Validate final total_odds
    if not total_odds or total_odds <= 0 or total_odds != total_odds:  # Check for NaN
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid total odds calculation"
        )
    
    # Calculate probabilities for each selection
    selections = []
    combined_probability = 1.0
    weak_points = []
    
    for i, sel in enumerate(coupon_data.selections):
        implied_prob = 1 / sel.odds
        
        # AI probability estimation (simplified - could use full analysis)
        ai_prob = implied_prob * 1.1  # Slight adjustment
        ai_prob = min(ai_prob, 0.95)  # Cap at 95%
        
        edge = ai_prob - implied_prob
        combined_probability *= ai_prob
        
        # Identify weak points (low probability selections)
        if ai_prob < 0.45:
            weak_points.append(f"{sel.home_team} vs {sel.away_team}: {sel.selection_type}")
        
        # Create CouponSelection for each match
        selection = CouponSelection(
            fixture_id=sel.fixture_id,
            home_team=sel.home_team,
            away_team=sel.away_team,
            match_date=sel.match_date,
            selection_type=sel.selection_type,
            odds=sel.odds,
            implied_probability=implied_prob,
            ai_probability=ai_prob,
            edge=edge
        )
        selections.append(selection)
    
    # Store weak points after loop completes
    coupon_base_weak_points = weak_points
    

    # Determine risk level from AI if possible, otherwise use fallback logic
    # AI PROBABILITY ENRICHMENT
    matches_for_ai = [
        {
            "home_team": s.home_team,
            "away_team": s.away_team,
            "selection_type": s.selection_type,
            "odds": s.odds
        }
        for s in coupon_data.selections
    ]
    
    ai_coupon_analysis = await ai_service.analyze_coupon(matches_for_ai)
    
    # Update combined probability if AI provides it
    if "overall_probability" in ai_coupon_analysis:
        combined_probability = ai_coupon_analysis["overall_probability"]
    
    # Determine risk level
    risk_level = calculate_risk_level(combined_probability, len(selections))
    if "risk_score" in ai_coupon_analysis:
        # Map AI risk score (0-1) to our risk levels
        if ai_coupon_analysis["risk_score"] < 0.3:
            risk_level = RiskLevel.LOW.value
        elif ai_coupon_analysis["risk_score"] < 0.6:
            risk_level = RiskLevel.MEDIUM.value
        elif ai_coupon_analysis["risk_score"] < 0.85:
            risk_level = RiskLevel.HIGH.value
        else:
            risk_level = RiskLevel.EXTREME.value

    # Generate AI recommendation
    rec = ai_coupon_analysis.get("recommendation", "Coupon analysé par IA.")
    
    # Create coupon
    coupon = Coupon(
        user_id=current_user.id,
        coupon_type=CouponType.USER_CREATED.value,
        total_odds=round(total_odds, 2),
        success_probability=round(combined_probability, 4),
        risk_level=risk_level,
        ai_recommendation=rec,
        weak_points=coupon_base_weak_points[:3],  # Core weak points
        ai_analysis=ai_coupon_analysis,
        created_at=datetime.utcnow()
    )
    
    # Add selections
    for selection in selections:
        selection.coupon = coupon
    coupon.selections = selections
    
    db.add(coupon)
    await db.commit()
    
    # Refresh with eager loading of selections to avoid lazy loading issues
    await db.refresh(coupon, attribute_names=["selections"])
    
    return CouponResponse(
        id=coupon.id,
        user_id=coupon.user_id,
        coupon_type=coupon.coupon_type,
        total_odds=coupon.total_odds,
        stake=coupon.stake,
        potential_win=coupon.potential_win,
        success_probability=coupon.success_probability,
        risk_level=coupon.risk_level,
        ai_recommendation=coupon.ai_recommendation,
        weak_points=coupon.weak_points,
        ai_analysis=coupon.ai_analysis,
        status=coupon.status,
        matches_won=coupon.matches_won,
        matches_lost=coupon.matches_lost,
        selections=[
            SelectionResponse(
                id=s.id,
                fixture_id=s.fixture_id,
                home_team=s.home_team,
                away_team=s.away_team,
                match_date=s.match_date,
                selection_type=s.selection_type,
                odds=s.odds,
                implied_probability=s.implied_probability,
                ai_probability=s.ai_probability,
                edge=s.edge,
                result=s.result
            )
            for s in coupon.selections
        ],
        created_at=coupon.created_at,
        resolved_at=coupon.resolved_at
    )


@router.get("/daily", response_model=list[CouponListResponse])
async def get_daily_coupons(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get daily AI-generated coupons (Safe, Balanced, Ambitious)."""
    # In a real app, these would be pre-generated by a background task
    # For now, we'll return a mock or fetch existing ones of type DAILY_*
    result = await db.execute(
        select(Coupon)
        .where(Coupon.coupon_type.like("daily_%"))
        .options(selectinload(Coupon.selections))
        .order_by(Coupon.created_at.desc())
        .limit(3)
    )
    coupons = result.scalars().all()
    
    return [
        CouponListResponse(
            id=c.id,
            coupon_type=c.coupon_type,
            total_odds=c.total_odds,
            success_probability=c.success_probability,
            risk_level=c.risk_level,
            status=c.status,
            selections_count=len(c.selections),
            created_at=c.created_at
        )
        for c in coupons
    ]

@router.get("/", response_model=list[CouponListResponse])
async def list_coupons(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
    offset: int = 0
):
    """List user's coupons."""
    result = await db.execute(
        select(Coupon)
        .where(Coupon.user_id == current_user.id)
        .options(selectinload(Coupon.selections))
        .order_by(Coupon.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    coupons = result.scalars().all()
    
    return [
        CouponListResponse(
            id=c.id,
            coupon_type=c.coupon_type,
            total_odds=c.total_odds,
            success_probability=c.success_probability,
            risk_level=c.risk_level,
            status=c.status,
            selections_count=len(c.selections),
            created_at=c.created_at
        )
        for c in coupons
    ]


@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get coupon details."""
    logger.info(f"📋 Fetching coupon {coupon_id} for user {current_user.email}")
    
    # First, check if the coupon exists at all (without user filter)
    check_result = await db.execute(
        select(Coupon)
        .where(Coupon.id == str(coupon_id))
    )
    exists = check_result.scalar_one_or_none()
    
    if exists:
        logger.info(f"🔍 Coupon found in DB with user_id: {exists.user_id}, current_user.id: {current_user.id}")
    else:
        logger.warning(f"🔍 Coupon {coupon_id} does NOT exist in database")
    
    result = await db.execute(
        select(Coupon)
        .where(
            Coupon.id == str(coupon_id),
            Coupon.user_id == current_user.id
        )
        .options(selectinload(Coupon.selections))
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        logger.warning(f"❌ Coupon {coupon_id} not found or access denied for user {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    logger.info(f"✅ Coupon {coupon_id} retrieved successfully")
    return CouponResponse(
        id=coupon.id,
        user_id=coupon.user_id,
        coupon_type=coupon.coupon_type,
        total_odds=coupon.total_odds,

        success_probability=coupon.success_probability,
        risk_level=coupon.risk_level,
        ai_recommendation=coupon.ai_recommendation,
        weak_points=coupon.weak_points,
        ai_analysis=coupon.ai_analysis,
        status=coupon.status,

        matches_won=coupon.matches_won,
        matches_lost=coupon.matches_lost,
        selections=[
            SelectionResponse(
                id=s.id,
                fixture_id=s.fixture_id,
                home_team=s.home_team,
                away_team=s.away_team,
                match_date=s.match_date,
                selection_type=s.selection_type,
                odds=s.odds,
                implied_probability=s.implied_probability,
                ai_probability=s.ai_probability,
                edge=s.edge,
                result=s.result
            )
            for s in coupon.selections
        ],
        created_at=coupon.created_at,
        resolved_at=coupon.resolved_at
    )


@router.put("/{coupon_id}/reanalyze", response_model=CouponResponse)
async def reanalyze_coupon(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    ai_service: AIProvider
):
    """Relancer l'analyse IA d'un coupon existant."""
    logger.info(f"🔄 Relaunching AI analysis for coupon {coupon_id}")
    
    # Récupérer le coupon avec ses sélections
    result = await db.execute(
        select(Coupon)
        .where(
            Coupon.id == str(coupon_id),
            Coupon.user_id == current_user.id
        )
        .options(selectinload(Coupon.selections))
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        logger.warning(f"❌ Coupon {coupon_id} not found for reanalysis")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    # Préparer les données pour l'IA
    matches_for_ai = [
        {
            "home_team": s.home_team,
            "away_team": s.away_team,
            "selection_type": s.selection_type,
            "odds": s.odds
        }
        for s in coupon.selections
    ]
    
    try:
        # Relancer l'analyse IA
        ai_coupon_analysis = await ai_service.analyze_coupon(matches_for_ai)
        
        # Recalculer les probabilités et le risque
        combined_probability = ai_coupon_analysis.get("overall_probability", coupon.success_probability)
        
        # Mettre à jour le niveau de risque
        risk_level = calculate_risk_level(combined_probability, len(coupon.selections))
        if "risk_score" in ai_coupon_analysis:
            if ai_coupon_analysis["risk_score"] < 0.3:
                risk_level = RiskLevel.LOW.value
            elif ai_coupon_analysis["risk_score"] < 0.6:
                risk_level = RiskLevel.MEDIUM.value
            elif ai_coupon_analysis["risk_score"] < 0.85:
                risk_level = RiskLevel.HIGH.value
            else:
                risk_level = RiskLevel.EXTREME.value
        
        # Mettre à jour le coupon
        coupon.success_probability = round(combined_probability, 4)
        coupon.risk_level = risk_level
        coupon.ai_recommendation = ai_coupon_analysis.get("recommendation", coupon.ai_recommendation)
        coupon.ai_analysis = ai_coupon_analysis
        
        # Mettre à jour les weak points si disponibles
        if "weakest_link" in ai_coupon_analysis and ai_coupon_analysis["weakest_link"] != "N/A":
            coupon.weak_points = [ai_coupon_analysis["weakest_link"]]
        
        await db.commit()
        await db.refresh(coupon, attribute_names=["selections"])
        
        logger.info(f"✅ Coupon {coupon_id} reanalyzed successfully")
        
        return CouponResponse(
            id=coupon.id,
            user_id=coupon.user_id,
            coupon_type=coupon.coupon_type,
            total_odds=coupon.total_odds,
            stake=coupon.stake,
            potential_win=coupon.potential_win,
            success_probability=coupon.success_probability,
            risk_level=coupon.risk_level,
            ai_recommendation=coupon.ai_recommendation,
            weak_points=coupon.weak_points,
            ai_analysis=coupon.ai_analysis,
            status=coupon.status,
            matches_won=coupon.matches_won,
            matches_lost=coupon.matches_lost,
            selections=[
                SelectionResponse(
                    id=s.id,
                    fixture_id=s.fixture_id,
                    home_team=s.home_team,
                    away_team=s.away_team,
                    match_date=s.match_date,
                    selection_type=s.selection_type,
                    odds=s.odds,
                    implied_probability=s.implied_probability,
                    ai_probability=s.ai_probability,
                    edge=s.edge,
                    result=s.result
                )
                for s in coupon.selections
            ],
            created_at=coupon.created_at,
            resolved_at=coupon.resolved_at
        )
    except Exception as e:
        logger.error(f"❌ Error reanalyzing coupon {coupon_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reanalyzing coupon: {str(e)}"
        )


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a coupon."""
    result = await db.execute(
        select(Coupon)
        .where(
            Coupon.id == str(coupon_id),
            Coupon.user_id == current_user.id
        )
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    await db.delete(coupon)
    await db.commit()
