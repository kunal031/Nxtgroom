from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from auth import get_current_user
from models import InstructorCreate, InstructorSchema, RoleEnum
from utils import get_db_id

router = APIRouter(prefix="/api/v2/instructors", tags=["Instructors"])

@router.post("")
async def create_instructor(ins_in: InstructorCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if await db.instructors.find_one({"employee_id": ins_in.employee_id}):
        raise HTTPException(status_code=400, detail="Instructor Employee ID exists")
        
    new_ins = InstructorSchema(
        employee_id=ins_in.employee_id,
        name=ins_in.name,
        role=ins_in.role,
        gender=ins_in.gender.upper(),
        college_id=ins_in.college_id,
        email=ins_in.email,
        phone_no=ins_in.phone_no
    )
    
    await db.instructors.insert_one(new_ins.dict(by_alias=True))
    return {"message": "Instructor created successfully", "id": new_ins.id}

@router.get("")
async def get_instructors(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    query = {}
    if current_user.get("role") == RoleEnum.BOA.value:
        user_doc = await db.users.find_one({"email": current_user.get("email")})
        if user_doc and user_doc.get("reference_id"):
            boa_db_id = get_db_id(user_doc["reference_id"])
            boa_doc = await db.boas.find_one({"$or": [{"_id": user_doc["reference_id"]}, {"_id": boa_db_id}]})
            if boa_doc and boa_doc.get("college_id"):
                c_id = boa_doc["college_id"]
                c_db_id = get_db_id(c_id)
                query["college_id"] = {"$in": [c_id, str(c_id), c_db_id]}
                
    instructors = await db.instructors.find(query).to_list(length=1000)
    for ins in instructors:
        ins["_id"] = str(ins["_id"])
        ins_db_id = get_db_id(ins["_id"])
        
        # Fetch attendance history for this instructor
        attendances = await db.attendance.find({
            "$or": [
                {"instructor_id": ins["_id"]},
                {"instructor_id": ins_db_id}
            ]
        }).sort("date", -1).to_list(length=100)
        
        feedbacks = []
        for att in attendances:
            date_val = att.get("date")
            if not date_val:
                continue
                
            status_val = att.get("status", "pending")
            overall_status = "FLAGGED" if status_val == "fail" else "COMPLIANT"
            
            feedbacks.append({
                "date": date_val.isoformat() if hasattr(date_val, 'isoformat') else str(date_val),
                "overall_status": overall_status,
                "detailed_report": {
                    "overall_status": overall_status,
                    "ai_summary": att.get("remarks", "")
                }
            })
        ins["daily_feedbacks"] = feedbacks
        
    return instructors

@router.put("/{instructor_id}")
async def update_instructor(instructor_id: str, ins_in: InstructorCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ins_db_id = get_db_id(instructor_id)
    existing = await db.instructors.find_one({"$or": [{"_id": instructor_id}, {"_id": ins_db_id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="Instructor not found")
        
    await db.instructors.update_one(
        {"_id": existing["_id"]},
        {"$set": ins_in.dict()}
    )
    return {"message": "Instructor updated successfully"}

@router.delete("/{instructor_id}")
async def delete_instructor(instructor_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    ins_db_id = get_db_id(instructor_id)
    result = await db.instructors.delete_one({"$or": [{"_id": instructor_id}, {"_id": ins_db_id}]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instructor not found")
        
    return {"message": "Instructor deleted successfully"}
