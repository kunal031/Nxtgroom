from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import random

from database import get_db
from auth import verify_password, create_access_token, get_password_hash
from models import OTPRequest, OTPVerifyReset
from email_service import send_otp_email

router = APIRouter(prefix="/api/v2/auth", tags=["Authentication"])

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@router.post("/forgot-password")
async def forgot_password(req: OTPRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=10)
    
    await db.otp_codes.update_one(
        {"email": req.email},
        {"$set": {"otp": otp, "expiry": expiry}},
        upsert=True
    )
    
    send_otp_email(req.email, otp)
    return {"message": "OTP sent successfully"}

@router.post("/reset-password")
async def reset_password(req: OTPVerifyReset):
    db = get_db()
    otp_doc = await db.otp_codes.find_one({"email": req.email, "otp": req.otp})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if otp_doc["expiry"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    hashed_pw = get_password_hash(req.new_password)
    await db.users.update_one({"email": req.email}, {"$set": {"password_hash": hashed_pw}})
    await db.otp_codes.delete_one({"email": req.email})
    
    return {"message": "Password reset successfully"}
