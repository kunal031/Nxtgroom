import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGODB_URI")

client = None
db = None

def get_db():
    return db

async def connect_to_mongo():
    global client, db
    if MONGO_URI:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client.get_default_database("grooming_standards")
        print("Connected to MongoDB cluster.")
    else:
        print("WARNING: MONGODB_URI not set. Running without database.")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection.")
