import asyncio
import httpx
from database import connect_to_mongo

async def main():
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://localhost:8000/api/v2/auth/login", data={"username": "admin@nxtwave.com", "password": "admin@123"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
            
        token = resp.json()["access_token"]
        resp = await client.get("http://localhost:8000/api/v2/attendance/today", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 200:
            print(f"Fetch success: {len(resp.json())} records")
        else:
            print(f"Fetch failed: {resp.status_code} - {resp.text}")

asyncio.run(main())
