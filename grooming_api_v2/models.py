from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Literal, List
from datetime import datetime
from enum import Enum
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    BOA = "BOA"

class OverallStatusEnum(str, Enum):
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"

class UserSchema(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    email: EmailStr
    password_hash: str
    role: RoleEnum
    reference_id: Optional[str] = None  # Ref: BOA._id

class CollegeSchema(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    name: str
    location: str

class InstructorSchema(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    employee_id: str
    name: str
    role: str
    gender: str
    college_id: str  # Ref: College._id
    email: Optional[EmailStr] = None
    phone_no: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BOASchema(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    employee_id: str
    name: str
    college_id: str  # Ref: College._id
    phone_no: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AttendanceSchema(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    instructor_id: str  # Ref: Instructor._id
    boa_id: str  # Ref: BOA._id
    date: datetime
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    location_coordinates: Optional[str] = None
    status: Literal["pending", "done", "fail"] = "pending"
    remarks: Optional[str] = None

class EvaluationSchema(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    attendance_id: str  # Ref: Attendance._id
    photo_evidence_url: str
    overall_status: OverallStatusEnum
    ai_summary: str
    attire_type: Optional[str] = None
    general_idcard_check: dict = Field(default_factory=dict)
    grooming_check: dict = Field(default_factory=dict)
    attire_check: dict = Field(default_factory=dict)
    accessories_check: dict = Field(default_factory=dict)
    footwear_check: dict = Field(default_factory=dict)

# --- API Request Models ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum

class CollegeCreate(BaseModel):
    name: str
    location: str

class BOACreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    password: str
    college_id: str
    phone_no: Optional[str] = None

class BOAUpdate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    password: Optional[str] = None
    college_id: str
    phone_no: Optional[str] = None

class InstructorCreate(BaseModel):
    employee_id: str
    name: str
    role: str
    gender: str
    college_id: str
    email: Optional[EmailStr] = None
    phone_no: Optional[str] = None

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyReset(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class ExportRequest(BaseModel):
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    colleges: Optional[List[str]] = None
    send_to_email: Optional[EmailStr] = None

class AttendanceCheckOutReq(BaseModel):
    instructor_id: str
