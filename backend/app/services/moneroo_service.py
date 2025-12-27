import requests
import json
import logging
import hmac
import hashlib
from typing import Optional, Dict, Any

from app.core.config import get_settings
from app.models.user import User

settings = get_settings()
logger = logging.getLogger(__name__)

class MonerooService:
    """Service to handle Moneroo payments (Mobile Money)."""
    
    def __init__(self):
        self.base_url = "https://api.moneroo.io/v1"
        self.secret_key = settings.moneroo_api_key
        self.webhook_secret = settings.moneroo_webhook_secret
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.secret_key}",
            "Accept": "application/json"
        }

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Moneroo webhook signature."""
        if not self.webhook_secret or not signature:
            return False
            
        expected_signature = hmac.new(
            self.webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)

    async def create_checkout_session(
        self, 
        user: User, 
        plan_type: str, 
        amount: float, 
        currency: str,
        success_url: str, 
        cancel_url: str
    ) -> Optional[str]:
        """Initialize a Moneroo payment."""
        if not self.secret_key:
            logger.error("Moneroo API key not configured")
            return None
            
        data = {
            "amount": amount,
            "currency": currency,
            "description": f"Abonnement FootIntel - {plan_type.capitalize()}",
            "customer": {
                "email": user.email,
                "first_name": user.full_name.split()[0] if user.full_name and user.full_name.strip() else "Client",
                "last_name": user.full_name.split()[-1] if user.full_name and " " in user.full_name.strip() else "FootIntel"
            },
            "return_url": success_url,
            "metadata": {
                "user_id": str(user.id),
                "plan_type": plan_type
            }
        }
        
        try:
            # Using requests for simplicity as it's a single call, 
            # but httpx would be better for async. 
            # Given the environment, I'll use requests as it's already in requirements.
            response = requests.post(
                f"{self.base_url}/payments/initialize", 
                headers=self.headers, 
                data=json.dumps(data)
            )
            
            if response.status_code == 201:
                result = response.json()
                return result.get("data", {}).get("checkout_url") or result.get("checkout_url")
            else:
                logger.error(f"Moneroo error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Moneroo exception: {e}")
            return None

# Singleton instance
moneroo_service = MonerooService()
