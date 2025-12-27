
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY")
BASE_URL = "https://v3.football.api-sports.io"

async def test_fixtures():
    headers = {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io"
    }
    async with httpx.AsyncClient() as client:
        # Test getting next fixtures for Manchester City (team 50)
        print("Fetching fixtures for team 50...")
        params = {"team": "50", "next": "5"}
        response = await client.get(f"{BASE_URL}/fixtures", headers=headers, params=params)
        print(f"Status: {response.status_code}")
        data = response.json()
        fixtures = data.get("response", [])
        print(f"Found {len(fixtures)} fixtures")
        for f in fixtures:
            print(f"ID: {f['fixture']['id']} - {f['teams']['home']['name']} vs {f['teams']['away']['name']} at {f['fixture']['date']}")

if __name__ == "__main__":
    asyncio.run(test_fixtures())
