from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import connect_to_mongo, close_mongo_connection, get_db
from models import UserSchema, RoleEnum
from auth import get_password_hash

from routers import auth, boas, colleges, instructors, attendance

app = FastAPI(title="NxtWave Multi-Modal Grooming Standards API V2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    # Create default superadmin if doesn't exist
    db = get_db()
    if db is not None:
        if not await db.users.find_one({"email": "admin@nxtwave.com"}):
            await db.users.insert_one(UserSchema(
                email="admin@nxtwave.com",
                password_hash=get_password_hash("admin@123"),
                role=RoleEnum.SUPER_ADMIN
            ).dict(by_alias=True))
            print("Created default superadmin account.")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include Routers
app.include_router(auth.router)
app.include_router(colleges.router)
app.include_router(boas.router)
app.include_router(instructors.router)
app.include_router(attendance.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the NxtWave V2 Grooming Standards API. Use /docs to test the endpoints."}
