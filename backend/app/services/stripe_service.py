import stripe
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.core.config import get_settings
from app.models.user import User, SubscriptionType

settings = get_settings()
logger = logging.getLogger(__name__)

if settings.stripe_api_key:
    stripe.api_key = settings.stripe_api_key

class StripeService:
    """Service to handle Stripe payments and subscriptions."""
    
    @staticmethod
    async def get_or_create_customer(user: User) -> Optional[str]:
        """Get existing Stripe customer or create new one."""
        if not stripe.api_key:
            return None
            
        if user.stripe_customer_id:
            try:
                # Verify customer exists
                stripe.Customer.retrieve(user.stripe_customer_id)
                return user.stripe_customer_id
            except Exception as e:
                logger.warning(f"Customer {user.stripe_customer_id} not found, creating new: {e}")
        
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name or user.email,
                metadata={"user_id": str(user.id)}
            )
            return customer.id
        except Exception as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            return None
    
    @staticmethod
    async def create_checkout_session(user: User, plan_type: str, success_url: str, cancel_url: str) -> Optional[str]:
        """Create a Stripe Checkout Session for a subscription."""
        if not stripe.api_key:
            return None
        
        # Map plan_type to price IDs from settings
        prices = {
            "starter": settings.stripe_price_starter,
            "pro": settings.stripe_price_pro,
            "lifetime": settings.stripe_price_lifetime
        }
        
        price_id = prices.get(plan_type.lower())
        if not price_id:
            logger.error(f"No Stripe Price ID configured for plan: {plan_type}")
            return None
        
        # Get or create Stripe customer
        customer_id = await StripeService.get_or_create_customer(user)
        if not customer_id:
            return None
            
        try:
            mode = 'payment' if plan_type.lower() == 'lifetime' else 'subscription'
            
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode=mode,
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": str(user.id),
                    "plan_type": plan_type
                },
                allow_promotion_codes=True,  # Allow coupon codes
                billing_address_collection='auto'
            )
            return session.url
        except Exception as e:
            logger.error(f"Stripe error creating checkout session: {e}")
            return None
    
    @staticmethod
    async def create_portal_session(user: User, return_url: str) -> Optional[str]:
        """Create a Stripe Customer Portal session for managing subscription."""
        if not stripe.api_key or not user.stripe_customer_id:
            return None
        
        try:
            session = stripe.billing_portal.Session.create(
                customer=user.stripe_customer_id,
                return_url=return_url
            )
            return session.url
        except Exception as e:
            logger.error(f"Failed to create portal session: {e}")
            return None
    
    @staticmethod
    async def cancel_subscription(subscription_id: str) -> bool:
        """Cancel a Stripe subscription."""
        if not stripe.api_key or not subscription_id:
            return False
        
        try:
            stripe.Subscription.delete(subscription_id)
            return True
        except Exception as e:
            logger.error(f"Failed to cancel subscription: {e}")
            return False
    
    @staticmethod
    async def get_subscription_details(subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get details of a Stripe subscription."""
        if not stripe.api_key or not subscription_id:
            return None
        
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "canceled_at": subscription.canceled_at
            }
        except Exception as e:
            logger.error(f"Failed to retrieve subscription: {e}")
            return None

    @staticmethod
    def construct_event(payload: bytes, sig_header: str) -> Optional[stripe.Event]:
        """Verify and construct a Stripe event from a webhook payload."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
            return event
        except Exception as e:
            logger.error(f"Stripe webhook verification failed: {e}")
            return None

# Singleton instance
stripe_service = StripeService()
