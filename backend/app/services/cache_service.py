import redis.asyncio as redis
import json
from typing import Any

from app.core.config import get_settings
from app.core.logger import get_logger

settings = get_settings()
logger = get_logger('services.cache')


class CacheService:
    """Redis cache service."""
    
    def __init__(self):
        self._redis: redis.Redis | None = None
    
    async def get_redis(self) -> redis.Redis:
        """Get Redis connection."""
        if self._redis is None:
            logger.debug("🔌 Establishing Redis connection")
            self._redis = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("✅ Redis connection established")
        return self._redis
    
    async def get(self, key: str) -> Any | None:
        """Get a value from cache."""
        r = await self.get_redis()
        value = await r.get(key)
        
        if value:
            logger.log_cache('GET', key, hit=True)
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        
        logger.log_cache('GET', key, hit=False)
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        expire: int = 3600  # 1 hour default
    ) -> None:
        """Set a value in cache."""
        r = await self.get_redis()
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        await r.set(key, value, ex=expire)
        
        logger.log_cache('SET', key)
        logger.debug(
            f"💾 Cached: {key} (TTL: {expire}s)",
            extra={'extra_data': {
                'key': key,
                'ttl': expire
            }}
        )
    
    async def delete(self, key: str) -> None:
        """Delete a key from cache."""
        r = await self.get_redis()
        await r.delete(key)
        logger.log_cache('DELETE', key)
    
    async def exists(self, key: str) -> bool:
        """Check if a key exists."""
        r = await self.get_redis()
        exists = await r.exists(key) > 0
        logger.log_cache('EXISTS', key, hit=exists)
        return exists
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            logger.info("🔌 Redis connection closed")


# Cache TTL constants (in seconds)
CACHE_TTL = {
    "fixtures": 15 * 60,       # 15 minutes
    "statistics": 60 * 60,      # 1 hour
    "h2h": 24 * 60 * 60,        # 24 hours
    "team_stats": 6 * 60 * 60,  # 6 hours
    "odds": 30 * 60,            # 30 minutes
    "injuries": 60 * 60,        # 1 hour
}


# Singleton instance
cache_service = CacheService()
