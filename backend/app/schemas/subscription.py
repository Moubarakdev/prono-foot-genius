from pydantic import BaseModel
from typing import Optional

class CheckoutSessionRequest(BaseModel):
    plan_type: str  # starter, pro, lifetime
    payment_method: str = "stripe"  # stripe, moneroo
    success_url: str
    cancel_url: str

class PlanPricing(BaseModel):
    starter: float
    pro: float
    lifetime: float

class PricingResponse(BaseModel):
    currency: str
    symbol: str
    plans: PlanPricing
    country_code: str

class CheckoutSessionResponse(BaseModel):
    checkout_url: str

class SubscriptionStatusResponse(BaseModel):
    plan: str
    expires_at: Optional[str] = None
    is_active: bool = True

class SubscriptionDetailsResponse(BaseModel):
    plan: str
    status: str
    expires_at: Optional[str] = None
    cancel_at_period_end: bool = False
    analyses_limit: int
    analyses_used: int
