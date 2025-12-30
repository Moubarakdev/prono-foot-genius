
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.providers.ai.openai import OpenAIAIProvider
from app.core.config import get_settings

async def test_openai():
    load_dotenv()
    settings = get_settings()
    
    if not settings.openai_api_key:
        print("❌ Error: OPENAI_API_KEY not found in settings/.env")
        return

    print(f"🚀 Testing OpenAI Provider with model: {settings.openai_model}")
    provider = OpenAIAIProvider()
    
    try:
        print("📡 Sending test analysis request...")
        result = await provider.analyze_match(
            home_team="Paris Saint Germain",
            away_team="Real Madrid",
            league_name="Champions League",
            match_date="2024-05-01",
            team_stats={{"home": {{"form": "WWW"}}, "away": {{"form": "WWD"}}}},
            h2h_data=[],
            injuries_data=[],
            odds_data=[]
        )
        
        print("✅ Analysis result received:")
        import json
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        print("\n📡 Testing chat functionality...")
        chat_res = await provider.chat_analysis(
            analysis_summary=result["summary"],
            history=[],
            user_question="Qui est le favori selon toi ?"
        )
        print(f"✅ Chat response: {chat_res}")
        
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_openai())
