from functools import lru_cache

from .base import BaseFootballProvider, BaseAIProvider
from .football.api_football import ApiFootballProvider
from .football.hybrid_provider import HybridFootballProvider
from .ai.gemini import GeminiAIProvider
from .ai.ollama import OllamaAIProvider
from .ai.openai import OpenAIAIProvider
from app.core.config import get_settings

settings = get_settings()

@lru_cache()
def get_football_provider() -> BaseFootballProvider:
    """
    Returns the configured football data provider.
    
    Now using HybridFootballProvider which combines:
    - Football-Data.org (fixtures) - FREE
    - SofaScore (scores) - Scraping
    - OddsChecker (odds) - Scraping
    - FBref (statistics) - Scraping
    """
    return HybridFootballProvider()

@lru_cache()
def get_ai_provider() -> BaseAIProvider:
    """Returns the configured AI analysis provider."""
    # Choose provider based on AI_PROVIDER setting
    ai_provider = getattr(settings, 'ai_provider', 'ollama').lower()
    
    if ai_provider == 'ollama':
        return OllamaAIProvider()
    elif ai_provider == 'gemini':
        return GeminiAIProvider()
    elif ai_provider == 'openai':
        return OpenAIAIProvider()
    else:
        # Default to Ollama
        return OllamaAIProvider()

