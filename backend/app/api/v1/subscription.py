import json
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any

from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User, SubscriptionType
from app.schemas.subscription import (
    CheckoutSessionRequest, 
    CheckoutSessionResponse, 
    SubscriptionStatusResponse,
    PricingResponse
)
from app.services.stripe_service import stripe_service
from app.services.moneroo_service import moneroo_service
from app.services.pricing_service import pricing_service

router = APIRouter(prefix="/subscription", tags=["Subscription"])
logger = logging.getLogger(__name__)

@router.get("/pricing", response_model=PricingResponse)
async def get_pricing(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get regional pricing based on user IP."""
    # Get client IP
    client_ip = request.client.host
    # In production, check X-Forwarded-For if behind proxy
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0]
        
    country_code = await pricing_service.get_country_code(client_ip)
    pricing = pricing_service.get_pricing_for_country(country_code)
    
    return {
        "currency": pricing["currency"],
        "symbol": pricing["symbol"],
        "plans": pricing["plans"],
        "country_code": country_code
    }

@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    checkout_data: CheckoutSessionRequest
) -> Any:
    """Create a checkout session (Stripe or Moneroo)."""
    # Get regional pricing to ensure correct amount/currency
    client_ip = "127.0.0.1"
    if request.client:
        client_ip = request.client.host
        
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0]
        
    country_code = await pricing_service.get_country_code(client_ip)
    pricing = pricing_service.get_pricing_for_country(country_code)
    
    amount = pricing["plans"].get(checkout_data.plan_type.lower())
    if not amount:
        raise HTTPException(status_code=400, detail=f"Invalid plan type: {checkout_data.plan_type}")

    # Restriction: Moneroo disponible uniquement en Afrique
    african_countries = [
        'BJ', 'CI', 'SN', 'TG', 'ML', 'NE', 'BF', 'GW',  # Afrique de l'Ouest
        'CM', 'GA', 'CG', 'TD', 'CF', 'GQ',              # Afrique Centrale
        'KE', 'TZ', 'UG', 'RW', 'BI',                    # Afrique de l'Est
        'GH', 'NG', 'ZA', 'MA', 'TN', 'EG'               # Autres pays africains
    ]
    
    if checkout_data.payment_method == "moneroo":
        if country_code not in african_countries:
            raise HTTPException(
                status_code=400, 
                detail="Mobile Money (Moneroo) is only available in African countries. Please use Stripe instead."
            )
        checkout_url = await moneroo_service.create_checkout_session(
            user=current_user,
            plan_type=checkout_data.plan_type,
            amount=amount,
            currency=pricing["currency"],
            success_url=checkout_data.success_url,
            cancel_url=checkout_data.cancel_url
        )
    else:
        checkout_url = await stripe_service.create_checkout_session(
            user=current_user,
            plan_type=checkout_data.plan_type,
            success_url=checkout_data.success_url,
            cancel_url=checkout_data.cancel_url
        )
    
    if not checkout_url:
        method_name = "Moneroo" if checkout_data.payment_method == "moneroo" else "Stripe"
        raise HTTPException(
            status_code=400, 
            detail=f"Could not create {method_name} checkout session. Check if API keys are configured."
        )
        
    return {"checkout_url": checkout_url}

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Handle Stripe webhooks."""
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
    payload = await request.body()
    event = stripe_service.construct_event(payload, stripe_signature)
    
    if not event:
        raise HTTPException(status_code=400, detail="Invalid payload or signature")
    
    logger.info(f"Received Stripe webhook: {event.type}")
    
    # Handle checkout.session.completed
    if event.type == "checkout.session.completed":
        session = event.data.object
        user_id = session.metadata.get("user_id")
        plan_type = session.metadata.get("plan_type")
        
        if user_id and plan_type:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if user:
                user.subscription = plan_type.lower()
                user.stripe_customer_id = session.customer
                user.stripe_subscription_id = session.subscription
                user.payment_method = 'stripe'  # Stripe = renouvellement automatique
                
                # Set expiration for lifetime plan (100 years) or subscription
                if plan_type.lower() == "lifetime":
                    user.subscription_expires_at = datetime.utcnow() + timedelta(days=36500)
                else:
                    # For subscriptions, expiration is managed by Stripe
                    user.subscription_expires_at = None
                
                await db.commit()
                logger.info(f"User {user_id} upgraded to {plan_type}")
    
    # Handle subscription updated (renewal, change)
    elif event.type == "customer.subscription.updated":
        subscription = event.data.object
        customer_id = subscription.customer
        
        result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        user = result.scalar_one_or_none()
        
        if user:
            # Update subscription status
            if subscription.status == "active":
                user.subscription_expires_at = datetime.fromtimestamp(subscription.current_period_end)
            elif subscription.status in ["canceled", "unpaid", "past_due"]:
                # Downgrade to free if subscription fails
                if subscription.cancel_at_period_end:
                    user.subscription_expires_at = datetime.fromtimestamp(subscription.current_period_end)
            
            await db.commit()
            logger.info(f"Subscription updated for customer {customer_id}: {subscription.status}")
    
    # Handle subscription deleted (cancellation)
    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        customer_id = subscription.customer
        
        result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        user = result.scalar_one_or_none()
        
        if user:
            # Downgrade to free
            user.subscription = SubscriptionType.FREE.value
            user.subscription_expires_at = None
            user.stripe_subscription_id = None
            
            await db.commit()
            logger.info(f"Subscription canceled for customer {customer_id}")
    
    # Handle payment failed
    elif event.type == "invoice.payment_failed":
        invoice = event.data.object
        customer_id = invoice.customer
        
        result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        user = result.scalar_one_or_none()
        
        if user:
            logger.warning(f"Payment failed for user {user.id} ({user.email})")
            # Optionally send email notification
                
    return {"status": "success"}

@router.post("/webhook/moneroo")
async def moneroo_webhook(
    request: Request,
    x_moneroo_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Handle Moneroo webhooks."""
    payload_bytes = await request.body()
    
    if not moneroo_service.verify_signature(payload_bytes, x_moneroo_signature):
        logger.warning(f"Invalid Moneroo signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    payload = json.loads(payload_bytes)
    event = payload.get("event")
    data = payload.get("data", {})
    
    logger.info(f"Received Moneroo webhook: {event}")
    
    if event == "payment.success":
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan_type = metadata.get("plan_type")
        
        if user_id and plan_type:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if user:
                user.subscription = plan_type.lower()
                user.payment_method = 'moneroo'  # Moneroo = renouvellement MANUEL
                
                # Set expiration for lifetime plan (100 years) or 30 days for others
                if plan_type.lower() == "lifetime":
                    user.subscription_expires_at = datetime.utcnow() + timedelta(days=36500)
                else:
                    # Moneroo: paiement mensuel MANUEL, expiration dans 30 jours
                    user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
                
                await db.commit()
                logger.info(f"User {user_id} upgraded to {plan_type} via Moneroo")
                
    return {"status": "success"}

@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get the current user's subscription status."""
    is_active = True
    
    # Check if subscription has expired
    if current_user.subscription_expires_at:
        is_active = current_user.subscription_expires_at > datetime.utcnow()
        
        # Auto-downgrade if expired
        if not is_active and current_user.subscription != SubscriptionType.FREE.value:
            # This should be handled by a background job, but as a safety check:
            logger.warning(f"User {current_user.id} subscription expired, should be downgraded")
    
    return {
        "plan": current_user.subscription,
        "expires_at": current_user.subscription_expires_at.isoformat() if current_user.subscription_expires_at else None,
        "is_active": is_active
    }

@router.post("/portal", response_model=CheckoutSessionResponse)
async def create_portal_session(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a Stripe Customer Portal session for managing subscription."""
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=400, 
            detail="No active Stripe subscription found"
        )
    
    return_url = request.headers.get("referer") or f"{request.base_url}dashboard"
    
    portal_url = await stripe_service.create_portal_session(
        user=current_user,
        return_url=return_url
    )
    
    if not portal_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to create portal session"
        )
    
    return {"checkout_url": portal_url}

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Cancel the current user's subscription."""
    if not current_user.stripe_subscription_id:
        raise HTTPException(
            status_code=400,
            detail="No active subscription to cancel"
        )
    
    success = await stripe_service.cancel_subscription(current_user.stripe_subscription_id)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to cancel subscription"
        )
    
    # Update user in DB
    current_user.subscription = SubscriptionType.FREE.value
    current_user.subscription_expires_at = None
    current_user.stripe_subscription_id = None
    
    await db.commit()
    
    return {"status": "success", "message": "Subscription canceled successfully"}
