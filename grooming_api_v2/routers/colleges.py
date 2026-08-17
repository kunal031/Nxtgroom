from fastapi import APIRouter, Depends, HTTPException
from typing import List

from database import get_db
from auth import get_current_user
from models import CollegeCreate, CollegeSchema, RoleEnum
from utils import get_db_id

router = APIRouter(prefix="/api/v2/colleges", tags=["Colleges"])

@router.post("")
async def create_college(college_in: CollegeCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_college = CollegeSchema(
        name=college_in.name,
        location=college_in.location
    )
    await db.colleges.insert_one(new_college.dict(by_alias=True))
    return {"message": "College created successfully", "id": new_college.id}

@router.get("")
async def list_colleges(current_user: dict = Depends(get_current_user)):
    db = get_db()
    colleges = await db.colleges.find({}).to_list(length=1000)
    for college in colleges:
        college["_id"] = str(college["_id"])
    return colleges

@router.put("/{college_id}")
async def update_college(college_id: str, college_in: CollegeCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    col_db_id = get_db_id(college_id)
    existing = await db.colleges.find_one({"$or": [{"_id": college_id}, {"_id": col_db_id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="College not found")
        
    await db.colleges.update_one(
        {"_id": existing["_id"]},
        {"$set": {"name": college_in.name, "location": college_in.location}}
    )
    return {"message": "College updated successfully"}

@router.delete("/{college_id}")
async def delete_college(college_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    col_db_id = get_db_id(college_id)
    existing = await db.colleges.find_one({"$or": [{"_id": college_id}, {"_id": col_db_id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="College not found")
        
    await db.colleges.delete_one({"_id": existing["_id"]})
    return {"message": "College deleted successfully"}
