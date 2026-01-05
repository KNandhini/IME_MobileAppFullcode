import time
from typing import Annotated
 
from app.api.deps import get_analytics_db, get_current_user, get_db
from app.schemas.user import User
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
 
router = APIRouter(prefix="/auth", tags=["Authentication"])
 
@router.get("/secure")
async def secure_data(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    db_analytics: Annotated[AsyncIOMotorDatabase, Depends(get_analytics_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    user_details = await db["userDetails"].find_one({"email": user.email})
    event_data = {
        "type": "login_success",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
        "timestamp": int(time.time()),
    }
    if user_details:
        # Remove the '_id' field as it is not JSON serializable
        user_details.pop("_id", None)
        # Ensure user_details are JSON serializable
        for key, value in user_details.items():
            if isinstance(value, (dict, list, str, int, float, bool)):
                if key not in event_data["user"]:
                    event_data["user"][key] = value
 
    await db_analytics["auth_events"].insert_one(event_data)
    return {"message": "SSO Success!", "user": user}