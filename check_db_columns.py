import asyncio
from sqlalchemy import create_all, inspect, text
from sqlalchemy.ext.asyncio import create_async_engine
import os

DATABASE_URL = "mysql+aiomysql://root:rootpassword@localhost:3307/couponfoot"

async def check_db():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("DESCRIBE users"))
        columns = result.fetchall()
        print("\nColumns in 'users' table:")
        for col in columns:
            print(f"- {col[0]} ({col[1]})")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
