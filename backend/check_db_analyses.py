
import asyncio
from sqlalchemy import select
from app.db.session import async_session_maker
from app.models import MatchAnalysis, User

async def check_analyses():
    async with async_session_maker() as session:
        # Check all analyses
        result = await session.execute(select(MatchAnalysis).limit(5))
        analyses = result.scalars().all()
        
        print(f"Total analyses found (limit 5): {len(analyses)}")
        for a in analyses:
            print(f"ID: '{a.id}' (len={len(a.id)})")
            print(f"User ID: '{a.user_id}'")
            print(f"Home: {a.home_team} vs Away: {a.away_team}")
            print("-" * 20)
            
        # Check users
        result = await session.execute(select(User).limit(5))
        users = result.scalars().all()
        print(f"Total users found (limit 5): {len(users)}")
        for u in users:
            print(f"User ID: '{u.id}', Email: {u.email}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_analyses())
