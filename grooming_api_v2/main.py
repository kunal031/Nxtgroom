from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vision_engine import evaluate_image
import os
import shutil
import uuid
from datetime import datetime
from database import connect_to_mongo, close_mongo_connection, get_db

app = FastAPI(title="NxtWave Multi-Modal Grooming Standards API")

# Allow Frontend to communicate with Backend
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

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

class InstructorCreate(BaseModel):
    uuid: str
    name: str
    role: str
    gender: str

@app.post("/api/v2/instructors")
async def create_instructor(instructor: InstructorCreate):
    """
    Creates a new instructor profile in MongoDB.
    This allows admins to register candidates manually.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    existing = await db.instructors.find_one({"uuid": instructor.uuid})
    if existing:
        raise HTTPException(status_code=400, detail="Instructor with this UUID already exists")
    
    new_doc = {
        "uuid": instructor.uuid,
        "name": instructor.name,
        "role": instructor.role,
        "gender": instructor.gender.upper(),
        "daily_feedbacks": []
    }
    
    await db.instructors.insert_one(new_doc)
    return {"message": "Instructor created successfully", "uuid": instructor.uuid}

@app.get("/api/v2/instructors")
async def get_instructors():
    """
    Fetches all instructors and their historical feedbacks.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    cursor = db.instructors.find({}, {"_id": 0})
    instructors = await cursor.to_list(length=1000)
    return instructors

@app.post("/api/v2/evaluate_grooming")
async def evaluate_grooming(
    uuid: str = Form(..., description="UUID of the existing instructor"),
    file: UploadFile = File(...)
):
    """
    Upload a full-body image of an instructor to evaluate grooming and dress code standards.
    The result will be appended to the instructor's 'daily_feedbacks' array in MongoDB.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    instructor = await db.instructors.find_one({"uuid": uuid})
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found. Create profile first.")

    gender = instructor.get("gender", "MALE")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    temp_filename = f"{uuid}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_extension}"
    temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
    
    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        report = evaluate_image(temp_filepath, gender)
        
        if "error" in report:
            raise HTTPException(status_code=500, detail=report["error"])
            
        # Create feedback record
        feedback_record = {
            "date": datetime.now().strftime('%Y-%m-%d'),
            "overall_status": report.get("overall_status"),
            "detailed_report": report
        }
        
        # Append to MongoDB array
        await db.instructors.update_one(
            {"uuid": uuid},
            {"$push": {"daily_feedbacks": feedback_record}}
        )
            
        return {"message": "Evaluation saved successfully", "report": report}

    finally:
        # Clean up the temporary file
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

@app.get("/")
def read_root():
    return {"message": "Welcome to the NxtWave V2 Grooming Standards API. Use /docs to test the endpoints."}
