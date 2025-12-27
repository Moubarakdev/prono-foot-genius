from typing import Dict, Any
import httpx
import logging

logger = logging.getLogger(__name__)

# Pricing configuration by region
# Default is EUR for Europe/Global
PRICING_CONFIG = {
    "default": {
        "currency": "EUR",
        "symbol": "€",
        "plans": {
            "starter": 9.99,
            "pro": 19.99,
            "lifetime": 99.99
        }
    },
    "africa_west": { # XOF - Benin, Ivory Coast, Senegal, etc.
        "currency": "XOF",
        "symbol": "CFA",
        "plans": {
            "starter": 3000,
            "pro": 6000,
            "lifetime": 30000
        },
        "countries": ["BJ", "CI", "SN", "TG", "ML", "NE", "BF", "GW"]
    },
    "africa_central": { # XAF - Cameroon, Gabon, etc.
        "currency": "XAF",
        "symbol": "CFA",
        "plans": {
            "starter": 3000,
            "pro": 6000,
            "lifetime": 30000
        },
        "countries": ["CM", "GA", "CG", "TD", "CF", "GQ"]
    },
    "us": {
        "currency": "USD",
        "symbol": "$",
        "plans": {
            "starter": 9.99,
            "pro": 19.99,
            "lifetime": 99.99
        },
        "countries": ["US", "CA"]
    }
}

class PricingService:
    """Service to handle regional pricing and currency detection."""
    
    @staticmethod
    async def get_country_code(ip_address: str) -> str:
        """Detect country code from IP address."""
        # Handle local/private IPs
        if not ip_address or ip_address in ["127.0.0.1", "localhost"] or ip_address.startswith(("192.168.", "10.", "172.")):
            return "FR" # Default for local dev
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://ipapi.co/{ip_address}/json/", timeout=2.0)
                if response.status_code == 200:
                    return response.json().get("country_code", "FR")
        except Exception as e:
            logger.error(f"IP detection error: {e}")
            
        return "FR"

    @staticmethod
    def get_pricing_for_country(country_code: str) -> Dict[str, Any]:
        """Get pricing configuration for a specific country."""
        for region, config in PRICING_CONFIG.items():
            if region == "default":
                continue
            if country_code in config.get("countries", []):
                return config
                
        return PRICING_CONFIG["default"]

pricing_service = PricingService()
