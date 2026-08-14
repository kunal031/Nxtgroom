from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import os
import shutil
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId

from database import connect_to_mongo, close_mongo_connection, get_db

def get_db_id(id_str: str):
    try:
        return ObjectId(id_str)
    except InvalidId:
        return id_str

from models import (
    UserSchema, BOASchema, InstructorSchema, AttendanceSchema, EvaluationSchema,
    RoleEnum, BOACreate, BOAUpdate, InstructorCreate, AttendanceCheckOutReq,
    CollegeSchema, CollegeCreate
)
from auth import (
    verify_password, get_password_hash, create_access_token, get_current_user
)
from vision_engine import evaluate_image
from email_service import send_evaluation_email

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

# --- AUTHENTICATION ---

@app.post("/api/v2/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}


# --- BOAS (ADMIN MANAGEMENT) ---

@app.post("/api/v2/boas")
async def create_boa(boa_in: BOACreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != RoleEnum.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can create BOAs")
    
    db = get_db()
    
    if await db.users.find_one({"email": boa_in.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    if await db.boas.find_one({"employee_id": boa_in.employee_id}):
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    new_boa = BOASchema(
        employee_id=boa_in.employee_id,
        name=boa_in.name,
        college_id=boa_in.college_id
    )
    
    await db.boas.insert_one(new_boa.dict(by_alias=True))
    
    new_user = UserSchema(
        email=boa_in.email,
        password_hash=get_password_hash(boa_in.password),
        role=RoleEnum.BOA,
        reference_id=new_boa.id
    )
    await db.users.insert_one(new_user.dict(by_alias=True))
    
    return {"message": "BOA created successfully", "id": new_boa.id}

@app.get("/api/v2/boas")
async def list_boas(current_user: dict = Depends(get_current_user)):
    db = get_db()
    boas = await db.boas.find({}).to_list(length=1000)
    for boa in boas:
        boa["_id"] = str(boa["_id"])
    return boas

@app.put("/api/v2/boas/{boa_id}")
async def update_boa(boa_id: str, boa_in: BOAUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    boa_db_id = get_db_id(boa_id)
    existing_boa = await db.boas.find_one({"$or": [{"_id": boa_id}, {"_id": boa_db_id}]})
    if not existing_boa:
        raise HTTPException(status_code=404, detail="BOA not found")
        
    update_data = {
        "employee_id": boa_in.employee_id,
        "name": boa_in.name,
        "college_id": boa_in.college_id
    }
    
    await db.boas.update_one({"_id": existing_boa["_id"]}, {"$set": update_data})
    
    user_update_data = {"email": boa_in.email}
    if boa_in.password:
        user_update_data["password_hash"] = get_password_hash(boa_in.password)
        
    await db.users.update_one({"reference_id": existing_boa["_id"]}, {"$set": user_update_data})
    
    return {"message": "BOA updated successfully"}

@app.delete("/api/v2/boas/{boa_id}")
async def delete_boa(boa_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    boa_db_id = get_db_id(boa_id)
    existing_boa = await db.boas.find_one({"$or": [{"_id": boa_id}, {"_id": boa_db_id}]})
    if not existing_boa:
        raise HTTPException(status_code=404, detail="BOA not found")
        
    await db.boas.delete_one({"_id": existing_boa["_id"]})
    await db.users.delete_one({"reference_id": existing_boa["_id"]})
    
    return {"message": "BOA deleted successfully"}


# --- COLLEGES ---

@app.post("/api/v2/colleges")
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

@app.get("/api/v2/colleges")
async def list_colleges(current_user: dict = Depends(get_current_user)):
    db = get_db()
    colleges = await db.colleges.find({}).to_list(length=1000)
    for college in colleges:
        college["_id"] = str(college["_id"])
    return colleges

@app.put("/api/v2/colleges/{college_id}")
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

@app.delete("/api/v2/colleges/{college_id}")
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


# --- INSTRUCTORS ---

@app.post("/api/v2/instructors")
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

@app.get("/api/v2/instructors")
async def get_instructors(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    query = {}
    if current_user.get("role") == RoleEnum.BOA.value:
        user_doc = await db.users.find_one({"email": current_user["sub"]})
        if user_doc and user_doc.get("reference_id"):
            boa_doc = await db.boas.find_one({"_id": user_doc["reference_id"]})
            if boa_doc and boa_doc.get("college_id"):
                query["college_id"] = boa_doc["college_id"]
                
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


@app.put("/api/v2/instructors/{instructor_id}")
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


@app.delete("/api/v2/instructors/{instructor_id}")
async def delete_instructor(instructor_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    ins_db_id = get_db_id(instructor_id)
    result = await db.instructors.delete_one({"$or": [{"_id": instructor_id}, {"_id": ins_db_id}]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instructor not found")
        
    return {"message": "Instructor deleted successfully"}


# --- ATTENDANCE & BACKGROUND AI ---

async def process_ai_evaluation(attendance_id: str, filepath: str, gender: str, instructor_name: str, instructor_email: str, admin_email: str):
    db = get_db()
    try:
        report = evaluate_image(filepath, gender)
        
        if "error" in report:
            print(f"AI Eval Error: {report['error']}")
            await db.attendance.update_one(
                {"_id": attendance_id}, 
                {"$set": {"status": "failed", "remarks": report["error"]}}
            )
            return
            
        eval_doc = EvaluationSchema(
            attendance_id=attendance_id,
            photo_evidence_url=filepath,
            overall_status=report.get("overall_status"),
            ai_summary=report.get("ai_summary", ""),
            general_idcard_check=report.get("general_idcard_check", []),
            grooming_check=report.get("grooming_check", []),
            attire_check=report.get("attire_check", []),
            accessories_check=report.get("accessories_check", []),
            footwear_check=report.get("footwear_check", [])
        )
        
        await db.evaluations.insert_one(eval_doc.dict(by_alias=True))
        
        status_val = "done"
        await db.attendance.update_one(
            {"_id": attendance_id}, 
            {"$set": {"status": status_val, "remarks": report.get("ai_summary", "")}}
        )
        
        if admin_email:
            send_evaluation_email(admin_email, instructor_name, status_val, report.get("ai_summary", ""))
        if instructor_email:
            send_evaluation_email(instructor_email, instructor_name, status_val, report.get("ai_summary", ""))

    except Exception as e:
        print(f"Background task failed: {e}")
        await db.attendance.update_one({"_id": attendance_id}, {"$set": {"status": "failed", "remarks": "AI processing error"}})

@app.post("/api/v2/attendance/check-in")
async def check_in(
    background_tasks: BackgroundTasks,
    instructor_id: str = Form(...),
    location_coordinates: str = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    instructor_db_id = get_db_id(instructor_id)
    instructor = await db.instructors.find_one({"_id": instructor_db_id})
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    boa_user = await db.users.find_one({"email": current_user["email"]})
    boa_id = boa_user.get("reference_id") if boa_user and boa_user.get("reference_id") else "super-admin"

    now = datetime.now()
    attendance = AttendanceSchema(
        instructor_id=instructor_id,
        boa_id=boa_id,
        date=now,
        check_in_time=now,
        location_coordinates=location_coordinates,
        status="pending",
        remarks="AI Analysis in progress..."
    )
    
    att_doc = attendance.dict(by_alias=True)
    await db.attendance.insert_one(att_doc)

    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    temp_filename = f"{attendance.id}_{now.strftime('%Y%m%d%H%M%S')}.{file_extension}"
    temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
    
    with open(temp_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    instructor_email = instructor.get("email")
    admin_email = current_user["email"]
    background_tasks.add_task(
        process_ai_evaluation, 
        attendance.id, 
        temp_filepath, 
        instructor.get("gender", "MALE"), 
        instructor["name"],
        instructor_email,
        admin_email
    )

    return {"message": "Check-in successful. AI analysis running in background.", "attendance_id": attendance.id}

@app.post("/api/v2/attendance/check-out")
async def check_out(req: AttendanceCheckOutReq, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.attendance.update_many(
        {"instructor_id": req.instructor_id, "check_out_time": None},
        {"$set": {"check_out_time": datetime.now()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No active check-in found for today to check out.")
    return {"message": "Check-out successful."}

@app.get("/api/v2/attendance/today")
async def get_today_attendance(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    query = {}
    if date:
        try:
            start_date = datetime.strptime(date, "%Y-%m-%d")
            end_date = start_date + timedelta(days=1)
            query["check_in_time"] = {"$gte": start_date, "$lt": end_date}
        except ValueError:
            pass
            
    if current_user.get("role") == RoleEnum.BOA.value:
        user_doc = await db.users.find_one({"email": current_user["sub"]})
        if user_doc and user_doc.get("reference_id"):
            boa_doc = await db.boas.find_one({"_id": user_doc["reference_id"]})
            if boa_doc and boa_doc.get("college_id"):
                college_id = boa_doc["college_id"]
                col_instructors = await db.instructors.find({"college_id": college_id}, {"_id": 1}).to_list(length=1000)
                ins_ids = [str(i["_id"]) for i in col_instructors]
                query["instructor_id"] = {"$in": ins_ids}
            
    attendances = await db.attendance.find(query).sort("check_in_time", -1).limit(500).to_list(length=500)
    
    result = []
    for att in attendances:
        att["_id"] = str(att["_id"])
        ins_db_id = get_db_id(att["instructor_id"])
        ins = await db.instructors.find_one({"$or": [{"_id": att["instructor_id"]}, {"_id": ins_db_id}]})
        if ins:
            att["instructor_name"] = ins.get("name", "Unknown")
            att["instructor_role"] = ins.get("role", "Unknown")
            college_id = ins.get("college_id")
            if college_id:
                col_db_id = get_db_id(college_id)
                col = await db.colleges.find_one({"$or": [{"_id": college_id}, {"_id": col_db_id}]})
                att["college_name"] = col.get("name") if col else "Unknown College"
            else:
                att["college_name"] = "No College"
        else:
            att["instructor_name"] = "Unknown"
            att["instructor_role"] = "Unknown"
            att["college_name"] = "Unknown"
        result.append(att)
        
    return result

@app.get("/api/v2/attendance/{attendance_id}/evaluation")
async def get_evaluation(attendance_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    eval_record = await db.evaluations.find_one({"attendance_id": attendance_id})
    if not eval_record:
        # It's possible the evaluation didn't complete yet or failed
        raise HTTPException(status_code=404, detail="Evaluation not found for this attendance record")
    
    eval_record["_id"] = str(eval_record["_id"])
    return eval_record
def read_root():
    return {"message": "Welcome to the NxtWave V2 Grooming Standards API. Use /docs to test the endpoints."}
