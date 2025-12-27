from app.api.v1.auth import router as auth_router
from app.api.v1.analyze import router as analyze_router
from app.api.v1.coupons import router as coupons_router
from app.api.v1.football import router as football_router
from app.api.v1.subscription import router as subscription_router

__all__ = [
    "auth_router",
    "analyze_router",
    "coupons_router",
    "football_router",
    "subscription_router",
]
