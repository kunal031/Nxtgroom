import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # Login
        resp = await client.post("http://localhost:8000/api/v2/auth/login", data={"username": "admin@nxtwave.com", "password": "admin@123"})
        token = resp.json()["access_token"]
        
        # Fetch attendance
        resp = await client.get("http://localhost:8000/api/v2/attendance/today", headers={"Authorization": f"Bearer {token}"})
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Count: {len(data)}")
        else:
            print(resp.text)

asyncio.run(main())
