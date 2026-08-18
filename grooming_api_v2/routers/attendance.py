from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, BackgroundTasks
import asyncio
import os
import shutil
from datetime import datetime, timedelta, timezone
from typing import Optional
import csv
import io

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    return datetime.now(IST).replace(tzinfo=None)

from database import get_db
from auth import get_current_user
from models import AttendanceCheckOutReq, ExportRequest, AttendanceSchema, EvaluationSchema, RoleEnum
from utils import get_db_id
from vision_engine import evaluate_image
from email_service import send_evaluation_email, send_export_email

router = APIRouter(prefix="/api/v2/attendance", tags=["Attendance"])

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_ai_evaluation(attendance_id: str, filepath: str, gender: str, instructor_name: str, instructor_email: str, admin_email: str):
    db = get_db()
    try:
        loop = asyncio.get_running_loop()
        report = await loop.run_in_executor(None, evaluate_image, filepath, gender)
        
        if "error" in report:
            print(f"AI Eval Error: {report['error']}")
            await db.attendance.update_one(
                {"_id": attendance_id}, 
                {"$set": {"status": "failed", "remarks": report["error"]}}
            )
            return
            
        overall_status_val = str(report.get("overall_status", "COMPLIANT")).upper()
        if overall_status_val not in ["COMPLIANT", "NON_COMPLIANT"]:
            overall_status_val = "NON_COMPLIANT"
            
        tag = report.get("average_performance_tag", "Average")
        eval_doc = EvaluationSchema(
            attendance_id=attendance_id,
            photo_evidence_url=filepath,
            overall_status=overall_status_val,
            ai_summary=report.get("ai_summary", ""),
            attire_type=report.get("attire_type", "Unknown"),
            general_idcard_check=report.get("general_idcard_check", {}),
            grooming_check=report.get("grooming_check", {}),
            attire_check=report.get("attire_check", {}),
            accessories_check=report.get("accessories_check", {}),
            footwear_check=report.get("footwear_check", {})
        )
        
        await db.evaluations.insert_one(eval_doc.dict(by_alias=True))
        
        status_val = "done"
        final_remarks = f"[{tag}] {report.get('ai_summary', '')}"
        
        await db.attendance.update_one(
            {"_id": attendance_id}, 
            {"$set": {"status": status_val, "remarks": final_remarks}}
        )
        
        if admin_email:
            send_evaluation_email(admin_email, instructor_name, status_val, report)
        if instructor_email:
            send_evaluation_email(instructor_email, instructor_name, status_val, report)

    except Exception as e:
        import traceback
        print(f"Background task failed: {e}")
        traceback.print_exc()
        error_msg = f"AI error: {str(e)}"[:150] # Truncate just in case it's too long
        await db.attendance.update_one({"_id": attendance_id}, {"$set": {"status": "failed", "remarks": error_msg}})

@router.post("/check-in")
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

    boa_user = await db.users.find_one({"email": current_user.get("email")})
    boa_id = boa_user.get("reference_id") if boa_user and boa_user.get("reference_id") else "super-admin"

    now = get_ist_now()
    attendance = AttendanceSchema(
        instructor_id=instructor_id,
        boa_id=boa_id,
        date=now,
        check_in_time=now,
        location_coordinates=location_coordinates,
        status="pending",
        remarks="AI Analysis in progress..."
    )
    
    await db.attendance.insert_one(attendance.dict(by_alias=True))

    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    temp_filename = f"{attendance.id}_{now.strftime('%Y%m%d%H%M%S')}.{file_extension}"
    temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
    
    with open(temp_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    instructor_email = instructor.get("email")
    admin_email = current_user.get("email")
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

@router.post("/check-out")
async def check_out(req: AttendanceCheckOutReq, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.attendance.update_many(
        {"instructor_id": req.instructor_id, "check_out_time": None},
        {"$set": {"check_out_time": get_ist_now()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No active check-in found for today to check out.")
    return {"message": "Check-out successful."}

@router.get("/today")
async def get_today_attendance(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    query = {}
    if date:
        try:
            start_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            start_date = get_ist_now().replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = get_ist_now().replace(hour=0, minute=0, second=0, microsecond=0)
        
    end_date = start_date + timedelta(days=1)
    query["check_in_time"] = {"$gte": start_date, "$lt": end_date}
            
    if current_user.get("role") == RoleEnum.BOA.value:
        user_doc = await db.users.find_one({"email": current_user.get("email")})
        if user_doc and user_doc.get("reference_id"):
            boa_db_id = get_db_id(user_doc["reference_id"])
            boa_doc = await db.boas.find_one({"$or": [{"_id": user_doc["reference_id"]}, {"_id": boa_db_id}]})
            if boa_doc and boa_doc.get("college_id"):
                c_id = boa_doc["college_id"]
                c_db_id = get_db_id(c_id)
                col_instructors = await db.instructors.find({"college_id": {"$in": [c_id, str(c_id), c_db_id]}}, {"_id": 1}).to_list(length=1000)
                ins_ids = []
                for i in col_instructors:
                    ins_ids.append(str(i["_id"]))
                    ins_ids.append(i["_id"])
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

@router.post("/export")
async def export_attendance(req: ExportRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    db = get_db()
    query = {}
    if req.date_from and req.date_to:
        start_date = datetime.strptime(req.date_from, "%Y-%m-%d")
        end_date = datetime.strptime(req.date_to, "%Y-%m-%d") + timedelta(days=1)
        query["check_in_time"] = {"$gte": start_date, "$lt": end_date}
        
    if req.colleges and len(req.colleges) > 0:
        ins_in_colleges = await db.instructors.find({"college_id": {"$in": req.colleges}}, {"_id": 1}).to_list(1000)
        ins_ids = [str(i["_id"]) for i in ins_in_colleges]
        query["instructor_id"] = {"$in": ins_ids}
        
    if current_user.get("role") == RoleEnum.BOA.value:
        user_doc = await db.users.find_one({"email": current_user.get("email")})
        boa_doc = await db.boas.find_one({"_id": user_doc["reference_id"]})
        if boa_doc and boa_doc.get("college_id"):
            col_instructors = await db.instructors.find({"college_id": boa_doc["college_id"]}, {"_id": 1}).to_list(1000)
            ins_ids = [str(i["_id"]) for i in col_instructors]
            query["instructor_id"] = {"$in": ins_ids}
            
    attendances = await db.attendance.find(query).sort("check_in_time", -1).to_list(length=10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Instructor Name", "Role", "College", "Status", "Check-In Time", "Check-Out Time", "Remarks"])
    
    for att in attendances:
        ins_db_id = get_db_id(att["instructor_id"])
        ins = await db.instructors.find_one({"$or": [{"_id": att["instructor_id"]}, {"_id": ins_db_id}]})
        
        ins_name = "Unknown"
        role = "Unknown"
        col_name = "Unknown"
        
        if ins:
            ins_name = ins.get("name", "Unknown")
            role = ins.get("role", "Unknown")
            col_id = ins.get("college_id")
            if col_id:
                col_db_id = get_db_id(col_id)
                col = await db.colleges.find_one({"$or": [{"_id": col_id}, {"_id": col_db_id}]})
                col_name = col.get("name", "Unknown") if col else "Unknown"
                
        date_str = att.get("date").strftime("%Y-%m-%d") if att.get("date") else ""
        check_in_str = att.get("check_in_time").strftime("%H:%M:%S") if att.get("check_in_time") else ""
        check_out_str = att.get("check_out_time").strftime("%H:%M:%S") if att.get("check_out_time") else "--"
        
        writer.writerow([
            date_str, ins_name, role, col_name, att.get("status", "Unknown"),
            check_in_str, check_out_str, att.get("remarks", "")
        ])
        
    csv_content = output.getvalue()
    
    if req.send_to_email:
        background_tasks.add_task(send_export_email, req.send_to_email, csv_content)
        return {"message": f"Export initiated. Email will be sent to {req.send_to_email}", "csv": None}
        
    return {"csv": csv_content}

@router.get("/{attendance_id}/evaluation")
async def get_evaluation(attendance_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    eval_record = await db.evaluations.find_one({"attendance_id": attendance_id})
    if not eval_record:
        raise HTTPException(status_code=404, detail="Evaluation not found for this attendance record")
    
    eval_record["_id"] = str(eval_record["_id"])
    return eval_record
