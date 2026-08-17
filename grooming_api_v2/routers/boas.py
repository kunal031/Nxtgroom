from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from auth import get_current_user, get_password_hash
from models import BOACreate, BOASchema, BOAUpdate, UserSchema, RoleEnum
from utils import get_db_id

router = APIRouter(prefix="/api/v2/boas", tags=["BOAs"])

@router.post("")
async def create_boa(boa_in: BOACreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != RoleEnum.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Only Super Admin can create BOAs")
    
    db = get_db()
    
    if await db.users.find_one({"email": boa_in.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    if await db.boas.find_one({"employee_id": boa_in.employee_id}):
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    new_boa = BOASchema(
        employee_id=boa_in.employee_id,
        name=boa_in.name,
        college_id=boa_in.college_id,
        phone_no=boa_in.phone_no
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

@router.get("")
async def list_boas(current_user: dict = Depends(get_current_user)):
    db = get_db()
    boas = await db.boas.find({}).to_list(length=1000)
    for boa in boas:
        boa["_id"] = str(boa["_id"])
        boa_db_id = get_db_id(boa["_id"])
        user = await db.users.find_one({"$or": [{"reference_id": boa["_id"]}, {"reference_id": boa_db_id}]})
        if user:
            boa["email"] = user.get("email", "")
    return boas

@router.put("/{boa_id}")
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
        "college_id": boa_in.college_id,
        "phone_no": boa_in.phone_no
    }
    
    await db.boas.update_one({"_id": existing_boa["_id"]}, {"$set": update_data})
    
    user_update_data = {"email": boa_in.email}
    if boa_in.password:
        user_update_data["password_hash"] = get_password_hash(boa_in.password)
        
    await db.users.update_one({"reference_id": existing_boa["_id"]}, {"$set": user_update_data})
    
    return {"message": "BOA updated successfully"}

@router.delete("/{boa_id}")
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
